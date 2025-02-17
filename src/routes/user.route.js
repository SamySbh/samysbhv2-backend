import express from 'express';
import userController from './../controllers/user.controller.js';
import {userCreationValidator, userModificationValidator, userIdValidator} from './../schemas/user.schema.js';
import {zodValidator} from './../middlewares/zod.middleware.js';

const userRouter = express.Router();

userRouter.get('/', userController.getAllUsers);
userRouter.get('/:id', zodValidator(userIdValidator), userController.getUserById);
userRouter.post('/', zodValidator(userCreationValidator), userController.createUser);
userRouter.put('/:id', zodValidator(userModificationValidator), userController.updateUser);
userRouter.delete('/:id', zodValidator(userIdValidator), userController.deleteUser);

export default userRouter;