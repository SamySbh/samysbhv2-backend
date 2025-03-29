import express from 'express';
import userController from '../controllers/user.controller.js';
import { userCreationValidator, userModificationValidator, userIdValidator } from '../schemas/user.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';

const userRouter = express.Router();

// Routes réservées aux administrateurs
// Récupérer tous les utilisateurs (GET /users/)
userRouter.get('/',
    protect,
    requireAdmin,
    userController.getAllUsers
);

// Routes qui permettent à un utilisateur authentifié d'accéder à son propre profil
// ou à un administrateur d'accéder à n'importe quel profil
// Récupérer un utilisateur via son ID (GET /users/:id)
userRouter.get('/:id',
    protect,
    zodValidator(userIdValidator),
    (req, res, next) => {
        // Middleware personnalisé pour vérifier si l'utilisateur accède à son propre profil
        // ou s'il est administrateur
        if (req.user.role === 'ADMIN' || req.user.id === req.params.id) {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: 'Accès non autorisé: vous ne pouvez consulter que votre propre profil'
        });
    },
    userController.getUserById
);

// Route réservée aux administrateurs ou à la création de compte (signup)
// Pour l'inscription publique, cette route serait déplacée vers auth.routes.js
// Créer un utilisateur (POST /users/)
userRouter.post('/',
    protect,
    requireAdmin,
    zodValidator(userCreationValidator),
    userController.createUser
);

// Routes avec vérification d'accès (propriétaire du compte ou admin)
// Modifier un utilisateur (PUT /users/:id)
userRouter.put('/:id',
    protect,
    zodValidator(userModificationValidator),
    (req, res, next) => {
        // Vérifier si l'utilisateur modifie son propre profil ou s'il est admin
        if (req.user.role === 'ADMIN' || req.user.id === req.params.id) {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: 'Accès non autorisé: vous ne pouvez modifier que votre propre profil'
        });
    },
    userController.updateUser
);

// Route réservée aux administrateurs
// Supprimer un utilisateur (DELETE /users/:id)
userRouter.delete('/:id',
    protect,
    requireAdmin,
    zodValidator(userIdValidator),
    userController.deleteUser
);

export default userRouter;