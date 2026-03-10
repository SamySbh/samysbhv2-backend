import logger from '../configs/logger.config.js';

const metricsCollector = {
    startTime: Date.now(),
    requestCount: 0,
    errorCount: 0,
    authFailures: 0,
    webhookCount: 0,
    responseTimes: [],

    recordRequest(responseTimeMs, statusCode) {
        this.requestCount++;
        this.responseTimes.push(responseTimeMs);
        if (this.responseTimes.length > 100) {
            this.responseTimes.shift();
        }
        if (statusCode >= 400) {
            this.errorCount++;
        }
    },

    recordAuthFailure() {
        this.authFailures++;
        logger.warn('[IoT] Tentative de connexion échouée', { authFailures: this.authFailures });
    },

    recordWebhook() {
        this.webhookCount++;
    },

    getSnapshot() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const avgResponseTime = this.responseTimes.length > 0
            ? Math.round(this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length)
            : 0;
        const errorRate = this.requestCount > 0
            ? Math.round((this.errorCount / this.requestCount) * 10000) / 100
            : 0;

        return {
            uptime,
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            authFailures: this.authFailures,
            webhookCount: this.webhookCount,
            avgResponseTime,
            errorRate,
        };
    },
};

logger.info('[IoT] Metrics collector initialisé');

export default metricsCollector;
