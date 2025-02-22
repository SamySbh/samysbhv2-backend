import express from 'express';
import orderItemController from '../controllers/orderItem.controller.js';
import { orderItemCreationValidator, orderItemModificationValidator, orderItemIdValidator } from '../schemas/orderItem.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';

const orderItemRouter = express.Router();

//Récupérer tous les items (GET /orderItems/:id)
orderItemRouter.get('/', orderItemController.getAllOrderItems);

//Récupérer un item via son ID (GET /orders/:id)
orderItemRouter.get('/:id', zodValidator(orderItemIdValidator), orderItemController.getOrderItemById);

//Créer un item (POST /orderItems/)
orderItemRouter.post('/', zodValidator(orderItemCreationValidator), orderItemController.createOrderItem);

//Modifier un item (PUT /orderItems/:id)
orderItemRouter.put('/:id', zodValidator(orderItemModificationValidator), orderItemController.updateOrderItem);

//Supprimer un item (DELETE /orderItems/:id)
orderItemRouter.delete('/:id', zodValidator(orderItemIdValidator), orderItemController.deleteOrderItem);

export default orderItemRouter;