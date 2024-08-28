import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import routes from './routes';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
app.use(express.json());

// Servir arquivos estáticos do diretório 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Configuração das rotas
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
