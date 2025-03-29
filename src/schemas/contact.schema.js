import { z } from 'zod';

export const contactSchema = z.object({
    name: z.string()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .max(100, "Le nom ne peut pas dépasser 100 caractères"),

    email: z.string()
        .email("Veuillez entrer une adresse email valide")
        .max(255, "L'email ne peut pas dépasser 255 caractères"),

    subject: z.string()
        .min(1, "Veuillez sélectionner un objet")
        .refine(value => [
            'Site Vitrine',
            'Boutique E-commerce',
            'Logiciel Web',
            'Coaching Web',
            'Autre'
        ].includes(value), "Veuillez sélectionner un objet valide"),

    message: z.string()
        .min(10, "Votre message doit contenir au moins 10 caractères")
        .max(2000, "Votre message ne peut pas dépasser 2000 caractères")
});

// Version avec tous les champs optionnels pour la validation côté backend
// (si tu veux valider uniquement certains champs)
export const partialContactSchema = contactSchema.partial();