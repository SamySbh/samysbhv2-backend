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
            { expiresIn: process.env.JWT_VERIFICATION_EXPIRES_IN}
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
    }
};

export default EmailService;