import { z } from 'zod';

export const orderCreationValidator = z.object({
    statusMain: z.enum(["NEW", "VALIDATED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]),
    statusPayment: z.enum(["PENDING_DEPOSIT", "DEPOSIT_PAID", "PENDING_FINAL", "FULLY_PAID"]),
    totalAmount: z.number(),
    depositAmount: z.number(),
    deadlineDate: z.string().datetime().optional(),
    userId: z.string()
});

export const orderModificationValidator = z.object({
    statusMain: z.enum(["NEW", "VALIDATED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]).optional(),
    statusPayment: z.enum(["PENDING_DEPOSIT", "DEPOSIT_PAID", "PENDING_FINAL", "FULLY_PAID"]).optional(),
    totalAmount: z.number().optional(),
    depositAmount: z.number().optional(),
    deadlineDate: z.string().datetime().optional(),
    userId: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour"
});

export const orderIdValidator = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/) // Regex car on utilise des ObjectIds MongoDB
});