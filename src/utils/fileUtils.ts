// Tipos aceitados do Gemini 1.5 Pro e 1.5 Flash
export const getFileExtension = (mimetype: string): string | undefined => {
    const mimeTypes: { [key: string]: string } = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/heic': '.heic',
        'image/heif': '.heif'
    };

    return mimeTypes[mimetype];
};