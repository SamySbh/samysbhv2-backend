import logger from '../configs/logger.config.js';

const iotAiController = {
    async analyzeMetrics(req, res) {
        try {
            const { metrics } = req.body;

            if (!metrics) {
                return res.status(400).json({
                    success: false,
                    message: 'Métriques manquantes dans le body'
                });
            }

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 500,
                    system: "Tu es un expert en cybersécurité qui analyse des métriques de serveur. Réponds en français, de manière concise en 3-4 phrases. Dis si les métriques sont normales ou suspectes et donne une recommandation claire.",
                    messages: [
                        {
                            role: 'user',
                            content: JSON.stringify(metrics),
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                logger.error('❌ Erreur API Anthropic', {
                    status: response.status,
                    error: errorData.error?.message
                });
                return res.status(502).json({
                    success: false,
                    message: errorData.error?.message || `Erreur API Anthropic ${response.status}`
                });
            }

            const data = await response.json();
            const textBlock = data.content?.find(b => b.type === 'text');
            const analysis = textBlock?.text ?? 'Aucune analyse disponible.';

            logger.info('✅ Analyse IA des métriques effectuée');

            return res.status(200).json({
                success: true,
                data: { analysis }
            });

        } catch (error) {
            logger.error('❌ Erreur lors de l\'analyse IA des métriques', {
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'analyse IA'
            });
        }
    }
};

export default iotAiController;
