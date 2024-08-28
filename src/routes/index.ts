import { Router } from 'express';
import multer from 'multer';
import readingController from '../controllers/readingController';

// Configuração do multer para o upload de arquivos
const upload = multer({ dest: 'uploads/' });

const router = Router();

// Rota para o upload de imagem
router.post('/upload', upload.single('image'), readingController.uploadImage);
router.patch('/confirm', readingController.confirmReading);
router.get('/:customerCode/list', readingController.listReadings);

export default router;
