// zod.middleware.js (simplifié)
import { ZodError } from 'zod';

export function zodValidator(schema) {
    return (req, res, next) => {
        try {
            // Détermine automatiquement les données à valider selon le schéma
            let dataToValidate;

            // Vérifie si le schéma attend des headers
            if (schema.shape?.headers) {
                dataToValidate = {
                    headers: {
                        authorization: req.headers.authorization || ''
                    }
                };
            }
            // Vérifie si le schéma attend des paramètres d'URL
            else if (schema.shape?.id) {
                dataToValidate = req.params;
            }
            // Sinon, valide le corps de la requête
            else {
                dataToValidate = req.body;
            }

            schema.parse(dataToValidate);
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
                console.error('Erreur middleware validation:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur interne du serveur'
                });
            }
        }
    };
}