const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const fileTypes = /csv|text\/csv|application\/vnd.ms-excel/;
    const isCSV = fileTypes.test(file.mimetype) && fileTypes.test(file.originalname.toLowerCase());
    
    isCSV ? cb(null, true) : cb(new Error('Seuls les fichiers CSV sont autorisés'), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    }
});

module.exports = upload;
