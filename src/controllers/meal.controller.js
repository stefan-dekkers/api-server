// Meal controller

const assert = require('assert');
const { logger, jwtSecretKey } = require('../util/utils');
const pool = require('../util/mysql-db');
const jwt = require('jsonwebtoken');

const { emailValidation, passwordValidation, phoneNumberValidation } = require('./validation');

const mealController = {
    // UC-301: Add meal
    addMeal: (req, res, next) => {
        logger.info('UC-301: Add meal');

        const meal = req.body;

        try {
            assert(meal.name != null, 'name is missing');
            assert(typeof meal.name === 'string', 'name must be a string');
            assert(meal.description != null, 'description is missing');
            assert(typeof meal.description === 'string', 'description must be a string');
            assert(meal.imageUrl != null, 'imageUrl is missing');
            assert(typeof meal.imageUrl === 'string', 'imageUrl must be a string');
            assert(meal.dateTime != null, 'dateTime is missing');
            assert(typeof meal.dateTime === 'string', 'dateTime must be a string');
            assert(meal.maxAmountOfParticipants != null, 'maxAmountOfParticipants is missing');
            assert(typeof meal.maxAmountOfParticipants === 'number', 'maxAmountOfParticipants must be a number');
            assert(meal.price != null, 'price is missing');
            assert(typeof meal.price === 'number', 'price must be a number');
        } catch (err) {
            next({
                status: 400,
                message: err.message,
                data: {},
            });
            return;
        }

        const query =
            'INSERT INTO meal (name, description, imageUrl, dateTime, maxAmountOfParticipants, price, cookId) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [
            meal.name,
            meal.description,
            meal.imageUrl,
            meal.dateTime,
            meal.maxAmountOfParticipants,
            meal.price,
            req.userId,
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
                        next({
                            status: 500,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }

                    const insertId = results.insertId;

                    conn.query('SELECT * FROM meal WHERE id = ?', insertId, function (err, results, fields) {
                        if (err) {
                            next({
                                status: 500,
                                message: [err.code, err.message],
                                data: {},
                            });
                            return;
                        }

                        const mealData = results[0];
                        logger.info(`Meal with id ${insertId} is added`);

                        res.status(201).json({
                            status: 201,
                            message: `Meal with id ${insertId} is added`,
                            data: mealData,
                        });
                    });
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-302: Update meal
    updateMeal: (req, res, next) => {
        logger.info('UC-302: Update meal');

        const mealId = parseInt(req.params.mealId);

        const mealUpdates = req.body;

        try {
            assert(mealUpdates.name != null, 'name is missing');
            assert(typeof mealUpdates.name === 'string', 'name must be a string');
            assert(mealUpdates.price != null, 'price is missing');
            assert(typeof mealUpdates.price === 'number', 'price must be a number');
            assert(mealUpdates.maxAmountOfParticipants != null, 'maxAmountOfParticipants is missing');
            assert(typeof mealUpdates.maxAmountOfParticipants === 'number', 'maxAmountOfParticipants must be a number');
        } catch (err) {
            next({
                status: 400,
                message: err.message,
                data: {},
            });
            return;
        }

        const cookIdQuery = 'SELECT cookId FROM meal WHERE id = ?';

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
                conn.query(cookIdQuery, mealId, (err, results, fields) => {
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
                            message: `Meal with id ${userId} not found`,
                            data: {},
                        });
                        return;
                    }

                    const cookId = results[0];

                    if (req.userId !== cookId.cookId) {
                        next({
                            status: 403,
                            message: 'User is not the owner of the data',
                            data: {},
                        });
                        return;
                    }

                    let updatedMeal = { ...mealUpdates };

                    // Update the meal object with the new values
                    for (const key in mealUpdates) {
                        if (key in mealUpdates) {
                            updatedMeal[key] = mealUpdates[key];
                        }
                    }

                    const updateQuery = 'UPDATE meal SET ? WHERE id = ?';
                    conn.query(updateQuery, [updatedMeal, mealId], (err, results, fields) => {
                        if (err) {
                            next({
                                status: 500,
                                message: [err.code, err.message],
                                data: {},
                            });
                            return;
                        }

                        conn.query('SELECT * FROM meal WHERE id = ?', mealId, function (err, results, fields) {
                            if (err) {
                                next({
                                    status: 500,
                                    message: [err.code, err.message],
                                    data: {},
                                });
                                return;
                            }

                            const updatedMealData = results[0];
                            logger.info(`Meal with id ${mealId} has been updated`);

                            res.status(200).json({
                                status: 200,
                                message: `Meal with id ${mealId} has been updated`,
                                data: updatedMealData,
                            });
                        });
                        pool.releaseConnection(conn);
                    });
                });
            }
        });
    },

    // UC-303: Get all meals
    getAllMeals: (req, res, next) => {
        logger.info('UC-303: Get all meals');

        let query = 'SELECT * FROM meal';

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

                    logger.info(`Retrieved ${results.length} meals successfully`);
                    res.status(200).json({
                        status: 200,
                        message: `Retrieved ${results.length} meals successfully`,
                        data: results,
                    });
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-304: Get meal with id
    getMealWithID: (req, res, next) => {
        logger.info('UC-304: Get meal with id');

        const mealId = parseInt(req.params.mealId);

        const userQuery = 'SELECT * FROM meal WHERE id = ?';

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
                conn.query(userQuery, mealId, function (err, results, fields) {
                    if (err) {
                        next({
                            status: 500,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }
                    if (results && results.length > 0) {
                        logger.info(`Meal with id ${mealId} retrieved`);
                        const user = results[0];
                        res.status(200).json({
                            status: 200,
                            message: `Meal with id ${mealId} retrieved`,
                            data: user,
                        });
                    } else {
                        next({
                            status: 404,
                            message: `Meal with id ${mealId} not found`,
                            data: {},
                        });
                        return;
                    }
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-305: Delete meal
    deleteMeal: (req, res, next) => {
        logger.info('UC-305: Delete meal');

        const mealId = parseInt(req.params.mealId);

        const cookIdQuery = 'SELECT cookId FROM meal WHERE id = ?';

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
                conn.query(cookIdQuery, mealId, (err, results, fields) => {
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
                            message: `Meal with id ${userId} not found`,
                            data: {},
                        });
                        return;
                    }

                    const cookId = results[0];

                    if (req.userId !== cookId.cookId) {
                        next({
                            status: 403,
                            message: 'User is not the owner of the data',
                            data: {},
                        });
                        return;
                    }

                    const deleteQuery = 'DELETE FROM meal WHERE id = ?';

                    conn.query(deleteQuery, mealId, (err, results, fields) => {
                        if (err) {
                            next({
                                status: 500,
                                message: [err.code, err.message],
                                data: {},
                            });
                            return;
                        }

                        logger.info(`Meal with id ${mealId} has been deleted`);

                        res.status(200).json({
                            status: 200,
                            message: `Meal with id ${mealId} has been deleted`,
                            data: {},
                        });
                    });
                    pool.releaseConnection(conn);
                });
            }
        });
    },

    // UC-401: Sign up for meal
    signUpForMeal: (req, res, next) => {
        logger.info('UC-401: Sign up for meal');

        const mealId = req.params.mealId;
        const userId = req.userId;

        const maxAmountOfParticipantsQuery =
            'SELECT maxAmountOfParticipants, COUNT(userId) AS participantCount FROM meal LEFT JOIN meal_participants_user ON meal.id = meal_participants_user.mealId WHERE meal.id = ? GROUP BY meal.id';
        const query = 'INSERT INTO meal_participants_user (mealId, userId) VALUES (?, ?)';
        const values = [mealId, userId];

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
                conn.query(maxAmountOfParticipantsQuery, mealId, function (err, results, fields) {
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
                            message: `Meal with id ${mealId} not found`,
                            data: {},
                        });
                        return;
                    }

                    const mealData = results[0];
                    const maxParticipants = mealData.maxAmountOfParticipants;
                    const participantCount = mealData.participantCount;

                    if (participantCount >= maxParticipants) {
                        next({
                            status: 200,
                            message: `Maximum amount of participants reached for meal with id ${mealId}`,
                            data: {},
                        });
                        return;
                    }

                    conn.query(query, values, function (err, results, fields) {
                        if (err) {
                            next({
                                status: 500,
                                message: [err.code, err.message],
                                data: {},
                            });
                            return;
                        }

                        logger.info(`User with id ${userId} signed up for meal with id ${mealId}`);

                        res.status(200).json({
                            status: 200,
                            message: `User with id ${userId} signed up for meal with id ${mealId}`,
                            data: {},
                        });
                    });
                    pool.releaseConnection(conn);
                });
            }
        });
    },

    // UC-402: Sign out for meal
    signOutForMeal: (req, res, next) => {
        logger.info('UC-402: Sign out for meal');

        const mealId = req.params.mealId;
        const userId = req.userId;

        const query = 'DELETE FROM meal_participants_user WHERE mealId = ? AND userId = ?';
        const values = [mealId, userId];

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
                            message: `User with id ${userId} is not signed up for meal with id ${mealId}`,
                            data: {},
                        });
                        return;
                    }

                    logger.info(`User with id ${userId} signed out for meal with id ${mealId}`);

                    res.status(200).json({
                        status: 200,
                        message: `User with id ${userId} signed out for meal with id ${mealId}`,
                        data: {},
                    });
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-403: Get participants
    getParticipants: (req, res, next) => {
        logger.info('UC-403: Get participants');

        const mealId = req.params.mealId;

        const query = `SELECT id, firstName, lastName, isActive, emailAddress, phoneNumber, roles, street, city 
                 FROM user 
                 INNER JOIN meal_participants_user ON user.id = meal_participants_user.userId 
                 WHERE meal_participants_user.mealId = ?`;

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
                conn.query(query, [mealId], function (err, results, fields) {
                    if (err) {
                        next({
                            status: 500,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }

                    logger.info(`Retrieved participants for meal with id ${mealId} successfully`);
                    res.status(200).json({
                        status: 200,
                        message: `Retrieved participants for meal with id ${mealId} successfully`,
                        data: results,
                    });
                });
                pool.releaseConnection(conn);
            }
        });
    },

    // UC-404: Get participant details
    getParticipantDetails: (req, res, next) => {
        logger.info('UC-404: Get participant details');

        const participantId = req.params.participantId;

        const query = `SELECT id, firstName, lastName, isActive, emailAddress, phoneNumber, roles, street, city 
                   FROM user 
                   WHERE id = ?`;

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
                conn.query(query, participantId, function (err, results, fields) {
                    if (err) {
                        next({
                            status: 500,
                            message: [err.code, err.message],
                            data: {},
                        });
                        return;
                    }

                    if (results.length === 0) {
                        res.status(404).json({
                            status: 404,
                            message: `Participant with ID ${participantId} not found`,
                            data: {},
                        });
                        return;
                    }

                    const participant = results[0];
                    logger.info(`Retrieved participant details for ID ${participantId} successfully`);
                    res.status(200).json({
                        status: 200,
                        message: `Retrieved participant details for ID ${participantId} successfully`,
                        data: participant,
                    });
                });
                pool.releaseConnection(conn);
            }
        });
    },
};

module.exports = mealController;
