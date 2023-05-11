const assert = require('assert');
const database = require('../util/inmem-db');
const logger = require('../util/utils').logger;
const pool = require('../util/mysql-db');
// const jwt = require('jsonwebtoken');

const userController = {
    // UC-201: Register as new user
    createUser: (req, res, next) => {
        logger.info('UC-201: Register as new user');

        const user = req.body;
        logger.debug('user = ', user);

        try {
            assert(user.firstName != null, 'firstName is missing');
            assert(typeof user.firstName === 'string', 'firstName must be a string');
            assert(user.lastName != null, 'lastName is missing');
            assert(typeof user.lastName === 'string', 'lastName must be a string');
            assert(user.emailAddress != null, 'emailAddress is missing');
            assert(typeof user.emailAddress === 'string', 'emailAddress must be a string');
            assert(user.password != null, 'password is missing');
            assert(typeof user.password === 'string', 'password must be a string');
        } catch (err) {
            next({
                status: 400,
                message: err.message,
            });
            return;
        }

        // Email validation
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(user.emailAddress)) {
            next({
                status: 400,
                message: 'Invalid email address',
            });
            return;
        }

        // Password validation
        if (user.password.length < 6) {
            next({
                status: 400,
                message: 'Password must have at least 6 characters',
            });
            return;
        }

        const query =
            'INSERT INTO user (firstName, lastName, emailAddress, password) VALUES (?, ?, ?, ?)';
        const values = [user.firstName, user.lastName, user.emailAddress, user.password];

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: err.code,
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
                            });
                            return;
                        } else {
                            next({
                                status: 500,
                                message: err.code,
                            });
                            return;
                        }
                    }
                    const insertId = results.insertId;
                    logger.info(`User with id ${insertId} is added`);

                    const selectQuery = 'SELECT * FROM user WHERE id = ?';
                    const selectValues = [insertId];
                    conn.query(selectQuery, selectValues, function (err, results, fields) {
                        if (err) {
                            next({
                                status: 500,
                                message: err.code,
                            });
                            return;
                        }
                        const user = results[0];
                        res.status(201).json({
                            status: 201,
                            message: `User with id ${insertId} is added`,
                            data: user,
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

        const isActive = req.query.isActive;
        const firstName = req.query.firstName;
        const lastName = req.query.lastName;
        const emailAddress = req.query.emailAddress;
        const phoneNumber = req.query.phoneNumber;
        const roles = req.query.roles;
        const street = req.query.street;
        const city = req.query.city;

        let query = 'SELECT * FROM user WHERE 1 = 1';

        if (isActive !== undefined) {
            query += ` AND isActive = ${isActive}`;
        }
        if (firstName !== undefined) {
            query += ` AND firstName = '${firstName}'`;
        }
        if (lastName !== undefined) {
            query += ` AND lastName = '${lastName}'`;
        }
        if (emailAddress !== undefined) {
            query += ` AND emailAddress = '${emailAddress}'`;
        }
        if (phoneNumber !== undefined) {
            query += ` AND phoneNumber = '${phoneNumber}'`;
        }
        if (roles !== undefined) {
            const rolesArr = roles.split(',');
            query += ' AND (';
            rolesArr.forEach((role, index) => {
                query += ` roles LIKE '%${role}%'`;
                if (index !== rolesArr.length - 1) {
                    query += ' OR';
                }
            });
            query += ')';
        }
        if (street !== undefined) {
            query += ` AND street = '${street}'`;
        }
        if (city !== undefined) {
            query += ` AND city = '${city}'`;
        }

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: err.code,
                });
                return;
            }
            if (conn) {
                conn.query(query, function (err, results, fields) {
                    if (err) {
                        next({
                            status: 409,
                            message: err.message,
                        });
                        return;
                    }
                    if (results) {
                        logger.info(`Found ${results.length} results`);
                        res.status(200).json({
                            status: 200,
                            message: 'User getAll endpoint',
                            data: results,
                        });
                    }
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-203: Get user profile
    getProfile: (req, res, next) => {
        logger.info('UC-203: Get user profile');

        req.userId = 1;
        logger.trace('Get user profile for user', req.userId);

        let query = 'SELECT * FROM user WHERE id=?';

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: err.code,
                });
                return;
            }
            if (conn) {
                conn.query(query, [req.userId], (err, results, fields) => {
                    if (err) {
                        logger.error(err.message);
                        next({
                            status: 409,
                            message: err.message,
                        });
                        return;
                    }
                    if (results) {
                        logger.trace('Found', results.length, 'results');
                        res.status(200).json({
                            status: 200,
                            message: 'Get user profile',
                            data: results[0],
                        });
                    }
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-204: Get user with id
    getUserWithID: (req, res, next) => {
        logger.info('UC-204: Get user with id');

        const userId = parseInt(req.params.userId);
        logger.debug('userId = ', userId);

        try {
            assert(typeof userId === 'number', 'userId must be a number');
        } catch (err) {
            next({
                status: 400,
                message: err.message,
            });
            return;
        }

        const userQuery = 'SELECT * FROM user WHERE id = ?';

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: err.code,
                });
                return;
            }
            if (conn) {
                conn.query(userQuery, [userId], function (err, results, fields) {
                    if (err) {
                        next({
                            status: 500,
                            message: err.code,
                        });
                        return;
                    }
                    if (results && results.length > 0) {
                        logger.info('Found user with id', userId);
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
        logger.debug('userId = ', userId);

        const userUpdates = req.body;

        try {
            assert(userUpdates.emailAddress != null, 'emailAddress is missing');
            assert(typeof userUpdates.emailAddress === 'string', 'emailAddress must be a string');
            assert(userId != null, 'userId is missing');
            assert(typeof userId === 'number', 'userId must be a number');
        } catch (err) {
            next({
                status: 400,
                message: err.message,
            });
            return;
        }

        // Email validation
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(userUpdates.emailAddress)) {
            next({
                status: 400,
                message: 'Invalid email address (Example: user@example.com)',
            });
            return;
        }

        // Phone number validation
        if (userUpdates.phoneNumber) {
            const phoneRegex = /^(\d{2}\s){1}\d{8}$/;
            if (!phoneRegex.test(userUpdates.phoneNumber)) {
                next({
                    status: 400,
                    message: 'Invalid phone number (Example: 06 12345678)',
                });
                return;
            }
        }

        const userQuery = 'SELECT * FROM user WHERE id = ?';

        pool.getConnection((err, conn) => {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: err.code,
                });
                return;
            }
            if (conn) {
                conn.query(userQuery, [userId], (err, results, fields) => {
                    if (err) {
                        next({
                            status: 500,
                            message: err.code,
                        });
                        return;
                    }
                    if (results.length === 0) {
                        next({
                            status: 404,
                            message: `User with id ${userId} not found`,
                        });
                        return;
                    }

                    const user = results[0];

                    if (user.emailAddress !== userUpdates.emailAddress) {
                        next({
                            status: 400,
                            message: 'Email address does not match with the given user id',
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
                                message: err.code,
                            });
                            return;
                        }
                        logger.info(`User with id ${userId} has been updated`);
                        res.status(200).json({
                            status: 200,
                            message: `User with id ${userId} has been updated`,
                            data: updatedUser,
                        });
                    });

                    pool.releaseConnection(conn);
                });
            }
        });
    },

    // UC-206: Delete user
    deleteUser: (req, res, next) => {
        logger.info('UC-206: Delete user');

        const userId = parseInt(req.params.userId);
        logger.debug('userId = ', userId);

        const deleteQuery = 'DELETE FROM user WHERE id = ?';

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    status: 500,
                    message: err.code,
                });
                return;
            }
            if (conn) {
                conn.query(deleteQuery, [userId], function (err, results, fields) {
                    if (err) {
                        next({
                            status: 500,
                            message: err.code,
                        });
                        return;
                    }
                    if (results.affectedRows === 0) {
                        next({
                            status: 404,
                            message: 'User not found',
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
            }
        });
    },
};

module.exports = userController;
