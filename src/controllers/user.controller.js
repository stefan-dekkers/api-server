const assert = require('assert');
const database = require('../util/database');
const logger = require('../util/utils').logger;

const userController = {
    // UC-201
    createUser: (req, res) => {
        logger.info('UC-201: createUser');

        const user = req.body;
        logger.debug('user = ', user);

        try {
            // assert(user === {}, 'Userinfo is missing');
            assert(typeof user.firstName === 'string', 'firstName must be a string');
            assert(typeof user.lastName === 'string', 'lastName must be a string');
            assert(typeof user.emailAddress === 'string', 'emailAddress must be a string');
        } catch (err) {
            res.status(400).json({
                status: 400,
                message: err.message.toString(),
                data: {},
            });
            return;
        }

        const existingUser = database['users'].find((u) => u.emailAddress === user.emailAddress);
        if (existingUser) {
            res.status(409).json({
                status: 409,
                message: 'Email address already taken',
                data: {},
            });
            return;
        }

        user.id = database.index++;
        database['users'].push(user);

        res.status(200).json({
            status: 200,
            message: `User with id ${user.id} is added`,
            data: user,
        });
    },

    // UC-202
    getAllUsers: (req, res) => {
        logger.info('UC-202: getAllUsers');

        const statusCode = 200;
        res.status(statusCode).json({
            status: statusCode,
            message: 'User getAll endpoint',
            data: database.users,
        });
    },

    // UC-203
    getProfile: (req, res) => {
        logger.info('UC-203: getProfile');

        res.status(501).json({
            status: 501,
            message: 'This functionality has not yet been realized.',
            data: {},
        });
    },

    // UC-204
    getUserWithID: (req, res) => {
        logger.info('UC-204: getUserWithID');

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

        const user = database['users'].find((u) => u.id === parseInt(userId));

        if (!user) {
            res.status(404).json({
                status: 404,
                message: `User with id ${userId} not found`,
                data: {},
            });
            return;
        }

        res.status(200).json({
            status: 200,
            message: `User with id ${userId} retrieved`,
            data: user,
        });
    },

    // UC-205
    changeUser: (req, res) => {
        logger.info('UC-205: changeUser');

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

        const userIndex = database['users'].findIndex((u) => u.id === parseInt(userId));

        if (userIndex === -1) {
            res.status(404).json({
                status: 404,
                message: `User with id ${userId} not found`,
                data: {},
            });
            return;
        }

        const user = database['users'][userIndex];

        const updatedUser = {
            ...user,
            ...req.body,
        };

        database['users'][userIndex] = updatedUser;

        res.status(200).json({
            status: 200,
            message: `User with id ${userId} updated`,
            data: updatedUser,
        });
    },

    // UC-206
    deleteUser: (req, res) => {
        logger.info('UC-206: deleteUser');

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

        const userIndex = database['users'].findIndex((u) => u.id === parseInt(userId));

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
    },
};

module.exports = userController;
