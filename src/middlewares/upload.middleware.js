import multer from 'multer';
import fs from 'fs';
import path from 'path';

const frontendDir = path.resolve(process.env.FRONTEND_DIR);
const uploadDir = path.join(frontendDir, 'src/assets/uploads');

// Créer le dossier d'upload s'il n'existe pas
const ensureUploadDirExists = () => {
    if (!fs.existsSync(uploadDir)) {
        // Créer le chemin de répertoire récursivement
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`Dossier d'upload créé : ${uploadDir}`);
    }
};

// S'assurer que le dossier existe avant de configurer multer
ensureUploadDirExists();

// Configuration du stockage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Vérifier à nouveau au moment de l'upload (par prudence)
        ensureUploadDirExists();
        cb(null, uploadDir);
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