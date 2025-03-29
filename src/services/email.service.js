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
                    <li><a href="${process.env.FRONTEND_URL}/orders/${orderDetails.id}/pay">Réessayer le paiement</a></li>
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