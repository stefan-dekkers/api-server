// API server by Stefan Dekkers

const express = require('express');
const logger = require('./src/util/utils').logger;
const userRoutes = require('./src/routes/user.routes');

const app = express();
const port = 3000;

app.use(express.json());

// General route
app.use('*', (req, res, next) => {
    const method = req.method;
    logger.trace(`Method ${method} is called`);
    next();
});

// Info endpoints
app.get('/api/info', (req, res) => {
    logger.info('Get server information');

    res.status(200).json({
        status: 200,
        message: 'Server info-endpoint',
        data: {
            studentName: 'Stefan',
            studentNumber: 1234567,
            description: 'Welcome to the server API for share a meal, made by Stefan Dekkers',
        },
    });
});

// Routes
app.use('/api/user', userRoutes);

// Sink
app.use('*', (req, res) => {
    logger.warn('Invalid endpoint called: ', req.path);

    res.status(404).json({
        status: 404,
        message: 'Endpoint not found',
        data: {},
    });
});

// Start server
app.listen(port, () => {
    logger.info(`API server listening on port ${port}`);
});

// Export server for tests
module.exports = app;
