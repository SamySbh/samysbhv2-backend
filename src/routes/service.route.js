import express from 'express';
import serviceController from './../controllers/service.controller.js';
import {serviceCreationValidator, serviceModificationValidator, serviceIdValidator} from './../schemas/service.schema.js';
import {zodValidator} from './../middlewares/zod.middleware.js';

const serviceRouter = express.Router();

serviceRouter.get('/', serviceController.getAllServices);
serviceRouter.get('/:id', zodValidator(serviceIdValidator), serviceController.getServiceById);
serviceRouter.post('/', zodValidator(serviceCreationValidator), serviceController.createService);
serviceRouter.put('/:id', zodValidator(serviceModificationValidator), serviceController.updateService);
serviceRouter.delete('/:id', zodValidator(serviceIdValidator), serviceController.deleteService);

export default serviceRouter;