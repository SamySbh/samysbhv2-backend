import express from 'express';
import orderItemController from '../controllers/orderItem.controller.js';
import {orderItemCreationValidator, orderItemModificationValidator, orderItemIdValidator} from '../schemas/orderItem.schema.js';
import {zodValidator} from '../middlewares/zod.middleware.js';

const orderItemRouter = express.Router();

orderItemRouter.get('/', orderItemController.getAllOrderItems);
orderItemRouter.get('/:id', zodValidator(orderItemIdValidator), orderItemController.getOrderItemById);
orderItemRouter.post('/', zodValidator(orderItemCreationValidator), orderItemController.createOrderItem);
orderItemRouter.put('/:id', zodValidator(orderItemModificationValidator), orderItemController.updateOrderItem);
orderItemRouter.delete('/:id', zodValidator(orderItemIdValidator), orderItemController.deleteOrderItem);

export default orderItemRouter;