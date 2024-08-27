import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";


export const runGeminiModel = async (file: any): Promise<string> => {
    
    try {
        const fileManager = new GoogleAIFileManager(process.env.API_KEY);

        const filesData = fs.readFileSync(file.path);

        const base64String = filesData.toString('base64');

        // Convert base64 string to binary data
        const fileData = Buffer.from(base64String, 'base64');

        // Create a temporary file to store the binary data
        const tempFilePath = path.join(os.tmpdir(), `${file.originalname.replace(/\s+/g, '_')}.jpg`);
        fs.writeFileSync(tempFilePath, fileData);

        // Upload the file using the file path
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: file.mimetype,
            displayName: file.originalname,
        });

        // Clean up: remove the temporary file
        fs.unlinkSync(tempFilePath);

        // Log the result of the upload
        console.log(`Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`);


        const genAI = new GoogleGenerativeAI(process.env.API_KEY);
        
        // Get the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Generate content using the uploaded file
        const result = await model.generateContent([
          "Me conte sobre essa imagem.",
          {
            fileData: {
              fileUri: uploadResult.file.uri,
              mimeType: file.mimetype,
            },
          },
        ]);

        // Log the response
        console.log(result.response.text());
        return result.response.text();
    } catch (error) {
        console.error('Error running Gemini model:', error.message);
        throw new Error('Failed to process image with Gemini model');
    }
};
