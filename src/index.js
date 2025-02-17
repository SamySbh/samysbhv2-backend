import express from 'express';
import serviceRouter from './routes/service.routes.js';
import userRouter from './routes/user.routes.js';
import orderRouter from './routes/order.routes.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to serve static files from the 'public' directory.
app.use(express.static('public'));

// Middleware to parse JSON request bodies.
app.use(express.json());

app.use('/services', serviceRouter);
app.use('/users', userRouter);
app.use('/orders', orderRouter);

app.listen(port, () => {
    console.log(`My API app listening on port ${port}`)
});