import express from 'express';
const serviceRouter = express.Router();

import serviceController from './../controllers/service.controller.js';

serviceRouter.get('/', serviceController.getAllServices)
serviceRouter.get('/:id', serviceController.getServiceByID)

export default serviceRouter;