import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


const serviceController = {
    async getAllServices(req, res) {
        try {
            const services = await prisma.service.findMany({
                where: {
                    isActive: true
                },
                // On sélectionne uniquement les champs nécessaires pour optimiser
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
    async getServiceByID(req, res) {
        try {
            const idService = req.params.id
            const service = await prisma.service.findUnique({
                where: {
                    id: idService,
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
            console.error('error in getServiceByID', error)
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du service'
            });
        }
    },
    async createService (req, res) {
        try{
    
        }
        catch{}
    
    }
}

export default serviceController;