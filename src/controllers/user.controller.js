const assert = require('assert');
const database = require('../util/inmem-db');
const logger = require('../util/utils').logger;
const pool = require('../util/mysql-db');

const userController = {
    // UC-201
    createUser: (req, res, next) => {
        logger.info('UC-201: createUser');

        const user = req.body;
        logger.debug('user = ', user);

        try {
            assert(typeof user.firstName === 'string', 'firstName must be a string');
            assert(typeof user.lastName === 'string', 'lastName must be a string');
            assert(typeof user.emailAddress === 'string', 'emailAddress must be a string');
            assert(typeof user.password === 'string', 'password must be a string');
        } catch (err) {
            next({
                status: 400,
                message: err.message.toString(),
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
                next({
                    status: 500,
                    message: 'Error connecting to database',
                });
                return;
            }
            if (conn) {
                conn.query(query, values, function (err, results) {
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
                                message: 'Error executing query',
                            });
                            return;
                        }
                    }
                    const insertedId = results.insertId;
                    logger.info('User with id', insertedId, 'is added');
                    res.status(201).json({
                        status: 201,
                        message: `User with id ${insertedId} is added`,
                        data: { id: insertedId, ...user },
                    });
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-202
    getAllUsers: (req, res, next) => {
        logger.info('UC-202: getAllUsers');

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
                next({
                    status: 500,
                    message: 'Error connecting to database',
                });
            }
            if (conn) {
                conn.query(query, function (err, results, fields) {
                    if (err) {
                        next({
                            status: 409,
                            message: err.message,
                        });
                    }
                    if (results) {
                        logger.info('Found', results.length, 'results');
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
    getUserWithID: (req, res, next) => {
        logger.info('UC-204: getUserWithID');

        const { userId } = req.params;

        try {
            assert(typeof parseInt(userId) === 'number', 'userId must be a number');
        } catch (err) {
            next({
                status: 400,
                message: err.message,
            });
            return;
        }

        const query = 'SELECT * FROM user WHERE id = ?';
        const values = [userId];

        pool.getConnection(function (err, conn) {
            if (err) {
                next({
                    status: 500,
                    message: 'Error connecting to database',
                });
            }
            if (conn) {
                conn.query(query, values, function (err, results) {
                    if (err) {
                        next({
                            status: 500,
                            message: 'Error executing query',
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

    // UC-205
    updateUser: (req, res, next) => {
        logger.info('UC-205: updateUser');

        const { userId } = req.params;
        const update = req.body;

        try {
            assert(typeof parseInt(userId) === 'number', 'userId must be a number');
        } catch (err) {
            next({
                status: 400,
                message: err.message.toString(),
            });
            return;
        }

        const query = 'SELECT * FROM user WHERE id = ?';
        const values = [userId];

        pool.getConnection((err, conn) => {
            if (err) {
                next({
                    status: 500,
                    message: 'Error connecting to database',
                });
                return;
            }
            if (conn) {
                conn.query(query, values, (err, results) => {
                    if (err) {
                        next({
                            status: 500,
                            message: 'Error executing query',
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

                    const updatedUser = {
                        ...user,
                        ...update,
                    };

                    const fieldsToUpdate = Object.keys(update).map((key) => `${key} = ?`);
                    const query = `UPDATE user SET ${fieldsToUpdate} WHERE id = ?`;
                    const values = [...Object.values(update), userId];

                    conn.query(query, values, (err, results) => {
                        if (err) {
                            next({
                                status: 500,
                                message: 'Error executing query',
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

    // UC-206
    deleteUser: (req, res) => {
        logger.info('UC-206: deleteUser');

        const { userId } = req.params;

        try {
            assert(typeof parseInt(userId) === 'number', 'userId must be a number');
        } catch (err) {
            next({
                status: 400,
                message: err.message,
            });
            return;
        }

        const userIndex = database['users'].findIndex((u) => u.id === parseInt(userId));

        if (userIndex === -1) {
            next({
                status: 404,
                message: `User with id ${userId} not found`,
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
