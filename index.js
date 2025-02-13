import express from 'express';
import serviceRouter from './src/routes/service.route.js';
const app = express()
const port = process.env.PORT || 3000

// Middleware to serve static files from the 'public' directory.
app.use(express.static('public'))

// Middleware to parse JSON request bodies.
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/services', serviceRouter)
app.use('/payments', serviceRouter)

app.listen(port, () => {
    console.log(`My API app listening on port ${port}`)
})