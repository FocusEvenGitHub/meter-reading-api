import express from 'express';
import path from 'path';
import { AppDataSource, initializeDatabase } from './config/database';
import routes from './routes';

// Criação do app express
const app = express();
app.use(express.json());
app.use(express.json({ limit: '200mb' }));

app.use(express.text({ limit: '200mb' }));
app.use(express.urlencoded({limit: "200mb", extended: true, parameterLimit:50000 }));

// Servir arquivos estáticos
// app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configuração das rotas
app.use('/', routes);


// Inicialização do banco de dados e do servidor
initializeDatabase().then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
  });
});
