// auth.middleware.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { tokenValidator } from '../schemas/auth.schema.js';
import { zodValidator } from './zod.middleware.js';

const prisma = new PrismaClient();

// Middleware d'authentification de base
export const protect = [
    zodValidator(tokenValidator),
    async (req, res, next) => {
        try {
            // Le token a déjà été validé par zodValidator
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur introuvable'
                });
            }

            if (user.role === 'DISABLED') {
                return res.status(403).json({
                    success: false,
                    message: 'Ce compte a été désactivé'
                });
            }

            // Attacher l'utilisateur à la requête pour les middlewares suivants
            req.user = user;

            next();

        } catch (error) {
            console.error('Error in authentication:', error);

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token invalide'
                });
            }

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expiré'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'authentification'
            });
        }
    }
];

// Middleware pour vérifier les rôles (à utiliser après protect)
export const requireRole = (role) => {
    return (req, res, next) => {
        // Vérifie que req.user existe (middleware protect exécuté avant)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }

        // Vérifie le rôle de l'utilisateur
        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Privilèges insuffisants.'
            });
        }

        next();
    };
};

// Création d'un middleware spécifique pour le rôle ADMIN
export const requireAdmin = requireRole('ADMIN');

// Pour la rétrocompatibilité avec le code existant
export default protect;