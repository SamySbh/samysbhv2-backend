import express from 'express';

const stripeWebhookMiddleware = express.raw({
    type: '*/*'
});

export default stripeWebhookMiddleware;