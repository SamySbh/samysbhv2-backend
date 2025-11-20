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
import {paymentRouter, webhookRouter} from './routes/payment.routes.js';
import uploadRouter from './routes/upload.routes.js';

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Obtenir le chemin du répertoire actuel (avec ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT;

// Middleware to serve static files from the 'public' directory.
app.use(express.static('public'));

// Configurer le middleware pour servir les images uploadées
const uploadsPath = path.join(__dirname, 'src/assets/uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/payments', webhookRouter);

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

// Rate limiting global (protection DDoS basique)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requêtes par IP
    message: 'Trop de requêtes, veuillez réessayer plus tard',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Max 5 tentatives en 15 min
    message: 'Trop de tentatives, compte temporairement bloqué'
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
    console.log(`My API app listening on port ${port}`);
    console.log(`Uploads directory configured at: ${uploadsPath}`);
});