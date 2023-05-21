// User controller

const assert = require('assert');
const { logger, jwtSecretKey } = require('../util/utils');
const pool = require('../util/mysql-db');
const jwt = require('jsonwebtoken');

const { emailValidation, passwordValidation, phoneNumberValidation } = require('./validation');

const userController = {
    // UC-201: Register as new user

    createUser: (req, res, next) => {
        logger.info('UC-201: Register as new user');

        const user = req.body;

        try {
            assert(user.firstName != null, 'firstName is missing');
            assert(typeof user.firstName === 'string', 'firstName must be a string');
            assert(user.lastName != null, 'lastName is missing');
            assert(typeof user.lastName === 'string', 'lastName must be a string');
            assert(user.emailAddress != null, 'emailAddress is missing');
            assert(typeof user.emailAddress === 'string', 'emailAddress must be a string');
            emailValidation(user.emailAddress);
            assert(user.password != null, 'password is missing');
            assert(typeof user.password === 'string', 'password must be a string');
            passwordValidation(user.password);
            assert(user.phoneNumber != null, 'phoneNumber is missing');
            assert(typeof user.phoneNumber === 'string', 'phoneNumber must be a string');
            phoneNumberValidation(user.phoneNumber);
            assert(user.street != null, 'street is missing');
            assert(typeof user.street === 'string', 'street must be a string');
            assert(user.city != null, 'city is missing');
            assert(typeof user.city === 'string', 'city must be a string');
        } catch (err) {
            next({
                status: 400,
                message: err.message,
                data: {},
            });
            return;
        }

        const query =
            'INSERT INTO user (firstName, lastName, emailAddress, password, phoneNumber, street, city) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [
            user.firstName,
            user.lastName,
            user.emailAddress,
            user.password,
            user.phoneNumber,
            user.street,
            user.city,
        ];

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: [err.code, err.message],
                    data: {},
                });
                return;
            }
            if (conn) {
                conn.query(query, values, function (err, results, fields) {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            next({
                                status: 403,
                                message: 'Email address already taken',
                                data: {},
                            });
                            return;
                        } else {
                            next({
                                status: 500,
                                message: [err.code, err.message],
                                data: {},
                            });
                            return;
                        }
                    }

                    const insertId = results.insertId;

                    conn.query('SELECT * FROM user WHERE id = ?', insertId, function (err, results, fields) {
                        if (err) {
                            next({
                                status: 500,
                                message: [err.code, err.message],
                                data: {},
                            });
                            return;
                        }

                        const userData = results[0];
                        logger.info(`User with id ${insertId} is added`);

                        res.status(201).json({
                            status: 201,
                            message: `User with id ${insertId} is added`,
                            data: userData,
                        });
                    });
                    pool.releaseConnection(conn);
                });
            }
        });
    },

    // UC-202: Get users overview
    getAllUsers: (req, res, next) => {
        logger.info('UC-202: Get users overview');

        const fields = [
            { field: 'isActive', value: req.query.isActive },
            { field: 'firstName', value: req.query.firstName },
            { field: 'lastName', value: req.query.lastName },
            { field: 'emailAddress', value: req.query.emailAddress },
            { field: 'phoneNumber', value: req.query.phoneNumber },
            { field: 'roles', value: req.query.roles },
            { field: 'street', value: req.query.street },
            { field: 'city', value: req.query.city },
        ];

        let query = 'SELECT * FROM user WHERE 1 = 1';

        let fieldCount = 0;

        fields.forEach(({ field, value }) => {
            if (value !== undefined) {
                query += ` AND ${field} = '${value}'`;
                fieldCount++;
            }
        });

        if (fieldCount > 2) {
            next({
                status: 400,
                message: 'Maximum 2 fields',
                data: {},
            });
            return;
        }

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: [err.code, err.message],
                    data: {},
                });
                return;
            }
            if (conn) {
                conn.query(query, function (err, results, fields) {
                    if (err) {
                        next({
                            status: 500,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }

                    logger.info(`Retrieved ${results.length} users successfully`);
                    res.status(200).json({
                        status: 200,
                        message: `Retrieved ${results.length} users successfully`,
                        data: results,
                    });
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-203: Get user profile
    getProfile: (req, res, next) => {
        logger.info(`UC-203: Get user profile, for user: ${req.userId}`);

        let query = 'SELECT * FROM user WHERE id=?';

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: [err.code, err.message],
                    data: {},
                });
                return;
            }
            if (conn) {
                conn.query(query, [req.userId], (err, results, fields) => {
                    if (err) {
                        next({
                            status: 500,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }

                    logger.info(`User profile with id ${req.userId}`);
                    res.status(200).json({
                        status: 200,
                        message: `User profile with id ${req.userId}`,
                        data: results[0],
                    });
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-204: Get user with id
    getUserWithID: (req, res, next) => {
        logger.info('UC-204: Get user with id');

        const userId = parseInt(req.params.userId);
        logger.info(`User ${req.userId} asked for info of user ${userId}`);

        const userQuery = 'SELECT * FROM user WHERE id = ?';

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: [err.code, err.message],
                    data: {},
                });
                return;
            }
            if (conn) {
                conn.query(userQuery, userId, function (err, results, fields) {
                    if (err) {
                        next({
                            status: 500,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }
                    if (results && results.length > 0) {
                        logger.info(`User with id ${userId} retrieved`);
                        const user = results[0];
                        res.status(200).json({
                            status: 200,
                            message: `User with id ${userId} retrieved`,
                            data: user,
                        });
                    } else {
                        next({
                            status: 404,
                            message: `User with id ${userId} not found`,
                            data: {},
                        });
                        return;
                    }
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-205: Update user
    updateUser: (req, res, next) => {
        logger.info('UC-205: Update user');

        const userId = parseInt(req.params.userId);

        const userQuery = 'SELECT * FROM user WHERE id = ?';

        pool.getConnection((err, conn) => {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: [err.code, err.message],
                    data: {},
                });
                return;
            }
            if (conn) {
                conn.query(userQuery, [userId], (err, results, fields) => {
                    if (err) {
                        next({
                            status: 500,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }
                    if (results.length === 0) {
                        next({
                            status: 404,
                            message: `User with id ${userId} not found`,
                            data: {},
                        });
                        return;
                    }

                    const user = results[0];

                    if (req.userId == userId) {
                        const userUpdates = req.body;

                        try {
                            assert(userUpdates.emailAddress != null, 'emailAddress is missing');
                            assert(typeof userUpdates.emailAddress === 'string', 'emailAddress must be a string');
                            emailValidation(userUpdates.emailAddress);
                            assert(userId != null, 'userId is missing');
                            assert(typeof userId === 'number', 'userId must be a number');
                            if (userUpdates.phoneNumber) {
                                phoneNumberValidation(userUpdates.phoneNumber);
                            }
                        } catch (err) {
                            next({
                                status: 400,
                                message: err.message,
                                data: {},
                            });
                            return;
                        }

                        if (user.emailAddress !== userUpdates.emailAddress) {
                            next({
                                status: 400,
                                message: 'Email address does not match with the given user id',
                                data: {},
                            });
                            return;
                        }

                        let updatedUser = { ...user };

                        // Update the user object with the new values
                        for (const key in userUpdates) {
                            if (key in user) {
                                updatedUser[key] = userUpdates[key];
                            }
                        }

                        const updateQuery = 'UPDATE user SET ? WHERE id = ?';
                        conn.query(updateQuery, [updatedUser, userId], (err, results, fields) => {
                            if (err) {
                                next({
                                    status: 500,
                                    message: [err.code, err.message],
                                    data: {},
                                });
                                return;
                            }

                            conn.query('SELECT * FROM user WHERE id = ?', userId, function (err, results, fields) {
                                if (err) {
                                    next({
                                        status: 500,
                                        message: [err.code, err.message],
                                        data: {},
                                    });
                                    return;
                                }

                                const updatedUserData = results[0];
                                logger.info(`User with id ${userId} has been updated`);

                                res.status(201).json({
                                    status: 201,
                                    message: `User with id ${userId} has been updated`,
                                    data: updatedUserData,
                                });
                            });
                            pool.releaseConnection(conn);
                        });
                    } else {
                        next({
                            status: 403,
                            message: 'User is not the owner of the data',
                            data: {},
                        });
                    }
                });
            }
        });
    },

    // UC-206: Delete user
    deleteUser: (req, res, next) => {
        logger.info('UC-206: Delete user');

        const userId = parseInt(req.params.userId);

        const userQuery = 'SELECT * FROM user WHERE id = ?';

        pool.getConnection((err, conn) => {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: [err.code, err.message],
                    data: {},
                });
                return;
            }
            if (conn) {
                conn.query(userQuery, [userId], (err, results, fields) => {
                    if (err) {
                        next({
                            status: 500,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }
                    if (results.length === 0) {
                        next({
                            status: 404,
                            message: 'User not found',
                            data: {},
                        });
                        return;
                    }
                    const user = results[0];

                    if (req.userId == userId) {
                        const deleteQuery = 'DELETE FROM user WHERE id = ?';

                        conn.query(deleteQuery, [userId], (err, results, fields) => {
                            if (err) {
                                next({
                                    status: 500,
                                    message: [err.code, err.message],
                                    data: {},
                                });
                                return;
                            }
                            if (results.affectedRows === 0) {
                                next({
                                    status: 404,
                                    message: 'User not found',
                                    data: {},
                                });
                                return;
                            }
                            logger.info(`User with id ${userId} is deleted`);
                            res.status(200).json({
                                status: 200,
                                message: `User with id ${userId} is deleted`,
                                data: {},
                            });
                        });
                        pool.releaseConnection(conn);
                    } else {
                        next({
                            status: 403,
                            message: 'User is not the owner of the data',
                            data: {},
                        });
                    }
                });
            }
        });
    },
};

module.exports = userController;
