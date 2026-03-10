import metricsCollector from '../services/metrics.service.js';

const iotController = {
    getMetrics(req, res) {
        const snapshot = metricsCollector.getSnapshot();
        return res.status(200).json({ success: true, data: snapshot });
    }
};

export default iotController;
