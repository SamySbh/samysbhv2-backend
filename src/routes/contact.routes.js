import express from 'express';
import contactController from '../controllers/contact.controller.js';
import { contactSchema } from '../schemas/contact.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';

const contactRouter = express.Router();

// Soumettre un nouveau message (POST /api/contact)
contactRouter.post(
    '/',
    zodValidator(contactSchema),
    contactController.submitContactForm
);

export default contactRouter;