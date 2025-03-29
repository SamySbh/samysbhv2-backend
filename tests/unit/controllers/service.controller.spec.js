// tests/unit/controllers/service.controller.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Stripe directement (avant tout import qui pourrait l'utiliser)
vi.mock('stripe', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            // Fonctions de l'API Stripe si nécessaire
        }))
    }
})

// Mock du module stripe config
vi.mock('@/configs/stripe.js', () => ({
    default: {}
}))

import { PrismaClient } from '@prisma/client'
import serviceController from '@/controllers/service.controller.js'

// Mock Prisma
vi.mock('@prisma/client', () => {
    const mockPrismaClient = {
        service: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        }
    }
    return {
        PrismaClient: vi.fn(() => mockPrismaClient)
    }
})

// Mock Stripe Service
vi.mock('@/services/stripe.service.js', () => ({
    default: {
        addProduct: vi.fn().mockResolvedValue({ id: 'stripe-product-id-123' })
    }
}))

describe('Service Controller', () => {
    let req, res, prisma

    beforeEach(() => {
        prisma = new PrismaClient()

        // Réinitialiser les mocks
        vi.clearAllMocks()

        // Request object
        req = {
            params: {},
            body: {}
        }

        // Response object avec des fonctions mock
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        }
    })

    describe('getAllServices', () => {
        it('should return all services', async () => {
            // Données de test
            const mockServices = [
                {
                    id: '1',
                    name: 'Site Vitrine',
                    description: 'Un site vitrine élégant',
                    basePrice: 990,
                    image: 'image.jpg',
                    type: 'VITRINE',
                    features: ['Responsive', 'SEO'],
                    isActive: true
                }
            ]

            // Configurer le mock pour retourner nos données
            prisma.service.findMany.mockResolvedValue(mockServices)

            // Appeler la méthode du contrôleur
            await serviceController.getAllServices(req, res)

            // Vérifier les résultats
            expect(prisma.service.findMany).toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockServices,
                message: 'Les services ont bien été récupérés'
            })
        })

        it('should return 404 when no services found', async () => {
            // Configurer le mock pour retourner un tableau vide
            prisma.service.findMany.mockResolvedValue([])

            // Appeler la méthode du contrôleur
            await serviceController.getAllServices(req, res)

            // Vérifier les résultats
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Aucun service trouvé'
            })
        })

        it('should handle errors', async () => {
            // Configurer le mock pour lancer une erreur
            prisma.service.findMany.mockRejectedValue(new Error('DB error'))

            // Appeler la méthode du contrôleur
            await serviceController.getAllServices(req, res)

            // Vérifier les résultats
            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur lors de la récupération des services'
            })
        })
    })

    describe('getServiceById', () => {
        it('should return a service by id', async () => {
            // Données de test
            const mockService = {
                id: 'service-id',
                name: 'Site E-commerce',
                description: 'Une boutique en ligne complète',
                basePrice: 1990,
                image: 'ecommerce.jpg',
                type: 'ECOMMERCE',
                features: ['Responsive', 'SEO', 'Panier'],
                isActive: true
            }

            // Configurer la requête
            req.params.id = 'service-id'

            // Configurer le mock
            prisma.service.findUnique.mockResolvedValue(mockService)

            // Appeler la méthode du contrôleur
            await serviceController.getServiceById(req, res)

            // Vérifier les résultats
            expect(prisma.service.findUnique).toHaveBeenCalledWith({
                where: { id: 'service-id' },
                select: expect.any(Object)
            })
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { fetchedService: mockService },
                message: 'Le service a bien été récupéré'
            })
        })

        it('should return 404 when service not found', async () => {
            // Configurer la requête
            req.params.id = 'unknown-id'

            // Configurer le mock pour retourner null
            prisma.service.findUnique.mockResolvedValue(null)

            // Appeler la méthode du contrôleur
            await serviceController.getServiceById(req, res)

            // Vérifier les résultats
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Aucun service trouvé'
            })
        })
    })

    describe('createService', () => {
        it('should create a service and return 201', async () => {
            // Données de test
            const serviceData = {
                name: 'Nouveau Service',
                basePrice: 1200,
                description: 'Description du service',
                image: 'image.jpg',
                isActive: true,
                type: 'VITRINE',
                features: ['Responsive']
            }

            // Configurer la requête
            req.body = serviceData

            // Configurer les mocks
            const createdService = {
                id: 'new-service-id',
                ...serviceData
            }

            prisma.service.create.mockResolvedValue(createdService)
            prisma.service.update.mockResolvedValue({
                ...createdService,
                stripeProductId: 'stripe-product-id-123'
            })

            // Appeler la méthode du contrôleur
            await serviceController.createService(req, res)

            // Vérifier les résultats
            expect(prisma.service.create).toHaveBeenCalledWith({
                data: serviceData
            })
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.any(Object),
                message: 'Le service a bien été créé'
            })
        })
    })

    // Tu peux ajouter des tests similaires pour updateService, deleteService
})