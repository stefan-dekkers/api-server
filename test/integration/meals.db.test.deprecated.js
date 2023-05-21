process.env['DB_DATABASE'] = process.env.DB_DATABASE || 'shareameal-testdb';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

const logger = require('../../src/util/utils').logger;
const dbconnection = require('../../src/util/mysql-db');

const assert = require('assert');
const expect = chai.expect;

const jwtSecretKey = require('../../src/util/utils');
const jwt = require('jsonwebtoken');

require('tracer').setLevel('trace');

chai.use(chaiHttp);

// Clear query
const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM meal;';
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM meal_participants_user;';
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM user;';
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

// Insert user query
const INSERT_USER =
    'INSERT INTO user (id, firstName, lastName, emailAddress, password, street, city ) VALUES' +
    '(1, "John", "Doe", "J.doe@example.com", "Password1", "street", "city"),' +
    '(2, "Alex", "Johnson", "A.johnson@example.com", "Password1", "street", "city"),' +
    '(3, "Emily", "Garcia", "E.garcia@example.com", "Password1", "street", "city"),' +
    '(4, "Max", "Mitchell", "M.mitchell@example.com", "Password1", "street", "city"),' +
    '(5, "Lily", "Brown", "L.brown@example.com", "Password1", "street", "city");';

// Insert meal query
const INSERT_MEALS =
    'INSERT INTO meal (id, name, description, imageUrl, dateTime, maxAmountOfParticipants, price, cookId) VALUES' +
    "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(3, 'Meal C', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(4, 'Meal D', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(5, 'Meal E', 'description', 'image url', NOW(), 5, 6.50, 1);";

// Insert meal_participants_user query
const INSERT_PARTICIPANTS =
    'INSERT INTO meal (id, name, description, imageUrl, dateTime, maxAmountOfParticipants, price, cookId) VALUES' +
    "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(3, 'Meal C', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(4, 'Meal D', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(5, 'Meal E', 'description', 'image url', NOW(), 5, 6.50, 1);";

describe('Meals API', () => {
    describe('UC-301: Add meal', () => {
        // beforeEach((done) => {
        //     // Reset test database
        //     dbconnection.getConnection(function (err, conn) {
        //         if (err) {
        //             done(err);
        //             throw err;
        //         }
        //         conn.query(CLEAR_DB + INSERT_MEALS, function (err, results, fields) {
        //             if (err) {
        //                 done(err);
        //                 throw err;
        //             }
        //             dbconnection.releaseConnection(conn);
        //             done();
        //         });
        //     });
        // });

        it('TC-301-1: required field is missing', (done) => {
            const meal = {
                name: 'Pizza',
                description: 'Pizza with cheese',
                imageUrl: 'url',
                dateTime: '20-05-2023T14:00:00.000Z',
                maxAmountOfParticipants: 5,
            };

            chai.request(app)
                .post('/api/meal')
                .send(meal)
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(400);
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.message).to.equal('price is missing');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-301-2: not logged in', (done) => {
            done();
        });

        it('TC-301-3: meal succesfully added', (done) => {
            done();
        });
    });

    // describe('UC-302: Update meal', () => {
    //     it('TC-302-1: required fields name and/or price and/or maxAmountOfParticipants are missing', (done) => {
    //         done();
    //     });

    //     it('TC-302-2:', (done) => {
    //         done();
    //     });

    //     it('TC-302-3:', (done) => {
    //         done();
    //     });

    //     it('TC-302-4:', (done) => {
    //         done();
    //     });

    //     it('TC-302-5:', (done) => {
    //         done();
    //     });
    // });

    describe('UC-303: Get all meals', () => {
        beforeEach((done) => {
            // Reset test database
            dbconnection.getConnection(function (err, conn) {
                if (err) {
                    done(err);
                    throw err;
                }
                conn.query(CLEAR_DB + INSERT_MEALS, function (err, results, fields) {
                    if (err) {
                        done(err);
                        throw err;
                    }
                    dbconnection.releaseConnection(conn);
                    done();
                });
            });
        });

        it('TC-301-1:', (done) => {
            done();
        });

        it('TC-303-1: list of meals succesfully returned', (done) => {
            chai.request(server)
                .get('/api/meal')
                .set('authorization', 'Bearer ' + jwt.sign({ id: 1 }, jwtSecretKey))
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal(`Retrieved ${res.body.data.length} meals successfully`);
                    expect(res.body.data).that.is.an('array').with.length.gte(2);
                    done();
                });
        });
    });

    describe('UC-304: Get meal with id', () => {
        beforeEach((done) => {
            // Reset test database
            dbconnection.getConnection(function (err, conn) {
                if (err) {
                    done(err);
                    throw err;
                }
                conn.query(CLEAR_DB + INSERT_MEALS, function (err, results, fields) {
                    if (err) {
                        done(err);
                        throw err;
                    }
                    dbconnection.releaseConnection(conn);
                    done();
                });
            });
        });

        it('TC-301-1:', (done) => {
            done();
        });
    });

    describe('UC-305: Delete meal', () => {
        beforeEach((done) => {
            // Reset test database
            dbconnection.getConnection(function (err, conn) {
                if (err) {
                    done(err);
                    throw err;
                }
                conn.query(CLEAR_DB + INSERT_MEALS, function (err, results, fields) {
                    if (err) {
                        done(err);
                        throw err;
                    }
                    dbconnection.releaseConnection(conn);
                    done();
                });
            });
        });

        it('TC-301-1:', (done) => {
            done();
        });
    });

    // describe('UC-401: Sign up for meal', () => {
    //     it('TC-401-1:', (done) => {
    //         done();
    //     });
    // });

    // describe('UC-402: Sign out for meal', () => {
    //     it('TC-401-1:', (done) => {
    //         done();
    //     });
    // });

    // describe('UC-403: Get participants', () => {
    //     it('TC-401-1:', (done) => {
    //         done();
    //     });
    // });

    // describe('UC-404: Get participant details', () => {
    //     it('TC-401-1:', (done) => {
    //         done();
    //     });
    // });
});
