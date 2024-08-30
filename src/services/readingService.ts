import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { runGeminiModel } from './geminiService';
import { Reading } from '../models/Reading';
import { AppDataSource } from '../config/database';
import { getFileExtension } from '../utils/fileUtils';

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

    let filePath = path.join(__dirname, '../../uploads', req.file.filename);

    const extension = getFileExtension(req.file.mimetype);
    if (extension && !filePath.endsWith(extension)) {
        const correctedFilePath = `${filePath}${extension}`;
        await fs.rename(filePath, correctedFilePath); 
        filePath = correctedFilePath;
    }

    const result = await runGeminiModel({
        path: filePath,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype
    });

    const readingNumber = parseFloat(result);
    const measureDate = new Date(measure_datetime);
    const month = measureDate.getMonth() + 1;
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

    const newReading = new Reading();
    newReading.customerCode = customer_code;
    newReading.measureDateTime = measureDate;
    newReading.type = measure_type;
    newReading.imageUrl = `${req.file.filename}${extension}`;
    newReading.month = month;
    newReading.year = year;
    newReading.reading = readingNumber;
    await AppDataSource.getRepository(Reading).save(newReading);

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.status(200).json({
        image_url: baseUrl + `/uploads/`+ newReading.imageUrl,
        measure_value: newReading.reading,
        measure_uuid: newReading.id
    });
};

export const confirmReading = async (req: Request, res: Response) => {
    const { measure_uuid, confirmed_value } = req.body;

    if (!measure_uuid || typeof measure_uuid !== 'string' || typeof confirmed_value !== 'number') {
        return res.status(400).json({
            error_code: 'INVALID_DATA',
            error_description: 'Os dados fornecidos são inválidos',
        });
    }

    const readingRepository = AppDataSource.getRepository(Reading);
    const reading = await readingRepository.findOneBy({ id: measure_uuid });

    if (!reading) {
        return res.status(404).json({
            error_code: 'MEASURE_NOT_FOUND',
            error_description: 'Nenhuma leitura encontrada', // no PDF está "Leitura do mês já realizada" mas deve ser "Nenhuma leitura encontrada"
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

    res.status(200).json({
        success: true,
    });
};

export const listReadings = async (req: Request, res: Response) => {
    const { customerCode } = req.params;
    const { measure_type } = req.query;

    const validTypes: ('WATER' | 'GAS')[] = ['WATER', 'GAS'];
    const typeFilter = measure_type ? (measure_type as string).toUpperCase() as 'WATER' | 'GAS' : undefined;

    if (measure_type && !validTypes.includes(typeFilter)) {
        return res.status(400).json({
            error_code: 'INVALID_TYPE',
            error_description: 'Tipo de medição não permitida'
        });
    }

    const readings = await AppDataSource.getRepository(Reading).find({
        where: {
            customerCode: customerCode,
            ...(typeFilter && { type: typeFilter })
        }
    });

    if (readings.length === 0) {
        return res.status(404).json({
            error_code: 'MEASURES_NOT_FOUND',
            error_description: 'Nenhuma leitura encontrada'
        });
    }

    const measures = readings.map(reading => ({
        measure_uuid: reading.id,
        measure_datetime: reading.measureDateTime,
        measure_type: reading.type,
        has_confirmed: reading.confirmedValue !== null ? reading.confirmedValue : false,
        image_url: reading.imageUrl || ''
    }));

    res.status(200).json({
        customer_code: customerCode,
        measures: measures
    });
};
