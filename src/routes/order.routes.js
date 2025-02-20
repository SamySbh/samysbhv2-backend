import express from 'express';
import orderController from '../controllers/order.controller.js';
import { orderCreationValidator, orderModificationValidator, orderIdValidator } from '../schemas/order.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';

const orderRouter = express.Router();

//Récupérer toutes les commandes (GET /orders)
orderRouter.get('/', orderController.getAllOrders);

//Récupérer une commande via son ID (GET /orders/:id)
orderRouter.get('/:id', zodValidator(orderIdValidator), orderController.getOrderById);

//Créer une commande (POST /orders)
orderRouter.post('/', zodValidator(orderCreationValidator), orderController.createOrder);

//Modifier une commande (PUT /orders/:id)
orderRouter.put('/:id', zodValidator(orderModificationValidator), orderController.updateOrder);

//Suppreimer une commande (DELETE /orders/:id)
orderRouter.delete('/:id', zodValidator(orderIdValidator), orderController.deleteOrder);

export default orderRouter;