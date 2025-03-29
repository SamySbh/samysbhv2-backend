import { contactSchema } from '../schemas/contact.schema.js';
import emailService from '../services/email.service.js';

const contactController = {
    async submitContactForm(req, res) {
        try {
            // Validation avec Zod
            const validationResult = contactSchema.safeParse(req.body);

            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    errors: validationResult.error.format()
                });
            }

            const { name, email, subject, message } = validationResult.data;

            // Envoyer l'email de notification et vérifier le retour
            const emailSent = await emailService.sendContactNotification({
                from: email,
                name: name,
                subject: subject,
                message: message
            });

            // Vérifier si l'envoi a réussi
            if (!emailSent) {
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'envoi du message par email'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Votre message a bien été envoyé'
            });
        } catch (error) {
            console.error('Error in submitContactForm:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'envoi du message'
            });
        }
    }
};

export default contactController;