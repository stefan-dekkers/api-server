const express = require('express')
const app = express()
const port = 3000

app.use('*', (req, res, next) => {
    const method = req.method
    console.log('Method ' + method + ' is used')
    next()
})

const users = []
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/api/info', (req, res) => {
    let path = req.path
    console.log('On path ' + path)
    res.status(200).json(
        {
            status: 200,
            message: 'Server info-endpoint',
            data:{
                studentName: 'Stefan',
                studentNumber: 1234567,
                description: 'Test'
            }
        }
    )
})

// UC-201
app.post('/api/register', (req, res) => {
    const username = req.body.email
    const password = req.body.password
    
    if (!email || !password) {
        return res.status(400).send('Email and password are required')
    }

    if (users.find(user => user.username === username)) {
        return res.status(400).send('Email already exists')
    }
    
    let idNumber = users.length + 1
    users.push({ email, password, idNumber})
    const newUser = users.find(user => user.email === email)
    res.json(newUser)
})

// UC-202
app.get('/api/user', (req, res) => {
    res.send('GET request to user')
})

app.get('/api/user?field1=:value1&field2=:value2', (req, res) => {
    res.send('GET request to user (filtered)')
})

// UC-203
app.get('/api/user/profile', (req, res) => {
    res.send('GET request to profile')
})

// UC-204
app.get('/api/user/:userId', (req, res) => {
    res.send('GET request to user with userId')
})

// UC-205
app.put('/api/user/:userId', (req, res) => {
    res.send('GET request to user with userId')
})

// UC-206
app.delete('/api/user/:userId', (req, res) => {
    res.send('GET request to user with userId')
})

app.use('*', (req, res) => {
    res.status(404).json(
        {
            status: 404,
            message: 'Error',
            data:{}
        }
    )
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports = app;