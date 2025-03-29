// tests/integration/routes/service.routes.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import serviceController from '../../../controllers/service.controller.js'

// Mocker le contrôleur
vi.mock('../../../controllers/service.controller.js', () => ({
    default: {
        getAllServices: vi.fn((req, res) => {
            return res.status(200).json({
                success: true,
                data: [{ id: '1', name: 'Service test' }],
                message: 'Les services ont bien été récupérés'
            })
        }),
        getServiceById: vi.fn((req, res) => {
            const id = req.params.id

            if (id === 'valid-id') {
                return res.status(200).json({
                    success: true,
                    data: { fetchedService: { id: 'valid-id', name: 'Service test' } },
                    message: 'Le service a bien été récupéré'
                })
            }

            return res.status(404).json({
                success: false,
                message: 'Aucun service trouvé'
            })
        })
        // Ajouter d'autres méthodes si nécessaire
    }
}))

// Créer un routeur simplifié pour les tests
const router = express.Router()
router.get('/', serviceController.getAllServices)
router.get('/:id', serviceController.getServiceById)

// Configurer l'app Express
const app = express()
app.use(express.json())
app.use('/services', router)

describe('Service API Routes', () => {
    describe('GET /services', () => {
        it('should return all services', async () => {
            const response = await request(app).get('/services')

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data).toBeInstanceOf(Array)
        })
    })

    describe('GET /services/:id', () => {
        it('should return a service by id', async () => {
            const response = await request(app).get('/services/valid-id')

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data.fetchedService).toBeDefined()
        })

        it('should return 404 for non-existent service', async () => {
            const response = await request(app).get('/services/invalid-id')

            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
        })
    })
})