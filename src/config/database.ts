import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Reading } from '../models/Reading';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Configuração do DataSource
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true, // Somente para desenvolvimento. Use migrations em produção.
  logging: false,
  entities: [Reading], // Importar aqui as entidades necessárias
  migrations: ['src/migration/**/*.ts'],
  subscribers: ['src/subscriber/**/*.ts'],
});

// Função para inicializar a conexão com o banco de dados
const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Connected to MySQL');
  } catch (err) {
    console.error('MySQL connection error:', err);
    process.exit(1); // Encerra o processo em caso de erro
  }
};

export { AppDataSource, initializeDatabase };
