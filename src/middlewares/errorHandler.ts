import { Request, Response, NextFunction } from 'express';

export const validateUploadData = (req: Request, res: Response, next: NextFunction) => {
    const { customer_code, measure_datetime, measure_type } = req.body;

    if (!customer_code || !measure_datetime || !measure_type || (measure_type !== 'WATER' && measure_type !== 'GAS')) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "Os dados fornecidos no corpo da requisição são inválidos"
        });
    }
    next();
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Erro interno do servidor' });
};
