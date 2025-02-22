import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const userController = {
    async getAllUsers(req, res) {
        try {
            const users = await prisma.user.findMany();
            if (!users || users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucun utilisateur trouvé'
                });
            };
            return res.status(200).json({
                success: true,
                data: users,
                message: 'Les utilisateurs ont bien été récupéres'
            });
        }

        catch (error) {
            console.error('Error in getAllUsers :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des utilisateurs'
            });
        }
    },

    async getUserById(req, res) {
        try {
            const userId = req.params.id
            const user = await prisma.user.findUnique({
                where: {
                    id: userId
                }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucun utilisateur trouvé'
                })
            };

            return res.status(200).json({
                success: true,
                data: { user },
                message: 'L\'utilisateur a bien été récupéré'
            });
        } catch (error) {

            console.error('Error in getUserById :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'utilisateur'
            });
        }
    },
    async createUser(req, res) {
        try {
            const createdUser = await prisma.user.create({
                data: {
                    email: req.body.email,
                    role: req.body.role,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    password: req.body.password,
                    phone: req.body.phone,
                    company: req.body.company
                }
            });
            return res.status(201).json({
                success: true,
                data: createdUser,
                message: 'L\'utilisateur a bien été créé'
            });
        } catch (error) {
            console.error('Error in createUser :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'utilisateur'
            });
        }
    },
    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const existingUser = await prisma.user.findUnique({
                where: {
                    id: userId
                }
            });
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                })
            }

            const updatedUser = await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    email: req.body.name,
                    role: req.body.role,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    password: req.body.password,
                    phone: req.body.phone,
                    company: req.body.company
                }
            });

            return res.status(200).json({
                success: true,
                data: updatedUser,
                message: 'L\'utilisateur a bien été mis à jour'
            });
        } catch (error) {
            console.error('Error in updateUser :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la modification de l\'utilisateur'
            });
        }
    },
    async deleteUser(req, res) {
        const idUser = req.params.id
        try {
            const deletedUser = await prisma.user.delete({
                where: {
                    id: idUser
                }
            });
            if (!deletedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucun utilisateur trouvé'
                });
            }
            return res.status(200).json({
                success: true,
                data: deletedUser,
                message: 'L\'utilisateur a bien été supprimé'
            })
        } catch (error) {
            console.error('Error in deleteUser :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de l\'utilisateur'
            })
        }
    }
}

export default userController;