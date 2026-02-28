import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const EmailService = {
    generateVerificationToken(email) {
        // Créer un JWT qui expire dans 24h
        return jwt.sign(
            { email },
            process.env.JWT_VERIFICATION_SECRET,
            { expiresIn: process.env.JWT_VERIFICATION_EXPIRES_IN }
        );
    },

    async sendVerificationEmail(email) {
        const token = this.generateVerificationToken(email);
        const verificationLink = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Vérification de votre email',
            html: `
                <h1>Vérification de votre compte</h1>
                <p>Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
                <a href="${verificationLink}">Vérifier mon email</a>
                <p>Ce lien expire dans 24 heures.</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    },

    async sendContactNotification({ from, name, subject, message }) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `Nouveau message de contact: ${subject}`,
            html: `
                    <h1>Nouveau message de contact</h1>
                    <table style="border-collapse: collapse; width: 100%;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; width: 120px;"><strong>Nom:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${from}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Objet:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${subject}</td>
                        </tr>
                    </table>
                    
                    <h2 style="margin-top: 20px;">Message:</h2>
                    <div style="padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #ddd;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                `
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending contact notification email:', error);
            return false;
        }
    },

    async sendPaymentConfirmationEmail(email, orderDetails) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Confirmation de votre paiement',
            html: `
            <h1>Merci pour votre paiement !</h1>
            <p>Nous confirmons avoir reçu votre paiement pour la commande #${orderDetails.id}.</p>
            <h2>Détails de la commande</h2>
            <p>Montant total: ${orderDetails.totalAmount}€</p>
            <p>Acompte payé: ${orderDetails.depositAmount}€</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Nous vous contacterons prochainement concernant les prochaines étapes.</p>
            <p>Merci de votre confiance !</p>
        `
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending payment confirmation email:', error);
            return false;
        }
    },

    // Email : Confirmation de demande de devis reçue
    async sendOrderCreatedEmail(email, name, orderId, estimatedTotal) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const orderUrl = `${clientUrl}/commande/${orderId}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; padding: 15px 30px; background: #3498db; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                    .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3498db; }
                    .footer { text-align: center; color: #666; font-size: 0.9rem; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Demande de devis reçue !</h1>
                </div>
                <div class="content">
                    <p>Bonjour ${name},</p>
                    <p>Merci pour votre demande de devis ! J'ai bien reçu votre projet et je vais l'étudier attentivement.</p>
                    <div class="info-box">
                        <p><strong>Numéro de commande :</strong> #${orderId.slice(-8).toUpperCase()}</p>
                        <p><strong>Montant estimé :</strong> ${estimatedTotal} EUR</p>
                    </div>
                    <h3>Prochaines étapes :</h3>
                    <ol>
                        <li>Je prépare votre devis personnalisé (sous 24-48h)</li>
                        <li>Vous recevrez un nouvel email dès que le devis sera prêt</li>
                        <li>Vous pourrez consulter et valider le devis en ligne</li>
                        <li>Après validation, vous réglerez l'acompte pour démarrer</li>
                    </ol>
                    <p style="text-align: center;">
                        <a href="${orderUrl}" class="button">Suivre ma commande</a>
                    </p>
                    <p>Si vous avez des questions, n'hésitez pas à me contacter directement.</p>
                    <p>À très bientôt,<br><strong>Samy SEBAHI</strong><br>Développeur Web Fullstack</p>
                </div>
                <div class="footer">
                    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                    <p>Pour toute question : <a href="mailto:samy.sebahi@yahoo.fr">samy.sebahi@yahoo.fr</a></p>
                </div>
            </body>
            </html>
        `;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Votre demande de devis a été reçue',
                html,
            });
            return true;
        } catch (error) {
            console.error('Error sending order created email:', error);
            return false;
        }
    },

    // Email : Devis prêt à consulter
    async sendQuoteReadyEmail(email, name, orderId, totalAmount, quoteUrl) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const orderUrl = `${clientUrl}/commande/${orderId}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; padding: 15px 30px; background: #2ecc71; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                    .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2ecc71; }
                    .highlight { background: #fff9e6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px solid #f1c40f; }
                    .footer { text-align: center; color: #666; font-size: 0.9rem; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Votre devis est prêt !</h1>
                </div>
                <div class="content">
                    <p>Bonjour ${name},</p>
                    <p>Bonne nouvelle ! J'ai terminé l'étude de votre projet et votre devis personnalisé est maintenant disponible.</p>
                    <div class="info-box">
                        <p><strong>Numéro de commande :</strong> #${orderId.slice(-8).toUpperCase()}</p>
                        <p><strong>Montant du devis :</strong> ${totalAmount} EUR</p>
                    </div>
                    <div class="highlight">
                        <p style="margin: 0; font-size: 1.1rem;"><strong>Validité du devis : 30 jours</strong></p>
                    </div>
                    ${quoteUrl ? `<p style="text-align: center;"><a href="${quoteUrl}" class="button" style="background: #3498db;">Voir le devis PDF</a></p>` : ''}
                    <p style="text-align: center;">
                        <a href="${orderUrl}" class="button">Consulter et valider le devis</a>
                    </p>
                    <h3>Pour démarrer votre projet :</h3>
                    <ol>
                        <li>Consultez le devis détaillé ci-dessus</li>
                        <li>Validez le devis si vous êtes d'accord</li>
                        <li>Réglez l'acompte de 30% (${(totalAmount * 0.3).toFixed(2)} EUR)</li>
                        <li>Je démarre le développement immédiatement !</li>
                    </ol>
                    <p>Si vous avez des questions sur le devis ou souhaitez des modifications, n'hésitez pas à me contacter.</p>
                    <p>Au plaisir de travailler avec vous,<br><strong>Samy SEBAHI</strong></p>
                </div>
                <div class="footer">
                    <p>Pour toute question : <a href="mailto:samy.sebahi@yahoo.fr">samy.sebahi@yahoo.fr</a></p>
                    <p>Téléphone : +33 7 69 68 45 68</p>
                </div>
            </body>
            </html>
        `;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Votre devis personnalisé est prêt',
                html,
            });
            return true;
        } catch (error) {
            console.error('Error sending quote ready email:', error);
            return false;
        }
    },

    // Email : Notification admin - Devis refusé
    async sendQuoteRejectedEmailToAdmin(clientEmail, clientName, orderId, reason) {
        const adminEmail = process.env.EMAIL_USER;
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const orderUrl = `${clientUrl}/admin/commandes`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #e74c3c; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e74c3c; }
                    .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white !important; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Devis refusé</h2>
                </div>
                <div class="content">
                    <p>Un client a refusé le devis.</p>
                    <div class="info-box">
                        <p><strong>Client :</strong> ${clientName}</p>
                        <p><strong>Email :</strong> ${clientEmail}</p>
                        <p><strong>Commande :</strong> #${orderId.slice(-8).toUpperCase()}</p>
                        ${reason ? `<p><strong>Raison :</strong> ${reason}</p>` : ''}
                    </div>
                    <p>Actions suggérées :</p>
                    <ul>
                        <li>Contacter le client pour comprendre les raisons</li>
                        <li>Proposer une révision du devis si nécessaire</li>
                        <li>Archiver la commande si abandon définitif</li>
                    </ul>
                    <p style="text-align: center;">
                        <a href="${orderUrl}" class="button">Voir dans le dashboard</a>
                    </p>
                </div>
            </body>
            </html>
        `;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: adminEmail,
                subject: `Devis refusé - ${clientName}`,
                html,
            });
            return true;
        } catch (error) {
            console.error('Error sending quote rejected email to admin:', error);
            return false;
        }
    },

    async sendPaymentFailureEmail(email, orderDetails, errorReason) {

        let userFriendlyReason = "Une erreur s'est produite";

        // Traduit les codes d'erreur Stripe en messages
        if (errorReason.includes('card_declined')) {
            userFriendlyReason = "Votre carte a été refusée par la banque";
        } else if (errorReason.includes('insufficient_funds')) {
            userFriendlyReason = "Fonds insuffisants sur votre carte";
        } else if (errorReason.includes('expired_card')) {
            userFriendlyReason = "Votre carte est expirée";
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Information concernant votre commande',
            html: `
                <h1>À propos de votre commande</h1>
                <p>Nous avons rencontré un problème lors du traitement de votre paiement pour la commande #${orderDetails.id}.</p>
                <p><strong>Raison:</strong> ${userFriendlyReason}</p>
                
                <h2>Que faire maintenant?</h2>
                <ul>
                    <li>Vérifier les informations de votre carte</li>
                    <li>Contacter votre banque si le problème persiste</li>
                    <li><a href="${process.env.CLIENT_URL}/orders/${orderDetails.id}/pay">Réessayer le paiement</a></li>
                </ul>
                
                <p>Besoin d'aide? N'hésitez pas à <a href="mailto:support@votredomaine.com">nous contacter</a>.</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending payment failure email:', error);
            return false;
        }
    }
};

export default EmailService;