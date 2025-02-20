import express from 'express';
import userController from '../controllers/user.controller.js';
import { userCreationValidator, userModificationValidator, userIdValidator } from '../schemas/user.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';

const userRouter = express.Router();

//Récupérer tous les utilisateurs (GET /users/)
userRouter.get('/', userController.getAllUsers);

//Récupérer un utilisateur via son ID (GET /users/:id)
userRouter.get('/:id', zodValidator(userIdValidator), userController.getUserById);

//Créer un utlisateur (POST /users/)
userRouter.post('/', zodValidator(userCreationValidator), userController.createUser);

//Modifier un utilisateur (PUT /users/:id)
userRouter.put('/:id', zodValidator(userModificationValidator), userController.updateUser);

//Supprimer un utilisateur (DELETE /users/:id)
userRouter.delete('/:id', zodValidator(userIdValidator), userController.deleteUser);

export default userRouter;