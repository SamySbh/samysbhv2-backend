import { z } from 'zod';

export const userCreationValidator = z.object({
    email: z.string(),
    role: z.enum(['ADMIN', 'USER', 'DISABLED']),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string(),
    phone: z.string(),
    company: z.string().optional()
});

export const userModificationValidator = z.object({
    email: z.string().optional(),
    role: z.enum(['ADMIN', 'USER', 'DISABLED']).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour"
});

export const userIdValidator = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/) // Regex car on utilise des ObjectIds MongoDB
});