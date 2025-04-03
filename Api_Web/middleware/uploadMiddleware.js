// middleware/uploadMiddleware.js
const multer = require('multer');

// Utiliser la mémoire pour stocker les fichiers téléchargés
const storage = multer.memoryStorage(); // Utilisation de la mémoire pour les fichiers

// Filtrage des fichiers acceptés (ici on autorise uniquement les fichiers CSV)
const fileFilter = (req, file, cb) => {
    const fileTypes = /csv/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(file.originalname.toLowerCase());

    if (mimeType && extname) {
        return cb(null, true); // Accepter le fichier
    } else {
        cb(new Error('Seuls les fichiers CSV sont autorisés.'));
    }
};

// Configuration de Multer avec taille limite et filtre de fichier
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024,  // Limite à 5MB
        files: 1 // Limiter à un seul fichier par requête
    }
});

// Exporter l'objet upload pour l'utiliser dans d'autres fichiers
module.exports = upload;