import { z } from 'zod';

// Schéma pour un service dans la demande
const requestedServiceSchema = z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

// Schéma pour créer une demande de projet
export const createProjectRequestSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
  company: z.string().optional(),

  requestedServices: z.array(requestedServiceSchema).min(1, 'Au moins un service requis'),
  estimatedTotal: z.number().positive('Le montant doit être positif'),

  projectDescription: z.string().min(20, 'Description trop courte (minimum 20 caractères)'),
  desiredDeadline: z.enum(['< 1 mois', '1-3 mois', '3-6 mois', 'Pas de contrainte']),
  hasExistingSite: z.boolean(),
  existingSiteUrl: z.string().url().optional().or(z.literal('')),
  additionalInfo: z.string().optional(),
});

// Schéma pour mettre à jour le statut
export const updateProjectRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'QUOTED', 'ACCEPTED', 'REJECTED', 'ARCHIVED']),
});
