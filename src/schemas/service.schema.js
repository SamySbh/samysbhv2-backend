import { z } from 'zod';

export const serviceCreationValidator = z.object({
    name: z.string(),
    basePrice: z.number(),
    description: z.string(),
    image: z.string(),
    isActive: z.boolean(),
    type: z.enum(["VITRINE", "ECOMMERCE", "SAAS", "COACHING"]),
    features: z.array(z.string()).optional().default([])
});

export const serviceModificationValidator = z.object({
    name: z.string().optional(),
    basePrice: z.number().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    isActive: z.boolean().optional(),
    type: z.enum(["VITRINE", "ECOMMERCE", "SAAS", "COACHING"]).optional(),
    features: z.array(z.string()).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour"
});

export const serviceIdValidator = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/) // Regex car on utilise des ObjectIds MongoDB
});