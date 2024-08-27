import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/readingController';

const router = Router();

// Configuração do Multer para fazer upload das imagens
const upload = multer({ dest: 'uploads/' });

// Rota para upload da imagem do medidor
router.post('/upload', upload.single('image'), uploadImage);

// Rota padrão (opcional)
  
router.get('/', (req, res) => {
  res.send('Google API is running');
});

// Outras rotas podem ser adicionadas aqui
// Exemplo:
// router.get('/readings', getReadings);

export default router;
