import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const authController = {
    async register(req, res) {
        try {
            // 1. Récupération des données  ²du formulaire
            const { email, firstName, lastName, password, phone, company } = req.body;

            // 2. Vérification si l'utilisateur existe déjà
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }

            // 3. Hashage du mot de passe (JAMAIS stocker en clair)
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // 4. Création de l'utilisateur en base
            const newUser = await prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    password: hashedPassword,
                    phone,
                    company,
                    role: 'USER', // Par défaut un nouvel inscrit est USER
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            // 5. On retire le mot de passe de la réponse
            const { password: _, ...userWithoutPassword } = newUser;

            // 6. Création du token JWT
            const token = jwt.sign(
                { id: newUser.id, role: newUser.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // 7. Envoi de la réponse
            return res.status(201).json({
                success: true,
                data: { user: userWithoutPassword, token },
                message: 'Inscription réussie'
            });

        } catch (error) {
            console.error('Error in register :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'inscription'
            });
        }
    },

    async login(req, res) {
        try {
            // 1. Récupération email/password
            const { email, password } = req.body;

            // 2. Vérification si l'utilisateur existe
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                });
            }

            // 3. Vérification du statut du compte
            if (user.role === 'DISABLED') {
                return res.status(403).json({
                    success: false,
                    message: 'Ce compte a été désactivé'
                });
            }

            // 4. Vérification du mot de passe
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                });
            }

            // 5. Création du token JWT
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // 6. On retire le mot de passe de la réponse
            const { password: _, ...userWithoutPassword } = user;

            // 7. Envoi de la réponse
            return res.status(200).json({
                success: true,
                data: { user: userWithoutPassword, token },
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
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
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
                const passwordMatch = await bcrypt.compare(currentPassword, user.password);
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