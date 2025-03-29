import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const orderItemController = {
    async getAllOrderItems(req, res) {
        try {
            const orderItems = await prisma.orderItem.findMany();
            if (!orderItems || orderItems.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucun item trouvé'
                });
            };
            return res.status(200).json({
                success: true,
                data: orderItems,
                message: 'Les items ont bien été récupérés'
            });
        }

        catch (error) {
            console.error('Error in getAllOrderItems :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des items'
            });
        }
    },

    async getOrderItemById(req, res) {
        try {
            const orderItemId = req.params.id
            const fetchedOrderItem = await prisma.orderItem.findUnique({
                where: {
                    id: orderItemId
                }
            });

            if (!fetchedOrderItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucun item trouvé'
                })
            };

            return res.status(200).json({
                success: true,
                data: { fetchedOrderItem },
                message: 'L\'item a bien été récupéré'
            });
        } catch (error) {

            console.error('Error in getOrderItemById :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'item'
            });
        }
    },
    async createOrderItem(req, res) {
        try {
            const createdOrderItem = await prisma.orderItem.create({
                data: {
                    unitAmount: req.body.unitAmount,
                    totalAmount: req.body.totalAmount,
                    quantity: req.body.quantity,
                    orderId: req.body.orderId,
                    serviceId: req.body.serviceId
                }
            });
            return res.status(201).json({
                success: true,
                data: createdOrderItem,
                message: 'L\' item bien été créé'
            });
        } catch (error) {
            console.error('Error in createOrderItem :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'item'
            });
        }
    },
    async updateOrderItem(req, res) {
        try {
            const orderItemId = req.params.id;
            const fetchedOrderItem = await prisma.orderItem.findUnique({
                where: {
                    id: orderItemId
                }
            });
            if (!fetchedOrderItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Item non trouvé'
                })
            }

            const updatedOrderItem = await prisma.orderItem.update({
                where: {
                    id: orderItemId
                },
                data: {
                    unitAmount: req.body.unitAmount,
                    totalAmount: req.body.totalAmount,
                    quantity: req.body.quantity,
                    orderId: req.body.orderId,
                    serviceId: req.body.serviceId

                }
            });

            return res.status(200).json({
                success: true,
                data: updatedOrderItem,
                message: 'L\'item a bien été mis à jour'
            });
        } catch (error) {
            console.error('Error in updateOrderItem :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la modification de l\'item'
            });
        }
    },
    async deleteOrderItem(req, res) {
        const orderIdItem = req.params.id
        try {
            const deletedOrderItem = await prisma.orderItem.delete({
                where: {
                    id: orderIdItem
                }
            });
            if (!deletedOrderItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucun item trouvé'
                });
            }
            return res.status(200).json({
                success: true,
                data: deletedOrderItem,
                message: 'L\'item a bien été supprimé'
            })
        } catch (error) {
            console.error('Error in deleteOrderItem :');
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de l\'item'
            })
        }
    }
}

export default orderItemController;