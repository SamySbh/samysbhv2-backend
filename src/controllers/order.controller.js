import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const orderController = {
    async getAllOrders(req, res) {
        try {
            const orders = await prisma.order.findMany();
            if (!orders || orders.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune commande trouvée'
                });
            };
            return res.status(200).json({
                success: true,
                data: orders,
                message: 'Les commandes ont bien été récupérées'
            });
        }

        catch (error) {
            console.error('Error in getAllOrders :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des commandes'
            });
        }
    },

    async getOrderById(req, res) {
        try {
            const orderId = req.params.id
            const fetchedOrder = await prisma.order.findUnique({
                where: {
                    id: orderId
                }
            });

            if (!fetchedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune commande trouvée'
                })
            };

            return res.status(200).json({
                success: true,
                data: { fetchedOrder },
                message: 'La commande a bien été récupérée'
            });
        } catch (error) {

            console.error('Error in getOrderById :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la commande'
            });
        }
    },
    async createOrder(req, res) {
        try {
            const createdOrder = await prisma.order.create({
                data: {
                    statusMain: req.body.statusMain,
                    statusPayment: req.body.statusPayment,
                    totalAmount: req.body.totalAmount,
                    depositAmount: req.body.depositAmount,
                    deadlineDate: req.body.deadlineDate,
                    userId: req.body.userId,
                    orderItems: []
                }
            });
            return res.status(201).json({
                success: true,
                data: createdOrder,
                message: 'La commande bien été créé'
            });
        } catch (error) {
            console.error('Error in createOrder :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la commande'
            });
        }
    },
    async updateOrder(req, res) {
        try {
            const orderId = req.params.id;
            const fetchedOrder = await prisma.order.findUnique({
                where: {
                    id: orderId
                }
            });
            if (!fetchedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                })
            }

            const updatedOrder = await prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    statusMain: req.body.statusMain,
                    statusPayment: req.body.statusPayment,
                    totalAmount: req.body.totalAmount,
                    depositAmount: req.body.depositAmount,
                    deadlineDate: req.body.deadlineDate,
                    userId: req.body.userId
                }
            });

            return res.status(200).json({
                success: true,
                data: updatedOrder,
                message: 'La commande a bien été mis à jour'
            });
        } catch (error) {
            console.error('Error in updateOrder :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la modification de la commande'
            });
        }
    },
    async deleteOrder(req, res) {
        const orderId = req.params.id
        try {
            const deletedOrder = await prisma.order.delete({
                where: {
                    id: orderId
                }
            });
            if (!deletedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune commande trouvée'
                });
            }
            return res.status(200).json({
                success: true,
                data: deletedOrder,
                message: 'La commande a bien été supprimé'
            })
        } catch (error) {
            console.error('Error in deleteOrder :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la commande'
            })
        }
    }
}

export default orderController;