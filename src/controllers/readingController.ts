import { Request, Response } from 'express';
import { AppDataSource } from '../index'; 
import { Reading } from '../models/Reading';
import { runGeminiModel } from '../services/geminiService';
import fs from 'fs';
import path from 'path';

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  const file = req.file;
  const filePath = req.file.path;

  try {
    // Lê o arquivo e converte para Base64
    const file = req.file;
    const fileData = fs.readFileSync(filePath);
    const base64Image = fileData.toString('base64');
    const mimeType = req.file.mimetype;

    // Processa a imagem com o modelo Gemini
    const readingValue = await runGeminiModel(file);

    // Se readingValue é uma string e deve ser um número
    const readingNumber = parseFloat(readingValue); // Converta para número se necessário

    // Verifica se a conversão foi bem-sucedida
    if (isNaN(readingNumber)) {
      throw new Error('Invalid reading value');
    }

    // Salva a leitura na base de dados
    const readingRepository = AppDataSource.getRepository(Reading);
    const reading = new Reading();
    reading.type = 'WATER';  // ou 'gas', dependendo do contexto
    reading.reading = readingNumber; // Atribui o número convertido
    reading.imageUrl = `data:${mimeType};base64,${base64Image}`; // Armazena a imagem em Base64

    await readingRepository.save(reading);

    // Limpa o arquivo após o processamento
    fs.unlinkSync(filePath);

    return res.status(201).json({
      message: 'Image uploaded successfully',
      reading
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).send('Error processing image');
  }
};
