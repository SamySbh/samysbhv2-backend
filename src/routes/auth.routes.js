import express from 'express';
import authController from '../controllers/auth.controller.js';
import EmailService from '../services/email.service.js';
import { registerValidator, loginValidator, updateProfileValidator } from '../schemas/auth.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const authRouter = express.Router();

//Inscription d'un utilisateur (POST /auth/register)
authRouter.post('/register', zodValidator(registerValidator), authController.register);

//Connexion d'un utilisateur (POST /auth/login)
authRouter.post('/login', zodValidator(loginValidator), authController.login);

//Récupération d'un profil utilisateur (GET /auth/profile)
authRouter.get('/profile', protect, authController.getProfile);

//Modification d'un profil utilisateur (PUT /auth/profile)
authRouter.put('/profile', protect, zodValidator(updateProfileValidator), authController.updateProfile);


//Envoie d'un email de vérification
authRouter.post('/send-verification-mail', EmailService.sendVerificationEmail);

//Vérification d'un email utilisateur (GET /auth/verify-email)
authRouter.get('/verify-email', authController.verifyEmail);


export default authRouter;