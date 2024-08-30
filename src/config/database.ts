import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Reading } from '../models/Reading';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
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

const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Connected to MySQL');
  } catch (err) {
    console.error('MySQL connection error:', err);
    process.exit(1); 
  }
};

export { AppDataSource, initializeDatabase };
