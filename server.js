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
            emailAddress: 'john.doe@example.com'
        },
        {
            id: 1,
            firstName: 'Jane',
            lastName: 'Smith',
            emailAddress: 'jane.smith@example.com'
        },
        {
            id: 2,
            firstName: 'David',
            lastName: 'Lee',
            emailAddress: 'david.lee@example.com'
        },
        {
            id: 3,
            firstName: 'Sarah',
            lastName: 'Jones',
            emailAddress: 'sarah.jones@example.com'
        }
    ],
    profile: {
            id: 1,
            userName: 'Stefan-Dekkers',
            password: '123',
            firstName: 'Stefan',
            lastName: 'Dekkers',
            emailAddress: 'stefan.dekkers@example.com'
        }
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

    res.status(200).json({
        status: 200,
        message: 'Server info-endpoint',
        data: {
            studentName: 'Stefan',
            studentNumber: 1234567,
            description: 'Welcome to the server API for share a meal, made by Stefan Dekkers'
        }
    });
});
  
// UC-201
app.post('/api/user', (req, res) => {
    logger.log('UC-201');

    const user = req.body;
    console.log('user = ', user);
  
    try {
        // assert(user === {}, 'Userinfo is missing');
        assert(typeof user.firstName === 'string', 'firstName must be a string');
        assert(typeof user.lastName === 'string', 'lastName must be a string');
        assert(typeof user.emailAddress === 'string','emailAddress must be a string');
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message.toString(),
            data: {}
        });
        return;
    }
  
    user.id = index++;
    console.log('user.id = ', user.id);
    database['users'].push(user);
    console.log('database[users] = ', database['users']);
  
    res.status(200).json({
        status: 200,
        message: `User with id ${user.id} is added`,
        data: user
    });
});

// UC-202
app.get('/api/user', (req, res) => {
    logger.log('UC-202');

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

    res.status(200).json({
        status: 200,
        message: 'User profile retrieved',
        data: database.profile
    });
});

// UC-204
app.get('/api/user/:userId', (req, res) => {
    logger.log('UC-204');

    const { userId } = req.params;
  
    try {
        assert(typeof parseInt(userId) === 'number', 'userId must be a number');
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message.toString(),
            data: {}
        });
        return;
    }

    const user = database['users'].find(u => u.id === parseInt(userId));

    if (!user) {
        res.status(404).json({
            status: 404,
            message: `User with id ${userId} not found`,
            data: {}
        });
        return;
    }
    
    res.status(200).json({
        status: 200,
        message: `User with id ${userId} retrieved`,
        data: user
    });
});

// UC-205
app.put('/api/user/:userId', (req, res) => {
    logger.log('UC-205');
  
    const { userId } = req.params;
  
    try {
        assert(typeof parseInt(userId) === 'number', 'userId must be a number');
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message.toString(),
            data: {}
        });
        return;
    }
  
    const userIndex = database['users'].findIndex(u => u.id === parseInt(userId));
  
    if (userIndex === -1) {
        res.status(404).json({
            status: 404,
            message: `User with id ${userId} not found`,
            data: {}
        });
        return;
    }
  
    const user = database['users'][userIndex];
  
    const updatedUser = {
      ...user,
      ...req.body
    };
  
    database['users'][userIndex] = updatedUser;
  
    res.status(200).json({
      status: 200,
      message: `User with id ${userId} updated`,
      data: updatedUser
    });
});  

// UC-206
app.delete('/api/user/:userId', (req, res) => {
    logger.log('UC-205');
  
    const { userId } = req.params;
  
    try {
      assert(typeof parseInt(userId) === 'number', 'userId must be a number');
    } catch (err) {
      res.status(400).json({
        status: 400,
        message: err.message.toString(),
        data: {},
      });
      return;
    }
  
    const userIndex = database['users'].findIndex(u => u.id === parseInt(userId));
  
    if (userIndex === -1) {
      res.status(404).json({
        status: 404,
        message: `User with id ${userId} not found`,
        data: {},
      });
      return;
    }
  
    database['users'].splice(userIndex, 1);
  
    res.status(200).json({
      status: 200,
      message: `User with id ${userId} deleted`,
      data: {},
    });
});
  
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
    console.log(`Example app listening on port ${port}`);
});
  
// Export server for tests
module.exports = app;