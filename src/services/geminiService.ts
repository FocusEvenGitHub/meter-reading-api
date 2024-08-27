import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const runGeminiModel = async (file: any): Promise<string> => {
  try {
    // Verifica se o arquivo é uma imagem
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Uploaded file is not an image');
    }

    const fileManager = new GoogleAIFileManager(process.env.API_KEY);

    const fileData = fs.readFileSync(file.path);
    const base64String = fileData.toString('base64');

    // Valida a string Base64 (opcional)
    if (!base64String.match(/^([A-Za-z0-9+/=]+)$/)) {
      throw new Error('Invalid Base64 encoding');
    }

    // Cria um arquivo temporário
    const tempFilePath = path.join(os.tmpdir(), `${file.originalname.replace(/\s+/g, '_')}.jpg`);
    fs.writeFileSync(tempFilePath, Buffer.from(base64String, 'base64'));

    // Faz o upload do arquivo
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: file.mimetype,
      displayName: file.originalname,
    });

    // Limpa o arquivo temporário
    fs.unlinkSync(tempFilePath);

    console.log(`Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`);

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Gera o conteúdo usando o arquivo carregado
    const result = await model.generateContent([
      "Write only numbers of this image",
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: file.mimetype,
        },
      },
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Error running Gemini model:', error.message);
    throw new Error('Failed to process image with Gemini model');
  }
};
