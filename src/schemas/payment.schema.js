import { z } from 'zod';

export const checkoutSessionValidator = z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, {
        message: "L'ID de la commande doit être un ObjectId MongoDB valide"
    }),
    services: z.array(z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/),
        quantity: z.number().min(1)
    })).optional()
});

export default {
    checkoutSessionValidator
};