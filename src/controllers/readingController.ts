import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises'; 
import { runGeminiModel } from '../services/geminiService';
import { Reading } from '../models/Reading';
import { AppDataSource } from '../index';

// Função para mapear tipos MIME para extensões de arquivo
const getExtensionFromMimeType = (mimetype: string): string => {
    const mimeTypes: { [key: string]: string } = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/bmp': '.bmp',
        'image/tiff': '.tiff',
        // Adicione outros tipos MIME conforme necessário
    };
    return mimeTypes[mimetype] || '';
};

// Configuração do multer com armazenamento personalizado
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const ext = getExtensionFromMimeType(file.mimetype);
        const filename = `${Date.now()}${ext || ''}`; // Aplicar a extensão se possível
        cb(null, filename);
    }
});

const upload = multer({ storage });

export const uploadImage = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "Não existe imagem ou é inválida"
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
        // Caminho do arquivo com a extensão correta
        let filePath = path.join(__dirname, '../../uploads', req.file.filename);

        // Forçar a extensão correta se estiver faltando
        const extension = getExtensionFromMimeType(req.file.mimetype);
        if (extension && !filePath.endsWith(extension)) {
            const correctedFilePath = `${filePath}${extension}`;
            await fs.rename(filePath, correctedFilePath); // Renomear para adicionar a extensão correta
            filePath = correctedFilePath;
        }

        // Log do caminho do arquivo para verificação
        console.log(`Arquivo salvo em: ${filePath}`);

        // Processar a imagem com o modelo Gemini
        const result = await runGeminiModel({
            path: filePath,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype
        });

        const readingNumber = parseFloat(result);
        const measureDate = new Date(measure_datetime);
        const month = measureDate.getMonth() + 1;
        const year = measureDate.getFullYear();

        // Verificar se a leitura já existe
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

        const newReading = new Reading();
        newReading.customerCode = customer_code;
        newReading.measureDateTime = measureDate;
        newReading.type = measure_type;
        newReading.imageUrl = `uploads/${path.basename(filePath)}`;
        newReading.month = month;
        newReading.year = year;
        newReading.reading = readingNumber;
        await AppDataSource.getRepository(Reading).save(newReading);


        res.status(200).json({
            image_url: newReading.imageUrl,
            measure_value: newReading.reading,
            measure_uuid: newReading.id
        });

    } catch (error) {
        console.error('Erro ao processar a imagem:', error.message);
        res.status(500).json({ message: 'Erro ao processar a imagem.' });
    }
};

export const confirmReading = async (req: Request, res: Response): Promise<Response> => {
    const { measure_uuid, confirmed_value } = req.body;


    if (!measure_uuid || typeof measure_uuid !== 'string' || typeof confirmed_value !== 'number') {
        return res.status(400).json({
            error_code: 'INVALID_DATA',
            error_description: 'Os dados fornecidos são inválidos',
        });
    }

    try {
        const readingRepository = AppDataSource.getRepository(Reading);

        const reading = await readingRepository.findOneBy({ id: measure_uuid });
        if (!reading) {
            return res.status(404).json({
                error_code: 'MEASURE_NOT_FOUND',
                error_description: 'Leitura não encontrada',
            });
        }

        if (reading.confirmedValue !== null) {
            return res.status(409).json({
                error_code: 'CONFIRMATION_DUPLICATE',
                error_description: 'Leitura do mês já realizada',
            });
        }

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
