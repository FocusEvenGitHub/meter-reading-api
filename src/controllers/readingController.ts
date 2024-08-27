import { Request, Response } from 'express';
import { AppDataSource } from '../index';
import { Reading } from '../models/Reading';
import { runGeminiModel } from '../services/geminiService';
import fs from 'fs';
import path from 'path';

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  const file = req.file;
  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).send('Uploaded file is not an image');
  }

  const filePath = file.path;

  try {
    // Lê o arquivo e converte para Base64
    const fileData = fs.readFileSync(filePath);
    const base64Image = fileData.toString('base64');
    const mimeType = file.mimetype;

    // Validar Base64 (opcional, dependendo do uso)
    if (!base64Image.match(/^([A-Za-z0-9+/=]+)$/)) {
      return res.status(400).send('Invalid Base64 encoding');
    }

    // Processa a imagem com o modelo Gemini
    const readingValue = await runGeminiModel(file);

    // Se readingValue é uma string e deve ser um número
    const readingNumber = parseFloat(readingValue);

    if (isNaN(readingNumber)) {
      throw new Error('Invalid reading value');
    }

    // Obtenha o mês e o ano atuais
    const now = new Date();
    const month = now.getMonth() + 1; // Janeiro é 0
    const year = now.getFullYear();

    // Verifica se já existe uma leitura para o tipo e o mês atual
    const readingRepository = AppDataSource.getRepository(Reading);
    const existingReading = await readingRepository.findOne({
      where: {
        type: 'water', // ou 'gas', dependendo do contexto
        month,
        year,
      },
    });

    if (existingReading) {
      return res.status(409).send('A reading for this month already exists');
    }

    // Salva a leitura na base de dados
    const reading = new Reading();
    reading.type = 'water';  // ou 'gas', dependendo do contexto
    reading.reading = readingNumber; // Atribui o número convertido
    reading.imageUrl = `data:${mimeType};base64,${base64Image}`; // Armazena a imagem em Base64
    reading.month = month;
    reading.year = year;

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
