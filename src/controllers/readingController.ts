import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { runGeminiModel } from '../services/geminiService';
import { Reading } from '../models/Reading';
import { AppDataSource } from '../index';

// Configuração do multer para o upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads')); // Pasta de uploads
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

export const uploadImage = async (req: Request, res: Response) => {
    // Verificar se o arquivo está presente
    if (!req.file) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "Não existe imagem ou é invalida"
        });
    }

    const { customer_code, measure_datetime, measure_type } = req.body;


    if (!customer_code || !measure_datetime || !measure_type || (measure_type !== 'WATER' && measure_type !== 'GAS')) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "Os dados fornecidos no corpo da requisição são inválidos"
        });
    }

    try {
        // Ler o arquivo e converter para base64
        const filePath = path.join(__dirname, '../../uploads', req.file.filename);
        const fileData = fs.readFileSync(filePath);
        const base64String = fileData.toString('base64');

        // Processar a imagem com o modelo Gemini
        const result = await runGeminiModel({
            path: filePath,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype
        });
        const readingNumber = parseFloat(result);

        // Verificar se já existe uma leitura no banco de dados para o mês e tipo de leitura
        const measureDate = new Date(measure_datetime);
        const month = measureDate.getMonth() + 1; // Meses são baseados em 0
        const year = measureDate.getFullYear();

        const existingReading = await AppDataSource.getRepository(Reading).findOne({
            where: {
                customerCode: customer_code,
                type: measure_type,
                month: month,
                year: year
            }
        });

        if (existingReading) {
            return res.status(409).json({
                error_code: "DOUBLE_REPORT",
                error_description: "Leitura do mês já realizada."
            });
        }

        // Criar nova leitura
        const newReading = new Reading();
        newReading.customerCode = customer_code;
        newReading.measureDateTime = measureDate;
        newReading.type = measure_type;
        newReading.imageUrl = `uploads/${req.file.filename}`;
        newReading.month = month;
        newReading.year = year;
        newReading.reading = readingNumber;
        await AppDataSource.getRepository(Reading).save(newReading);

        // Remover o arquivo temporário
        fs.unlinkSync(filePath);

        // Responder com o formato solicitado
        res.status(200).json({
            image_url: newReading.imageUrl,
            measure_value: newReading.reading,
            measure_uuid: newReading.id
        });

    } catch (error) {
        console.error('Error processing image:', error.message);
        res.status(500).json({ message: 'Error processing image.' });
    }
};


export const confirmReading = async (req: Request, res: Response): Promise<Response> => {
    const { measure_uuid, confirmed_value } = req.body;


    // Validação dos parâmetros enviados
    if (!measure_uuid || typeof measure_uuid !== 'string' || typeof confirmed_value !== 'number') {
        return res.status(400).json({
            error_code: 'INVALID_DATA',
            error_description: 'Os dados fornecidos são inválidos',
        });
    }

    try {
        const readingRepository = AppDataSource.getRepository(Reading);

        // Verificar se o código de leitura informado existe
        const reading = await readingRepository.findOneBy({ id: measure_uuid });
        if (!reading) {
            return res.status(404).json({
                error_code: 'MEASURE_NOT_FOUND',
                error_description: 'Leitura não encontrada',
            });
        }

        // Verificar se o código de leitura já foi confirmado
        if (reading.confirmedValue !== null) {
            return res.status(409).json({
                error_code: 'CONFIRMATION_DUPLICATE',
                error_description: 'Leitura do mês já realizada',
            });
        }

        // Atualizar o valor confirmado
        reading.reading = confirmed_value;
        reading.confirmedValue = true;

        await readingRepository.save(reading);

        return res.status(200).json({
            success: true,
        });

    } catch (error) {
        console.error('Error confirming reading:', error.message);
        return res.status(500).json({
            error_code: 'INTERNAL_SERVER_ERROR',
            error_description: 'Erro ao processar a requisição',
        });
    }
};
export const listReadings = async (req: Request, res: Response) => {
    try {
        const { customerCode } = req.params;
        const { measure_type } = req.query;

        // Validar o parâmetro measure_type, se fornecido
        const validTypes: ('WATER' | 'GAS')[] = ['WATER', 'GAS'];
        const typeFilter = measure_type ? (measure_type as string).toUpperCase() as 'WATER' | 'GAS' : undefined;

        if (measure_type && !validTypes.includes(typeFilter)) {
            return res.status(400).json({
                error_code: 'INVALID_TYPE',
                error_description: 'Tipo de medição não permitida'
            });
        }

        // Buscar as medidas do cliente
        const readings = await AppDataSource.getRepository(Reading).find({
            where: {
                customerCode: customerCode,
                ...(typeFilter && { type: typeFilter })
            }
        });

        // Verificar se foram encontradas leituras
        if (readings.length === 0) {
            return res.status(404).json({
                error_code: 'MEASURES_NOT_FOUND',
                error_description: 'Nenhuma leitura encontrada'
            });
        }

        // Formatar a resposta
        const measures = readings.map(reading => ({
            measure_uuid: reading.id,
            measure_datetime: reading.measureDateTime,
            measure_type: reading.type,
            has_confirmed: reading.confirmedValue !== null ? reading.confirmedValue : false,
            image_url: reading.imageUrl || ''
        }));

        return res.status(200).json({
            customer_code: customerCode,
            measures: measures
        });

    } catch (error) {
        console.error('Error retrieving measures:', error.message);
        return res.status(500).json({
            error_code: 'INTERNAL_SERVER_ERROR',
            error_description: 'Erro interno do servidor'
        });
    }
};

export default {
    uploadImage,
    confirmReading,
    listReadings,
};
