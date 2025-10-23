import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import StripeService from '../services/stripe.service.js';
import EmailService from '../services/email.service.js';

const prisma = new PrismaClient();

const authController = {
    generateTokens(userId, userRole) {
        const accessToken = jwt.sign(
            { id: userId, role: userRole },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        const refreshToken = jwt.sign(
            { id: userId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
        );
        return { accessToken, refreshToken };
    },
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token manquant'
                });
            }

            // Vérifier le refresh token
            let decoded;
            try {
                decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token invalide ou expiré'
                });
            }

            // Récupérer l'utilisateur
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user || user.role === 'DISABLED') {
                return res.status(403).json({
                    success: false,
                    message: 'Utilisateur désactivé ou introuvable'
                });
            }

            // Générer de nouveaux tokens
            const tokens = authController.generateTokens(user.id, user.role);

            return res.status(200).json({
                success: true,
                data: tokens,
                message: 'Tokens renouvelés avec succès'
            });
        } catch (error) {
            console.error('Error in refreshToken:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors du renouvellement des tokens'
            });
        }
    },
    async register(req, res) {
        try {
            const { email, firstName, lastName, password, phone, company } = req.body;

            // Vérification si l'utilisateur existe déjà
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }

            // Hashage du mot de passe
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Création de l'utilisateur
            const newUser = await prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    password: hashedPassword,
                    phone,
                    company,
                    role: 'USER',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            // Envoyer l'email de vérification
            await EmailService.sendVerificationEmail(email);

            // Création du client Stripe
            const stripeCustomer = await StripeService.addCustomer(newUser);
            if (stripeCustomer.id) {
                // Mise à jour avec l'ID Stripe
                const updatedUser = await prisma.user.update({
                    where: { id: newUser.id },
                    data: { stripeCustomerId: stripeCustomer.id }
                });

            } else {
                // Si la création du client Stripe échoue, supprimer l'utilisateur
                await prisma.user.delete({
                    where: { id: newUser.id }
                });

                return res.status(502).json({
                    success: false,
                    message: "Échec de la création du compte: problème avec le service de paiement"
                });
            }



            const { password: _, ...userWithoutPassword } = updatedUser;

            return res.status(201).json({
                success: true,
                data: { user: userWithoutPassword },
                message: 'Inscription réussie. Veuillez vérifier votre email.'
            });
        } catch (error) {
            console.error('Error in register:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'inscription'
            });
        }
    },

    async verifyEmail(req, res) {
        try {
            const { token } = req.query;

            // Vérifier le token
            const decoded = jwt.verify(token, process.env.JWT_VERIFICATION_SECRET);
            const { email } = decoded;

            // Mettre à jour l'utilisateur et récupérer l'utilisateur mis à jour
            const updatedUser = await prisma.user.update({
                where: { email },
                data: { isMailVerified: true }
            });

            // Générer des tokens avec l'ID et le rôle de l'utilisateur
            const { accessToken } = authController.generateTokens(
                updatedUser.id,
                updatedUser.role
            );

            // Rediriger vers le frontend avec les tokens
            return res.redirect(
                `${process.env.FRONTEND_URL}/email-verification?token=${accessToken}`
            );
        } catch (error) {
            console.error('Error in verifyEmail:', error);

            // Déterminer le type d'erreur
            if (error.name === 'TokenExpiredError') {
                // Rediriger vers le frontend avec un message d'erreur
                return res.redirect(
                    `${process.env.FRONTEND_URL}/email-verification?error=expired`
                );
            }

            // Rediriger vers le frontend avec un message d'erreur générique
            return res.redirect(
                `${process.env.FRONTEND_URL}/email-verification?error=failed`
            );
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Vérification de l'existence de l'utilisateur
            const fetchedUser = await prisma.user.findUnique({
                where: { email }
            });

            if (!fetchedUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                });
            }

            // Vérification du statut du compte
            if (fetchedUser.role === 'DISABLED') {
                return res.status(403).json({
                    success: false,
                    message: 'Ce compte a été désactivé'
                });
            }

            // Vérification du mot de passe
            const passwordMatch = await bcrypt.compare(password, fetchedUser.password);

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                });
            }

            // Génération des tokens
            const { accessToken } = authController.generateTokens(fetchedUser.id, fetchedUser.role);

            // Retrait du mot de passe pour la réponse
            const { password: _, ...userWithoutPassword } = fetchedUser;

            return res.status(200).json({
                success: true,
                data: {
                    user: userWithoutPassword,
                    accessToken
                },
                message: 'Connexion réussie'
            });

        } catch (error) {
            console.error('Error in login :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la connexion'
            });
        }
    },

    async getProfile(req, res) {
        try {
            // req.user contient déjà les données à jour grâce au middleware protect
            const { password, ...userWithoutPassword } = req.user;

            return res.status(200).json({
                success: true,
                data: { user: userWithoutPassword },
                message: 'Profil récupéré avec succès'
            });
        } catch (error) {
            console.error('Error in getProfile :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du profil'
            });
        }
    },

    async updateProfile(req, res) {
        try {
            // Extraire les données validées du corps de la requête
            // Le validateur attend que tout soit dans req.body
            const { firstName, lastName, phone, company, currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            // Récupérer l'utilisateur actuel
            const fetchedUser = await prisma.user.findUnique({ where: { id: userId } });
            if (!fetchedUser) {
                return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
            }

            // Préparer l'objet de mise à jour
            const updateData = {
                updatedAt: new Date()
            };

            // Ajouter les champs optionnels s'ils sont fournis
            if (firstName) updateData.firstName = firstName;
            if (lastName) updateData.lastName = lastName;
            if (phone) updateData.phone = phone;
            if (company) updateData.company = company;

            // Traiter le changement de mot de passe si nécessaire
            // Remarque: le validateur a déjà vérifié que si newPassword est présent, currentPassword l'est aussi
            if (newPassword) {
                const passwordMatch = await bcrypt.compare(currentPassword, fetchedUser.password);
                if (!passwordMatch) {
                    return res.status(400).json({ success: false, message: "Mot de passe actuel incorrect" });
                }

                // Hasher le nouveau mot de passe
                const saltRounds = 10;
                updateData.password = await bcrypt.hash(newPassword, saltRounds);
            }

            // Mise à jour de l'utilisateur avec toutes les données modifiées
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData
            });

            // Retirer le mot de passe de la réponse
            const { password, ...updatedUserWithoutPassword } = updatedUser;

            return res.status(200).json({
                success: true,
                data: { user: updatedUserWithoutPassword },
                message: "Profil mis à jour avec succès"
            });

        } catch (error) {
            console.error("Error in updateProfile:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour du profil" });
        }
    }
};



export default authController;