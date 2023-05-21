// API server by Stefan Dekkers

const express = require('express');
const logger = require('./src/util/utils').logger;
const userRoutes = require('./src/routes/user.routes');
const authRoutes = require('./src/routes/auth.routes');
const mealRoutes = require('./src/routes/meal.routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// General route
app.use('*', (req, res, next) => {
    const method = req.method;
    logger.trace(`Method ${method} is called`);
    next();
});

// UC-102: Get system information
app.get('/api/info', (req, res) => {
    logger.info('Get server information');

    res.status(201).json({
        status: 201,
        message: 'Server info-endpoint',
        data: {
            studentName: 'Stefan',
            studentNumber: 2198892,
            description: 'Welcome to the server API for share a meal, made by Stefan Dekkers',
        },
    });
});

// Routes
app.use('/api/user', userRoutes);
app.use('/api/login', authRoutes);
app.use('/api/meal', mealRoutes);

// Sink
app.use('*', (req, res) => {
    logger.warn('Invalid endpoint called: ', req.path);

    res.status(404).json({
        status: 404,
        message: 'Endpoint not found',
        data: {},
    });
});

// Express error handler
app.use((err, req, res, next) => {
    logger.error(err.message);

    // if (res.headersSent) {
    //     // If headers have already been sent, skip the error handler
    //     return next(err);
    // }

    res.status(err.status).json({
        status: err.status,
        message: err.message,
        data: {},
    });
});

// Start server
app.listen(port, () => {
    logger.info(`API server listening on port ${port}`);
});

// Export server for tests
module.exports = app;
