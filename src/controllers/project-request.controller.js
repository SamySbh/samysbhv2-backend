import projectRequestService from '../services/project-request.service.js';
import OrderService from '../services/order.service.js';
import EmailService from '../services/email.service.js';
import { createProjectRequestSchema, updateProjectRequestStatusSchema } from '../schemas/project-request.schema.js';

class ProjectRequestController {

  // POST /project-requests - Créer une demande
  async create(req, res) {
    try {
      // Validation des données
      const validatedData = createProjectRequestSchema.parse(req.body);

      // 1. Créer la demande de projet
      const projectRequest = await projectRequestService.create(validatedData);

      let order = null;

      // 2. Si l'utilisateur est connecté, créer automatiquement la commande associée
      if (req.user) {
        order = await OrderService.createManualOrder({
          userId: req.user.id,
          totalAmount: projectRequest.estimatedTotal,
          projectRequestId: projectRequest.id,
        });
      }

      // Envoyer les emails de confirmation (non bloquants)
      EmailService.sendOrderCreatedEmail(
        projectRequest.email,
        projectRequest.name,
        order ? order.id : projectRequest.id,
        projectRequest.estimatedTotal
      ).catch((emailError) => {
        console.error('Erreur envoi email confirmation client:', emailError);
      });

      EmailService.sendAdminNewRequestNotification(projectRequest)
        .catch((emailError) => {
          console.error('Erreur envoi email notification admin:', emailError);
        });

      return res.status(201).json({
        success: true,
        data: { projectRequest, order },
        message: 'Demande de projet créée avec succès',
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/project-requests/:id - Récupérer une demande
  async findOne(req, res) {
    try {
      const { id } = req.params;
      const projectRequest = await projectRequestService.findById(id);

      if (!projectRequest) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée',
        });
      }

      return res.status(200).json({
        success: true,
        data: projectRequest,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/admin/project-requests - Lister toutes (admin)
  async findAll(req, res) {
    try {
      const { status } = req.query;
      const projectRequests = await projectRequestService.findAll(status);

      return res.status(200).json({
        success: true,
        data: projectRequests,
        count: projectRequests.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PATCH /api/admin/project-requests/:id - Mettre à jour le statut (admin)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const validatedData = updateProjectRequestStatusSchema.parse(req.body);

      const updatedRequest = await projectRequestService.updateStatus(id, validatedData);

      return res.status(200).json({
        success: true,
        data: updatedRequest,
        message: 'Statut mis à jour',
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new ProjectRequestController();
