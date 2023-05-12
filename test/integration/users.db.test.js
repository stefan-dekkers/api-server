process.env['DB_DATABASE'] = process.env.DB_DATABASE || 'shareameal-testdb';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

const logger = require('../../src/util/utils').logger;
const dbconnection = require('../../src/util/mysql-db');

const assert = require('assert');
const expect = chai.expect;

// const jwt = require('jsonwebtoken');
// const { jwtSecretKey, logger } = require('../../src/util/utils');
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

describe('Users API', () => {
    before((done) => {
        logger.trace('before: hier zorg je eventueel dat de precondities correct zijn');
        logger.trace('before done');
        done();
    });

    describe('UC-201: Register as new user', () => {
        beforeEach((done) => {
            logger.trace('beforeEach called');

            // Reset test database
            dbconnection.getConnection(function (err, conn) {
                if (err) {
                    done(err);
                    throw err;
                }
                conn.query(CLEAR_DB + INSERT_USER, function (err, results, fields) {
                    if (err) {
                        done(err);
                        throw err;
                    }
                    logger.trace('beforeEach done');
                    dbconnection.releaseConnection(conn);
                    done();
                });
            });
        });

        it('TC-201-1: required field is missing', (done) => {
            const user = {
                firstName: 'TC',
                lastName: '201-1',
                password: 'Password1',
            };

            chai.request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal('emailAddress is missing');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-201-2: invalid email', (done) => {
            const user = {
                firstName: 'TC',
                lastName: '201-2',
                emailAddress: 'invalid@email',
                password: 'Password1',
            };

            chai.request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal(
                        `${user.emailAddress} is an invalid emailAddress`
                    );
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-201-3: invalid password', (done) => {
            const user = {
                firstName: 'TC',
                lastName: '201-3',
                emailAddress: 'a.TC@example.com',
                password: '123',
            };

            chai.request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal(`${user.password} is an invalid password`);
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-201-4: user already exists', (done) => {
            const user = {
                firstName: 'John',
                lastName: 'Doe',
                emailAddress: 'J.doe@example.com',
                password: 'Password1',
            };

            chai.request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    expect(res.body.status).to.equal(403);
                    expect(res.body.message).to.equal('Email address already taken');
                    done();
                });
        });

        it('TC-201-5: user successfully registered', (done) => {
            const user = {
                firstName: 'TC',
                lastName: '201-5',
                emailAddress: 'a.TC@example.com',
                password: 'Password1',
            };

            chai.request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    expect(res.body.status).to.equal(201);
                    expect(res.body.message).to.equal(`User with id ${res.body.data.id} is added`);

                    const query = `SELECT * FROM user WHERE emailAddress = '${user.emailAddress}'`;
                    dbconnection.getConnection(function (err, conn) {
                        if (err) {
                            done(err);
                            throw err;
                        }
                        conn.query(query, (err, results, fields) => {
                            if (err) {
                                done(err);
                                throw err;
                            } else {
                                expect(results.length).to.equal(1);
                                const fetchedUser = results[0];
                                expect(fetchedUser.id).to.equal(res.body.data.id);
                                expect(fetchedUser.firstName).to.equal(user.firstName);
                                expect(fetchedUser.lastName).to.equal(user.lastName);
                                expect(fetchedUser.emailAddress).to.equal(user.emailAddress);
                                expect(fetchedUser.password).to.equal(user.password);
                                expect(fetchedUser.phoneNumber).to.equal(res.body.data.phoneNumber);
                                expect(fetchedUser.roles).to.equal(res.body.data.roles);
                                expect(fetchedUser.street).to.equal(res.body.data.street);
                                expect(fetchedUser.city).to.equal(res.body.data.city);
                                dbconnection.releaseConnection(conn);
                                done();
                            }
                        });
                    });
                });
        });
    });

    describe('UC-202: Get users overview', function () {
        it('TC-202-1: show all users', (done) => {
            chai.request(app)
                .get('/api/user')
                .end((err, res) => {
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal('User getAll endpoint');
                    expect(res.body.data).that.is.an('array').with.length.gte(2);
                    done();
                });
        });

        it.skip('TC-202-2: show users with search term on non-existent fields', (done) => {
            done();
        });

        it('TC-202-3: show users with search term on field isActive = false', (done) => {
            chai.request(app)
                .get('/api/user?isActive=false')
                .end((err, res) => {
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal('User getAll endpoint');
                    expect(res.body.data).that.is.an('array');
                    res.body.data.forEach((user) => {
                        expect(user.isActive).to.be.equal(0);
                    });
                    done();
                });
        });

        it('TC-202-4: show users with search term on field isActive = true', (done) => {
            chai.request(app)
                .get('/api/user?isActive=true')
                .end((err, res) => {
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal('User getAll endpoint');
                    expect(res.body.data).that.is.an('array');
                    res.body.data.forEach((user) => {
                        expect(user.isActive).to.be.equal(1);
                    });
                    done();
                });
        });

        it.skip('TC-202-5: show users with search terms on existing fields (filter max on 2 fields)', (done) => {
            done();
        });
    });

    describe('UC-203: Get user profile', function () {
        it.skip('TC-203-1: invalid token', (done) => {
            chai.request(server)
                .get('/api/user/profile')
                .set('authorization', 'Bearer hier-staat-een-ongeldig-token')
                .end((err, res) => {
                    assert.ifError(err);
                    res.should.have.status(401);
                    res.should.be.an('object');

                    res.body.should.be.an('object').that.has.all.keys('code', 'message', 'data');
                    let { code, message, data } = res.body;
                    code.should.be.an('number');
                    message.should.be.a('string').equal('Not authorized');
                    done();
                });
        });

        it.skip('TC-203-2: user is logged in with valid token', (done) => {
            // Gebruiker met id = 1 is toegevoegd in de testdatabase. We zouden nu
            // in deze testcase succesvol het profiel van die gebruiker moeten vinden
            // als we een valide token meesturen.
            chai.request(server)
                .get('/api/user/profile')
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    assert.ifError(err);
                    res.should.have.status(200);
                    res.should.be.an('object');

                    res.body.should.be.an('object').that.has.all.keys('code', 'message', 'data');
                    let { code, message, data } = res.body;
                    code.should.be.an('number');
                    message.should.be.a('string').that.contains('Get User profile');
                    data.should.be.an('object');
                    data.id.should.equal(1);
                    data.firstName.should.equal('first');
                    // Zelf de overige validaties aanvullen!
                    done();
                });
        });
    });

    describe('UC-204: Get user with id', function () {
        it.skip('TC-204-1: invalid token', (done) => {
            done();
        });

        it('TC-204-2: user id does not exist', (done) => {
            const userId = -1;
            chai.request(app)
                .get(`/api/user/${userId}`)
                .end((err, res) => {
                    expect(res.body.status).to.equal(404);
                    expect(res.body.message).to.equal(`User with id ${userId} not found`);
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-204-3: user id exists', (done) => {
            const userId = 1;
            chai.request(app)
                .get(`/api/user/${userId}`)
                .end((err, res) => {
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal(`User with id ${userId} retrieved`);
                    expect(res.body.data).to.be.an('object').that.is.not.empty;
                    expect(res.body.data).to.have.property('id').to.equal(userId);
                    done();
                });
        });
    });

    describe('UC-205: Update user', function () {
        beforeEach((done) => {
            logger.trace('beforeEach called');

            // Reset test database
            dbconnection.getConnection(function (err, conn) {
                if (err) {
                    done(err);
                    throw err;
                }
                conn.query(CLEAR_DB + INSERT_USER, function (err, results, fields) {
                    if (err) {
                        done(err);
                        throw err;
                    }
                    logger.trace('beforeEach done');
                    dbconnection.releaseConnection(conn);
                    done();
                });
            });
        });

        it('TC-205-1: required field emailAddress is missing', (done) => {
            chai.request(app)
                .put('/api/user/1')
                .send({ phoneNumber: '06 12345678' })
                .end((err, res) => {
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal('emailAddress is missing');
                    done();
                });
        });

        it.skip('TC-205-2: user is not the owner of the data', (done) => {
            done();
        });

        it('TC-205-3: invalid phone number', (done) => {
            const user = {
                emailAddress: 'b.TC@example.com',
                phoneNumber: '123',
            };

            chai.request(app)
                .put('/api/user/1')
                .send(user)
                .end((err, res) => {
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal(
                        `${user.phoneNumber} is an invalid phoneNumber`
                    );
                    done();
                });
        });

        it('TC-205-4: user does not exist', (done) => {
            const userId = -1;
            const user = {
                emailAddress: 'b.TC@example.com',
                phoneNumber: '06 12345678',
            };

            chai.request(app)
                .put(`/api/user/${userId}`)
                .send(user)
                .end((err, res) => {
                    expect(res.body.status).to.equal(404);
                    expect(res.body.message).to.equal(`User with id ${userId} not found`);
                    done();
                });
        });

        it.skip('TC-205-5: not logged in', (done) => {
            done();
        });

        it('TC-205-6: user updated successfully', (done) => {
            const userId = 1;
            const user = {
                firstName: 'NewFirstName',
                lastName: 'NewLastName',
                emailAddress: 'J.doe@example.com',
            };

            chai.request(app)
                .put(`/api/user/${userId}`)
                .send({
                    emailAddress: user.emailAddress,
                    firstName: 'NewFirstName',
                    lastName: 'NewLastName',
                })
                .end((err, res) => {
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal(`User with id ${userId} has been updated`);
                    expect(res.body.data.firstName).to.equal('NewFirstName');
                    expect(res.body.data.lastName).to.equal('NewLastName');
                    done();
                });
        });
    });

    describe('UC-206: Delete user', function () {
        it('TC-206-1: user does not exist', (done) => {
            chai.request(app)
                .delete('/api/user/999')
                .end((err, res) => {
                    expect(res.body.status).to.equal(404);
                    expect(res.body.message).to.equal('User not found');
                    done();
                });
        });

        it.skip('TC-206-2: user is not logged in', (done) => {
            done();
        });

        it.skip('TC-206-3: user is not the owner of the data', (done) => {
            done();
        });

        it('TC-206-4: user deleted successfully', (done) => {
            dbconnection.getConnection(function (err, conn) {
                if (err) {
                    done(err);
                    throw err;
                }
                chai.request(app)
                    .delete('/api/user/1')
                    .end((err, res) => {
                        expect(res.body.status).to.equal(200);
                        expect(res.body.message).to.equal('User with id 1 is deleted');

                        // Check if the user is actually deleted from the database
                        conn.query('SELECT * FROM user WHERE id = 1', (err, results) => {
                            if (err) {
                                logger.error('Error executing query:', err.message);
                                done(err);
                            } else {
                                expect(results.length).to.equal(0);
                                dbconnection.releaseConnection(conn);
                                done();
                            }
                        });
                    });
            });
        });
    });
    //

    describe('UC-303 Lijst van maaltijden opvragen', () => {
        beforeEach((done) => {
            logger.trace('beforeEach called');

            // Reset test database
            dbconnection.getConnection(function (err, conn) {
                if (err) {
                    done(err);
                    throw err;
                }
                conn.query(CLEAR_DB + INSERT_USER, function (err, results, fields) {
                    if (error) {
                        done(err);
                        throw err;
                    }
                    logger.trace('beforeEach done');
                    dbconnection.releaseConnection(conn);
                    done();
                });
            });
        });

        it.skip('TC-303-1 Lijst van maaltijden wordt succesvol geretourneerd', (done) => {
            chai.request(server)
                .get('/api/meal')
                // wanneer je authenticatie gebruikt kun je hier een token meesturen
                // .set('authorization', 'Bearer ' + jwt.sign({ id: 1 }, jwtSecretKey))
                .end((err, res) => {
                    assert.ifError(err);

                    res.should.have.status(200);
                    res.should.be.an('object');

                    res.body.should.be.an('object').that.has.all.keys('message', 'data', 'code');

                    const { code, data } = res.body;
                    code.should.be.an('number');
                    data.should.be.an('array').that.has.length(2);
                    data[0].name.should.equal('Meal A');
                    data[0].id.should.equal(1);
                    done();
                });
        });
    });
});
