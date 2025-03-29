// tests/functional/payment-flow.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import paymentController from '../../../controllers/payment.controller.js'
import webhookController from '../../../controllers/payment.webhook.controller.js'
import authMiddleware from '../../../middlewares/auth.middleware.js'

// Mock de l'authentification
vi.mock('../../../middlewares/auth.middleware.js', () => ({
    default: vi.fn((req, res, next) => {
        req.user = { id: 'user-123' }
        next()
    })
}))

// Mock des contrôleurs
vi.mock('../../../controllers/payment.controller.js', () => ({
    default: {
        createCheckoutSession: vi.fn(async (req, res) => {
            if (!req.body.orderId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de commande manquant'
                })
            }

            return res.status(200).json({
                success: true,
                data: { sessionUrl: 'https://checkout.stripe.com/test-session' },
                message: 'Session de paiement créée avec succès'
            })
        })
    }
}))

vi.mock('../../../controllers/payment.webhook.controller.js', () => ({
    default: {
        handleWebhook: vi.fn(async (req, res) => {
            if (req.body.type === 'checkout.session.completed') {
                return res.status(200).json({
                    success: true,
                    message: 'Paiement validé avec succès'
                })
            }

            return res.status(400).json({
                success: false,
                message: 'Type d\'événement non géré'
            })
        })
    }
}))

// Configuration de l'app Express
const app = express()
app.use(express.json())

// Routes de paiement
const paymentRouter = express.Router()
paymentRouter.post('/create-session', authMiddleware, paymentController.createCheckoutSession)

// Route de webhook
const webhookRouter = express.Router()
webhookRouter.post('/stripe', webhookController.handleWebhook)

app.use('/api/payments', paymentRouter)
app.use('/api/webhooks', webhookRouter)

describe('Processus Complet de Paiement', () => {
    let authToken = 'valid-token'

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should complete payment processus', async () => {
        // Étape 1: Création d'une session de paiement
        const sessionResponse = await request(app)
            .post('/api/payments/create-session')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ orderId: 'order-123' })

        expect(sessionResponse.status).toBe(200)
        expect(sessionResponse.body.success).toBe(true)
        expect(sessionResponse.body.data.sessionUrl).toBeDefined()

        // Étape 2: Simulation du webhook Stripe pour un paiement réussi
        const webhookResponse = await request(app)
            .post('/api/webhooks/stripe')
            .set('stripe-signature', 'test-signature')
            .send({
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'session-123',
                        metadata: { orderId: 'order-123' }
                    }
                }
            })

        expect(webhookResponse.status).toBe(200)
        expect(webhookResponse.body.success).toBe(true)

        // Vérifier que les contrôleurs ont été appelés
        expect(paymentController.createCheckoutSession).toHaveBeenCalledTimes(1)
        expect(webhookController.handleWebhook).toHaveBeenCalledTimes(1)
    })

    it('devrait échouer avec un ID de commande manquant', async () => {
        const response = await request(app)
            .post('/api/payments/create-session')
            .set('Authorization', `Bearer ${authToken}`)
            .send({}) // Pas d'orderId

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })
})