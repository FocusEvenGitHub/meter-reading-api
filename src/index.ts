import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import { json } from 'body-parser';
import { DataSource } from 'typeorm';
import routes from './routes';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();
require('dotenv').config();

const app = express();
app.use(json());
app.use('/', routes);

// Configuração do DataSource
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'meter_reading',
  synchronize: true,
  logging: false,
  entities: [
    // Adicione o caminho para suas entidades aqui
    'src/models/**/*.ts'
  ],
  migrations: [
    'src/migration/**/*.ts'
  ],
  subscribers: [
    'src/subscriber/**/*.ts'
  ]
});

// Conectar ao MySQL usando TypeORM
AppDataSource.initialize().then(() => {
  console.log('Connected to MySQL');
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
  });
}).catch(err => {
  console.error('MySQL connection error:', err);
});

// Connect Google Gemini AI 
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});


// DEBUG MODE
const debug = true

if (debug){
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
    console.error('A variável de ambiente API_KEY não está definida.');
    } else {
    console.log(`A chave da API é: ${apiKey}`);
    }   
}