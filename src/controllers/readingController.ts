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

const uploadImage = async (req: Request, res: Response) => {
    // Verificar se o arquivo está presente
    if (!req.file) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "No file uploaded."
        });
    }

    const { customer_code, measure_datetime, measure_type } = req.body;


    if (!customer_code || !measure_datetime || !measure_type || (measure_type !== 'WATER' && measure_type !== 'GAS')) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "Missing required fields."
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

export default {
    uploadImage,
};
