// src/routes/upload.routes.js
import express from 'express';
import uploadController from '../controllers/upload.controller.js';
import upload from '../middlewares/upload.middleware.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';

const uploadRouter = express.Router();

// Route pour uploader une image - nécessite authentification + rôle ADMIN
uploadRouter.post('/image', 
    protect, 
    requireAdmin, 
    upload.single('image'), 
    uploadController.uploadImage
);

export default uploadRouter;