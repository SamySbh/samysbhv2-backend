import express from 'express';
import serviceController from '../controllers/service.controller.js';
import { serviceCreationValidator, serviceModificationValidator, serviceIdValidator } from '../schemas/service.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';

const serviceRouter = express.Router();

//Récupérer tous les services (GET /services)
serviceRouter.get('/', serviceController.getAllServices);

//Récupérer un service via son ID (GET /services/:id)
serviceRouter.get('/:id', zodValidator(serviceIdValidator), serviceController.getServiceById);

//Créer un service (POST /services)
serviceRouter.post('/', zodValidator(serviceCreationValidator), serviceController.createService);

//Modifier un service (PUT /services/:id)
serviceRouter.put('/:id', zodValidator(serviceModificationValidator), serviceController.updateService);

//Supprimer un service (DELETE /services/:id)
serviceRouter.delete('/:id', zodValidator(serviceIdValidator), serviceController.deleteService);

export default serviceRouter;