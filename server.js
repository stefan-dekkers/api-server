// API Server by Stefan Dekkers

const express = require('express');
const assert = require('assert');

const app = express();
const port = 3000;

app.use(express.json());

// Tracer
var logger = require('tracer').console();

// In memory database
let database = {
    users: [
      {
        id: 0,
        firstName: 'John',
        lastName: 'Doe',
        emailAdress: 'john.doe@example.com'
      },
      {
        id: 1,
        firstName: 'Jane',
        lastName: 'Smith',
        emailAdress: 'jane.smith@example.com'
      },
      {
        id: 2,
        firstName: 'David',
        lastName: 'Lee',
        emailAdress: 'david.lee@example.com'
      },
      {
        id: 3,
        firstName: 'Sarah',
        lastName: 'Jones',
        emailAdress: 'sarah.jones@example.com'
      }
    ]
  };

let index = database.users.length;

app.use('*', (req, res, next) => {
    logger.log('General route');

    const method = req.method;
    console.log(`Method ${method} is called`);
    next();
});

// Info endpoints
app.get('/api/info', (req, res) => {
    logger.log('Info endpoint');

    res.status(201).json({
        status: 201,
        message: 'Server info-endpoint',
        data: {
            studentName: 'Stefan',
            studentNumber: 1234567,
            description: 'Welcome to the server API for share a meal, made by Stefan Dekkers'
        }
    });
});
  
// UC-201
app.post('/api/register', (req, res) => {
    logger.log('UC-201');

    const user = req.body;
    console.log('user = ', user);
  
    try {
        // assert(user === {}, 'Userinfo is missing');
        assert(typeof user.firstName === 'string', 'firstName must be a string');
        assert(
            typeof user.emailAdress === 'string',
            'emailAddress must be a string'
        );
    } catch (err) {
        // Als één van de asserts failt sturen we een error response.
        res.status(400).json({
            status: 400,
            message: err.message.toString(),
            data: {}
        });
        // Nodejs is asynchroon. We willen niet dat de applicatie verder gaat
        // wanneer er al een response is teruggestuurd.
        return;
    }
  
    // Zorg dat de id van de nieuwe user toegevoegd wordt
    // en hoog deze op voor de volgende insert.
    user.id = index++;
    // User toevoegen aan database
    database['users'].push(user);
  
    // Stuur het response terug
    res.status(200).json({
        status: 200,
        message: `User met id ${user.id} is toegevoegd`,
        // Wat je hier retourneert is een keuze; misschien wordt daar in het
        // ontwerpdocument iets over gezegd.
        data: user
    });
});

// UC-202
app.get('/api/user', (req, res) => {
    logger.log('UC-202');

    // er moet precies 1 response verstuurd worden.
    const statusCode = 200;
    res.status(statusCode).json({
        status: statusCode,
        message: 'User getAll endpoint',
        data: database.users
    });
});

// UC-203
app.get('/api/user/profile', (req, res) => {
    logger.log('UC-203');

    res.send('GET request to profile')
})

// UC-204
app.get('/api/user/:userId', (req, res) => {
    logger.log('UC-204');

    res.send('GET request to user with userId')
})

// UC-205
app.put('/api/user/:userId', (req, res) => {
    logger.log('UC-205');

    res.send('GET request to user with userId')
})

// UC-206
app.delete('/api/user/:userId', (req, res) => {
    logger.log('UC-206');

    res.send('GET request to user with userId')
})
  
// Sink
app.use('*', (req, res) => {
    logger.log('Sink');

    res.status(404).json({
        status: 404,
        message: 'Endpoint not found',
        data: {}
    });
});
  
// Start server
app.listen(port, () => {
    logger.log('Starting server...');

    console.log(`Example app listening on port ${port}`);
});
  
// Export server for tests
module.exports = app;