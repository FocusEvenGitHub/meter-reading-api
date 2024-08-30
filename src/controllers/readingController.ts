import { Request, Response } from 'express';
import { uploadImage, confirmReading, listReadings } from '../services/readingService';

export const uploadImageController = async (req: Request, res: Response) => {
    try {
        await uploadImage(req, res);
    } catch (error) {
        res.status(500).json({ message: 'Error processing image.' });
    }
};

export const confirmReadingController = async (req: Request, res: Response) => {
    try {
        await confirmReading(req, res);
    } catch (error) {
        res.status(500).json({ message: 'Error confirming reading.' });
    }
};

export const listReadingsController = async (req: Request, res: Response) => {
    try {
        await listReadings(req, res);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving measures.' });
    }
};
