import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ProjectRequestService {

  // Créer une nouvelle demande de projet
  async create(data) {
    try {
      const projectRequest = await prisma.projectRequest.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
          company: data.company,
          requestedServices: data.requestedServices,
          estimatedTotal: data.estimatedTotal,
          projectDescription: data.projectDescription,
          desiredDeadline: data.desiredDeadline,
          hasExistingSite: data.hasExistingSite,
          existingSiteUrl: data.existingSiteUrl,
          additionalInfo: data.additionalInfo,
          status: 'PENDING',
        },
      });

      return projectRequest;
    } catch (error) {
      throw new Error(`Erreur création demande projet: ${error.message}`);
    }
  }

  // Récupérer une demande par ID
  async findById(id) {
    try {
      return await prisma.projectRequest.findUnique({
        where: { id },
        include: { order: true },
      });
    } catch (error) {
      throw new Error(`Erreur récupération demande: ${error.message}`);
    }
  }

  // Lister toutes les demandes (admin)
  async findAll(status) {
    try {
      return await prisma.projectRequest.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: { order: true },
      });
    } catch (error) {
      throw new Error(`Erreur liste demandes: ${error.message}`);
    }
  }

  // Mettre à jour le statut
  async updateStatus(id, data) {
    try {
      return await prisma.projectRequest.update({
        where: { id },
        data: { status: data.status },
      });
    } catch (error) {
      throw new Error(`Erreur mise à jour statut: ${error.message}`);
    }
  }

  // Lier une commande à une demande
  async linkOrder(requestId, orderId) {
    try {
      return await prisma.projectRequest.update({
        where: { id: requestId },
        data: {
          orderId,
          status: 'ACCEPTED',
        },
      });
    } catch (error) {
      throw new Error(`Erreur liaison commande: ${error.message}`);
    }
  }
}

export default new ProjectRequestService();
