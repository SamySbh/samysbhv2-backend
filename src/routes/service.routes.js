import express from 'express';
import serviceController from '../controllers/service.controller.js';
import { serviceCreationValidator, serviceModificationValidator, serviceIdValidator } from '../schemas/service.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';

const serviceRouter = express.Router();


// Routes publiques - accessibles à tous les visiteurs

//Récupérer tous les services (GET /services)
serviceRouter.get('/', serviceController.getAllServices);

//Récupérer un service via son ID (GET /services/:id)
serviceRouter.get('/:id', zodValidator(serviceIdValidator), serviceController.getServiceById);

// Routes protégées - accessibles uniquement aux administrateurs

// Créer un service (POST /services) - nécessite authentification + rôle ADMIN
serviceRouter.post('/',
    protect,
    requireAdmin,
    zodValidator(serviceCreationValidator),
    serviceController.createService
);

// Modifier un service (PUT /services/:id) - nécessite authentification + rôle ADMIN
serviceRouter.put('/:id',
    protect,
    requireAdmin,
    zodValidator(serviceModificationValidator),
    serviceController.updateService
);

// Supprimer un service (DELETE /services/:id) - nécessite authentification + rôle ADMIN
serviceRouter.delete('/:id',
    protect,
    requireAdmin,
    zodValidator(serviceIdValidator),
    serviceController.deleteService
);

export default serviceRouter;