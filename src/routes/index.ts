import { Router } from 'express';
import multer from 'multer';
import { uploadImageController, confirmReadingController, listReadingsController } from '../controllers/readingController';
import { validateUploadData, errorHandler } from '../middlewares/errorHandler';

// Configuração do multer para o upload de arquivos
const upload = multer({ dest: 'uploads/' });

const router = Router();

router.post('/upload', upload.single('image'), validateUploadData, uploadImageController);

router.patch('/confirm', confirmReadingController);

router.get('/:customerCode/list', listReadingsController);

router.use(errorHandler);

export default router;
