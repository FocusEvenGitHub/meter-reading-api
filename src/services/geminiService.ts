import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const runGeminiModel = async (file: any): Promise<string> => {
  let tempFilePath: string | undefined;

  try {
    // Verifica se o arquivo é uma imagem
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Uploaded file is not an image');
    }

    const fileManager = new GoogleAIFileManager(process.env.API_KEY);

    // Cria um arquivo temporário
    tempFilePath = path.join(os.tmpdir(), `${file.originalname.replace(/\s+/g, '_')}.jpg`);
    const fileData = fs.readFileSync(file.path);
    fs.writeFileSync(tempFilePath, fileData);

    // Faz o upload do arquivo
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: file.mimetype,
      displayName: file.originalname,
    });

    console.log(`Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`);

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Gera o conteúdo usando o arquivo carregado
    const result = await model.generateContent([
      "Write only numbers of this image, if you dont see numbers then let it null",
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
  } finally {
    // Limpa o arquivo temporário, se o caminho for definido
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError.message);
      }
    }
  }
};
