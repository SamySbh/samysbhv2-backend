import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { env } from 'process';

const frontendDir = path.resolve(process.env.FRONTEND_DIR);
const uploadDir = path.join(frontendDir, 'src/assets/uploads');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir); // Assure-toi que ce dossier existe
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `service-${uniqueSuffix}${ext}`);
    }
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Seules les images sont acceptées'), false);
    }
};

// Configuration de l'upload
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: fileFilter
});

export default upload;