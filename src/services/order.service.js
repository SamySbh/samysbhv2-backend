import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OrderService = {
    async createOrderWithItems(orderData, orderItems) {
        return prisma.$transaction(async (tx) => {
            // Créer la commande
            const order = await tx.order.create({
                data: orderData
            });

            // Créer les items de commande
            const items = await Promise.all(
                orderItems.map(item => tx.orderItem.create({
                    data: {
                        ...item,
                        orderId: order.id
                    }
                }))
            );

            return {
                order,
                items
            };
        });
    }
};

export default OrderService;