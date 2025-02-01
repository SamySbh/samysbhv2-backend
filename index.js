import express from 'express';

const app = express()
const port = process.env.PORT || 3000

// Middleware to serve static files from the 'public' directory.
app.use(express.static('public'))

// Middleware to parse JSON request bodies.
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.get('/samy', (req, res) => {
    res.send('Hello World ! Im Samy kkkk dd$$$')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})