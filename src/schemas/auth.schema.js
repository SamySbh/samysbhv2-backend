import { z } from 'zod';

// Validation de l'inscription
export const registerValidator = z.object({
    email: z.string().email({ message: "Format d'email invalide" }),
    firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
    lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    password: z
        .string()
        .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
        .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une majuscule" })
        .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" })
        .regex(/[^A-Za-z0-9]/, { message: "Le mot de passe doit contenir au moins un caractère spécial" }),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, {
        message: "Le numéro de téléphone doit contenir entre 10 et 15 chiffres"
    }).optional(),
    company: z.string().optional()
});

// Validation de la connexion
export const loginValidator = z.object({
    email: z.string().email({ message: "Format d'email invalide" }),
    password: z.string().min(1, { message: "Le mot de passe est requis" })
});

// Validation du token
export const tokenValidator = z.object({
    headers: z.object({
        authorization: z.string()
            .regex(/^Bearer .+$/, { message: "Format du token invalide. Format attendu: 'Bearer [token]'" })
    })
});

// Validation de l'ID utilisateur (pour les futures routes)
export const userIdValidator = z.object({
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, { message: "L'ID utilisateur doit être un ObjectId MongoDB valide" })
    })
});

// Validation de la mise à jour du profil
export const updateProfileValidator = z.object({
    firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }).optional(),
    lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }).optional(),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, {
        message: "Le numéro de téléphone doit contenir entre 10 et 15 chiffres"
    }).optional(),
    company: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z
        .string()
        .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
        .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une majuscule" })
        .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" })
        .regex(/[^A-Za-z0-9]/, { message: "Le mot de passe doit contenir au moins un caractère spécial" })
        .optional()
})
    .refine(data => {
        // Si newPassword est fourni, currentPassword doit aussi être fourni
        if (data.newPassword && !data.currentPassword) {
            return false;
        }
        return true;
    }, {
        message: "Le mot de passe actuel est requis pour changer de mot de passe",
        path: ["currentPassword"]
    });
    export const refreshTokenValidator = z.object({
        refreshToken: z.string()
    });
    export const verificationTokenValidator = z.object({
        query: z.object({
            token: z.string().min(1, { message: "Le token de vérification est requis" })
        })
    });

// Export par défaut de tous les validateurs
export default {
    registerValidator,
    loginValidator,
    tokenValidator,
    userIdValidator,
    updateProfileValidator,
    refreshTokenValidator,
    verificationTokenValidator
};