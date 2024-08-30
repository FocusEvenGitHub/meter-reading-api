export const getFileExtension = (mimetype: string): string | undefined => {
    const mimeTypes: { [key: string]: string } = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif'
    };

    return mimeTypes[mimetype];
};
