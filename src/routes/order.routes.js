import express from 'express';
import orderController from '../controllers/order.controller.js';
import {orderCreationValidator, orderModificationValidator, orderIdValidator} from '../schemas/order.schema.js';
import {zodValidator} from '../middlewares/zod.middleware.js';

const orderRouter = express.Router();

orderRouter.get('/', orderController.getAllOrders);
orderRouter.get('/:id', zodValidator(orderIdValidator), orderController.getOrderById);
orderRouter.post('/', zodValidator(orderCreationValidator), orderController.createOrder);
orderRouter.put('/:id', zodValidator(orderModificationValidator), orderController.updateOrder);
orderRouter.delete('/:id', zodValidator(orderIdValidator), orderController.deleteOrder);

export default orderRouter;