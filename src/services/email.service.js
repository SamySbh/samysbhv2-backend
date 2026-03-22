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

    /**
     * Email de notification nouvelle demande (à l'admin)
     */
    async sendAdminNewRequestNotification(projectRequest) {
        const adminEmail = process.env.EMAIL_USER;
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .detail { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Nouvelle demande de devis</h2>
    </div>
    <div class="content">
      <div class="detail">
        <strong>Client :</strong> ${projectRequest.name}<br>
        <strong>Email :</strong> ${projectRequest.email}<br>
        <strong>Telephone :</strong> ${projectRequest.phone || 'Non fourni'}<br>
        <strong>Entreprise :</strong> ${projectRequest.company || 'Particulier'}
      </div>
      <div class="detail">
        <strong>Services demandes :</strong><br>
        ${projectRequest.requestedServices.map(s =>
            `- ${s.quantity}x ${s.serviceName} (${s.price.toFixed(2)} EUR)`
        ).join('<br>')}
        <br><br>
        <strong>Total estime :</strong> ${projectRequest.estimatedTotal.toFixed(2)} EUR
      </div>
      <div class="detail">
        <strong>Description du projet :</strong><br>
        ${projectRequest.projectDescription}
        <br><br>
        <strong>Delai souhaite :</strong> ${projectRequest.desiredDeadline}<br>
        <strong>Site existant :</strong> ${projectRequest.hasExistingSite ? 'Oui' : 'Non'}
        ${projectRequest.existingSiteUrl ? `<br><strong>URL :</strong> ${projectRequest.existingSiteUrl}` : ''}
      </div>
      <a href="${clientUrl}/admin" class="button">Voir dans l'admin</a>
    </div>
  </div>
</body>
</html>
        `.trim();

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: adminEmail,
                subject: `Nouvelle demande de devis - ${projectRequest.name}`,
                html,
            });
            return true;
        } catch (error) {
            console.error('Error sending admin notification email:', error);
            return false;
        }
    },

    /**
     * Email avec lien de paiement acompte (au client)
     */
    async sendDepositPaymentLink(clientEmail, clientName, order, paymentUrl) {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .amount { font-size: 24px; font-weight: bold; color: #7c3aed; text-align: center; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 0.9rem; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Paiement de l'acompte</h1>
    </div>
    <div class="content">
      <p>Bonjour ${clientName},</p>
      <p>Votre projet est valide ! Pour demarrer la realisation, merci de proceder au paiement de l'acompte (30%).</p>
      <div class="amount">${order.depositAmount.toFixed(2)} EUR</div>
      <p style="text-align: center;">
        <a href="${paymentUrl}" class="button">Payer l'acompte maintenant</a>
      </p>
      <p><strong>Ce que vous obtenez :</strong></p>
      <ul>
        <li>Demarrage immediat de votre projet</li>
        <li>Suivi regulier de l'avancement</li>
        <li>Livraison dans les delais convenus</li>
      </ul>
      <p><em>Le solde (70%) sera a regler a la livraison du projet.</em></p>
      <p>A tres vite,<br>Samy</p>
    </div>
    <div class="footer">
      <p>Pour toute question : <a href="mailto:samy.sebahi@yahoo.fr">samy.sebahi@yahoo.fr</a></p>
    </div>
  </div>
</body>
</html>
        `.trim();

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: clientEmail,
                subject: `Paiement de l'acompte - Commande #${order.id.slice(-6)}`,
                html,
            });
            return true;
        } catch (error) {
            console.error('Error sending deposit payment link email:', error);
            return false;
        }
    },

    /**
     * Email confirmation acompte paye (au client)
     */
    async sendDepositConfirmation(clientEmail, clientName, order) {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
    .success { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 0.9rem; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Acompte recu !</h1>
    </div>
    <div class="content">
      <p>Bonjour ${clientName},</p>
      <div class="success">
        <strong>Votre paiement de ${order.depositAmount.toFixed(2)} EUR a bien ete recu !</strong>
      </div>
      <p>Parfait ! Je demarre immediatement votre projet.</p>
      <p><strong>Prochaines etapes :</strong></p>
      <ul>
        <li>Developpement de votre projet</li>
        <li>Points reguliers sur l'avancement</li>
        <li>Livraison et paiement du solde (${(order.totalAmount - order.depositAmount).toFixed(2)} EUR)</li>
      </ul>
      <p>Vous pouvez suivre l'avancement dans votre espace client sur samysbh.fr</p>
      <p>A tres bientot,<br>Samy</p>
    </div>
    <div class="footer">
      <p>Pour toute question : <a href="mailto:samy.sebahi@yahoo.fr">samy.sebahi@yahoo.fr</a></p>
    </div>
  </div>
</body>
</html>
        `.trim();

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: clientEmail,
                subject: 'Acompte recu - Projet en cours',
                html,
            });
            return true;
        } catch (error) {
            console.error('Error sending deposit confirmation email:', error);
            return false;
        }
    },

    /**
     * Email avec lien de paiement du solde (au client)
     */
    async sendFinalPaymentLink(clientEmail, clientName, order, paymentUrl) {
        const finalAmount = order.totalAmount - order.depositAmount;

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff7ed; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .amount { font-size: 24px; font-weight: bold; color: #ea580c; text-align: center; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 0.9rem; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Votre projet est termine !</h1>
    </div>
    <div class="content">
      <p>Bonjour ${clientName},</p>
      <p>Excellente nouvelle : votre projet est termine et pret a etre livre !</p>
      <p>Pour finaliser la livraison, merci de proceder au paiement du solde (70%).</p>
      <div class="amount">${finalAmount.toFixed(2)} EUR</div>
      <p style="text-align: center;">
        <a href="${paymentUrl}" class="button">Payer le solde maintenant</a>
      </p>
      <p><strong>Apres paiement, vous recevrez :</strong></p>
      <ul>
        <li>Tous les acces a votre site</li>
        <li>Les fichiers sources</li>
        <li>La documentation complete</li>
        <li>Support pendant 30 jours</li>
      </ul>
      <p>Merci pour votre confiance !<br>Samy</p>
    </div>
    <div class="footer">
      <p>Pour toute question : <a href="mailto:samy.sebahi@yahoo.fr">samy.sebahi@yahoo.fr</a></p>
    </div>
  </div>
</body>
</html>
        `.trim();

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: clientEmail,
                subject: 'Projet termine - Paiement du solde',
                html,
            });
            return true;
        } catch (error) {
            console.error('Error sending final payment link email:', error);
            return false;
        }
    },

    /**
     * Email confirmation paiement final (au client)
     */
    async sendFinalPaymentConfirmation(clientEmail, clientName, order) {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
    .success { background: white; border: 2px solid #10b981; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
    .footer { text-align: center; color: #666; font-size: 0.9rem; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Projet livre !</h1>
    </div>
    <div class="content">
      <p>Bonjour ${clientName},</p>
      <div class="success">
        <h2 style="color: #10b981; margin: 0;">Paiement recu !</h2>
        <p style="margin: 10px 0 0 0;">Votre projet est officiellement livre</p>
      </div>
      <p>Merci pour votre confiance ! C'etait un plaisir de travailler sur votre projet.</p>
      <p><strong>N'oubliez pas :</strong></p>
      <ul>
        <li>Support gratuit pendant 30 jours</li>
        <li>N'hesitez pas a me contacter pour toute question</li>
        <li>Votre avis compte : laissez un temoignage si vous etes satisfait !</li>
      </ul>
      <p>Au plaisir de collaborer a nouveau,<br><strong>Samy SEBAHI</strong></p>
    </div>
    <div class="footer">
      <p><a href="mailto:contact@samysbh.fr">contact@samysbh.fr</a> | <a href="https://samysbh.fr">samysbh.fr</a></p>
    </div>
  </div>
</body>
</html>
        `.trim();

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: clientEmail,
                subject: 'Projet livre - Merci pour votre confiance !',
                html,
            });
            return true;
        } catch (error) {
            console.error('Error sending final payment confirmation email:', error);
            return false;
        }
    },

    // Email : Devis validé par l'admin - le client peut payer l'acompte
    async sendQuoteValidated(email, name, orderId, totalAmount, depositAmount) {
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
                    .button { display: inline-block; padding: 15px 30px; background: #7c3aed; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                    .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #7c3aed; }
                    .footer { text-align: center; color: #666; font-size: 0.9rem; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Votre devis est validé !</h1>
                </div>
                <div class="content">
                    <p>Bonjour ${name},</p>
                    <p>Bonne nouvelle ! Votre devis a été validé et votre commande est prête à démarrer.</p>
                    <div class="info-box">
                        <p><strong>Numéro de commande :</strong> #${orderId.slice(-8).toUpperCase()}</p>
                        <p><strong>Montant total :</strong> ${Number(totalAmount).toFixed(2)} EUR</p>
                        <p><strong>Acompte à régler (30%) :</strong> ${Number(depositAmount).toFixed(2)} EUR</p>
                    </div>
                    <p>Pour démarrer votre projet, réglez l'acompte en cliquant sur le bouton ci-dessous :</p>
                    <p style="text-align: center;">
                        <a href="${orderUrl}" class="button">Régler l'acompte</a>
                    </p>
                    <p>Le solde (70%) sera à régler à la livraison du projet.</p>
                    <p>À très bientôt,<br><strong>Samy SEBAHI</strong></p>
                </div>
                <div class="footer">
                    <p>Pour toute question : <a href="mailto:samy.sebahi@yahoo.fr">samy.sebahi@yahoo.fr</a></p>
                </div>
            </body>
            </html>
        `;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Votre devis est validé - Réglez votre acompte',
                html,
            });
            return true;
        } catch (error) {
            console.error('Error sending quote validated email:', error);
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