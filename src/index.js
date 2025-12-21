import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import serviceRouter from './routes/service.routes.js';
import userRouter from './routes/user.routes.js';
import orderRouter from './routes/order.routes.js';
import orderItemRouter from './routes/order-item.routes.js';
import authRouter from './routes/auth.routes.js'
import { paymentRouter, webhookRouter } from './routes/payment.routes.js';
import uploadRouter from './routes/upload.routes.js';

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './configs/logger.config.js';

// Obtenir le chemin du répertoire actuel (avec ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT;

// Middleware to serve static files from the 'public' directory.
app.use(express.static('public'));

// Configurer le middleware pour servir les images uploadées
const uploadsPath = path.join(__dirname, 'assets/uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/webhooks', webhookRouter);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
            frameSrc: ["'self'", "https://js.stripe.com"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            imgSrc: ["'self'", "data:", "https:"],
            styleSrc: ["'self'", "'unsafe-inline'"]
        }
    },
    crossOriginEmbedderPolicy: { policy: "credentialless" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Configuration du rate limiter général
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requêtes par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Trop de requêtes',
            message: 'Vous avez dépassé la limite autorisée. Veuillez réessayer dans 15 minutes.',
            retryAfter: '15 minutes'
        });
    }
});

// Configuration du rate limiter strict pour les routes sensibles
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 tentatives
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Trop de tentatives',
            message: 'Compte temporairement bloqué pour 15 minutes',
            retryAfter: '15 minutes'
        });
    }
});

app.use(express.json());
app.use(cors())

app.use('/services', serviceRouter);
app.use('/users', userRouter);
app.use('/orders', orderRouter);
app.use('/order-items', orderItemRouter);
app.use('/auth', strictLimiter, authRouter)
app.use('/payments', strictLimiter, paymentRouter);
app.use('/upload', strictLimiter, uploadRouter);

app.listen(port, () => {
    logger.info(`🚀 API démarrée avec succès sur le port ${port}`);
    logger.info(`Environnement: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📁 Répertoire uploads configuré: ${uploadsPath}`);
});