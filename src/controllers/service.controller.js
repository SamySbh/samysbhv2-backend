import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const serviceController = {
    async getAllServices(req, res) {
        try {
            const services = await prisma.service.findMany({
                where: {
                    isActive: true
                },
                // On sélectionne uniquement les champs nécessaires :
                select: {
                    id: true,
                    name: true,
                    description: true,
                    basePrice: true,
                    image: true,
                }
            });

            if (!services || services.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucun service trouvé'
                });
            }

            return res.status(200).json({
                success: true,
                data: services,
                message: 'Les services ont bien été récupérés'
            });

        } catch (error) {
            console.error('Error in getAllServices:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des services'
            });
        }
    },
    async getServiceById(req, res) {
        try {
            const serviceId = req.params.id
            const service = await prisma.service.findUnique({
                where: {
                    id: serviceId
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    basePrice: true,
                    image: true
                }
            })

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucun service trouvé'
                })
            }


            return res.status(200).json({
                success: true,
                data: { service },
                message: 'Le service a bien été récupéré'
            });
        }

        catch (error) {
            console.error('error in getServiceById', error)
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du service'
            });
        }
    },
    async createService(req, res) {
        try {
            const createdService = await prisma.service.create({
                data: {
                    name: req.body.name,
                    basePrice: req.body.basePrice,
                    description: req.body.description,
                    image: req.body.image,
                    isActive: req.body.isActive,
                    type: req.body.type
                }
            })

            return res.status(201).json({
                success: true,
                data: createdService,
                message: 'Le service a bien été créé'
            })
        }
        catch (error) {
            console.error('Error in createService :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du service'
            });
        }

    },
    async updateService(req, res) {
        try {
            const serviceId = req.params.id;
            const existingService = await prisma.service.findUnique({
                where: {
                    id: serviceId
                }
            });

            if (!existingService) {
                return res.status(404).json({
                    success: false,
                    message: 'Service non trouvé'
                });
            }

            const updatedService = await prisma.service.update({
                where: {
                    id: serviceId
                },
                data: {
                    name: req.body.name,
                    basePrice: req.body.basePrice,
                    description: req.body.description,
                    image: req.body.image,
                    isActive: req.body.isActive,
                    type: req.body.type
                }
            });

            return res.status(200).json({
                success: true,
                data: updatedService,
                message: 'Le service a bien été mis à jour'
            });
        }
        catch (error) {
            console.error('Error in updateService :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la modification du service'
            });
        }
    },
    async deleteService(req, res) {
        const idService = req.params.id
        try {
            const deletedService = await prisma.service.delete({
                where: {
                    id: idService
                }
            });
            if (!deletedService) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucun service trouvé'
                });
            }
            return res.status(200).json({
                success: true,
                data: deletedService,
                message: 'Le service a bien été supprimé'
            });
        }
        catch (error) {
            console.error('Error in deleteService :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du service'
            });
        }
    }
}

export default serviceController;