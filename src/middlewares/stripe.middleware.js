import express from 'express';

const stripeWebhookMiddleware = express.raw({
    type: 'application/json'
});

export default stripeWebhookMiddleware;