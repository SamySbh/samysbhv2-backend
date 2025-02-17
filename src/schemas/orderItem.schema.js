import { z } from 'zod';

export const orderItemCreationValidator = z.object({
    unitAmount: z.number(),
    totalAmount: z.number(),
    quantity: z.number(),
    orderId: z.string(),
    serviceId: z.string()
});

export const orderItemModificationValidator = z.object({
    unitAmount: z.number().optional(),
    totalAmount: z.number().optional(),
    quantity: z.number().optional(),
    orderId: z.string().optional(),
    serviceId: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour"
});

export const orderItemIdValidator = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/) // Regex car on utilise des ObjectIds MongoDB
});