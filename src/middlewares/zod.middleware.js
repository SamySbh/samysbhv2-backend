import { z, ZodError } from 'zod';

export function zodValidator(schema) {
    return (req, res, next) => {
        try {
            // Vérifie si le schéma a une propriété id, ce qui indique qu'on valide probablement un paramètre d'URL
            if (schema.shape?.id) {
                schema.parse(req.params);
            } else {
                schema.parse(req.body);
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    message: issue.message,
                }));
                res.status(400).json({ 
                    success: false, 
                    error: 'Données invalides', 
                    details: errorMessages 
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    error: 'Erreur interne du serveur' 
                });
            }
        }
    };
}