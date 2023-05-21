// Authentication controller

const assert = require('assert');
const { logger, jwtSecretKey } = require('../util/utils');
const pool = require('../util/mysql-db');
const jwt = require('jsonwebtoken');

const { emailValidation, passwordValidation, phoneNumberValidation } = require('./validation');

const authController = {
    // UC-101: Login
    login: (req, res, next) => {
        logger.info('UC-101: Login');

        try {
            assert(req.body.emailAddress != null, 'emailAddress is missing');
            assert(typeof req.body.emailAddress === 'string', 'emailAddress must be a string.');
            emailValidation(req.body.emailAddress);
            assert(req.body.password != null, 'password is missing');
            assert(typeof req.body.password === 'string', 'password must be a string.');
            next();
        } catch (err) {
            next({
                status: 400,
                message: err.message,
                data: {},
            });
            return;
        }

        const { emailAddress, password } = req.body;

        const query = 'SELECT * FROM user WHERE emailAddress = ?';
        const values = [emailAddress];

        pool.getConnection((err, conn) => {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: err.code,
                    data: {},
                });
                return;
            }
            if (conn) {
                // Check if user exists
                conn.query(query, values, (err, results, fields) => {
                    if (err) {
                        next({
                            status: 409,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }

                    if (results.length === 0) {
                        next({
                            status: 404,
                            message: 'User does not exist',
                            data: {},
                        });
                        return;
                    }

                    const user = results[0];

                    // Check password
                    if (password === user.password) {
                        const payload = {
                            userId: user.id,
                        };

                        // Generate the bearer token
                        jwt.sign(payload, jwtSecretKey, { expiresIn: '2d' }, (err, token) => {
                            logger.debug(`User logged in, sending: ${user}`);
                            res.status(200).json({
                                status: 200,
                                message: 'User logged in',
                                data: { ...user, token },
                            });
                        });
                    } else {
                        next({
                            status: 400,
                            message: 'Not authorized',
                            data: {},
                        });
                        return;
                    }

                    pool.releaseConnection(conn);
                });
            }
        });
    },

    validateToken(req, res, next) {
        logger.info('validateToken called');

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            next({
                status: 401,
                message: 'Authorization header missing!',
                data: {},
            });
            return;
        }

        const token = authHeader.substring(7, authHeader.length);
        logger.info(`Token: ${token}`);

        jwt.verify(token, jwtSecretKey, (err, decoded) => {
            if (err) {
                next({
                    status: 401,
                    message: 'Invalid token!',
                    data: {},
                });
                return;
            }

            const { userId } = decoded;
            req.userId = userId;

            logger.info('validateToken done');

            next();
        });
    },
};

module.exports = authController;
