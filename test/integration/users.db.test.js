process.env['DB_DATABASE'] = process.env.DB_DATABASE || 'shareameal-testdb';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

const { logger, jwtSecretKey } = require('../../src/util/utils');
const dbconnection = require('../../src/util/mysql-db');

const assert = require('assert');
const expect = chai.expect;

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

describe('Users API', () => {
    describe('UC-101: Login', () => {
        beforeEach((done) => {
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
                    dbconnection.releaseConnection(conn);
                    done();
                });
            });
        });

        it.skip('TC-101-1: required field is missing', (done) => {
            chai.request(app)
                .post('/api/login')
                .send({})
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal('emailAddress is missing');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it.skip('TC-101-2: invalid password', (done) => {
            chai.request(app)
                .post('/api/login')
                .send({ emailAddress: 'J.doe@example.com', password: 'invalid' })
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal('Not authorized');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it.skip('TC-101-3: user does not exist', (done) => {
            chai.request(app)
                .post('/api/login')
                .send({ emailAddress: 'nonexistent@example.com', password: 'Password1' })
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(404);
                    expect(res.body.message).to.equal('User does not exist');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it.skip('TC-101-4: user successfully logged in', (done) => {
            chai.request(app)
                .post('/api/login')
                .send({ emailAddress: 'J.doe@example.com', password: 'Password1' })
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal('User logged in');
                    expect(res.body.data)
                        .to.be.an('object')
                        .that.has.all.keys('id', 'emailAddress', 'password', 'token');
                    expect(res.body.data.id).to.equal(user.id);
                    expect(res.body.data.emailAddress).to.equal(user.emailAddress);
                    expect(res.body.data.password).to.equal(user.password);
                    expect(res.body.data.token).to.be.a('string');
                });
        });
    });

    describe('UC-201: Register as new user', () => {
        beforeEach((done) => {
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
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(400);
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
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
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal(`${user.emailAddress} is an invalid emailAddress`);
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-201-3: invalid password', (done) => {
            const user = {
                firstName: 'TC',
                lastName: '201-3',
                emailAddress: 'A.tc@example.com',
                password: '123',
            };

            chai.request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
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
                phoneNumber: '06-12345678',
                street: 'street',
                city: 'city',
            };

            chai.request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(403);
                    expect(res.body.message).to.equal('Email address already taken');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-201-5: user successfully registered', (done) => {
            const user = {
                firstName: 'TC',
                lastName: '201-5',
                emailAddress: 'A.tc@example.com',
                password: 'Password1',
                phoneNumber: '06-12345678',
                street: 'street',
                city: 'city',
            };

            chai.request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
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
                                expect(fetchedUser.phoneNumber).to.equal(user.phoneNumber);
                                expect(fetchedUser.street).to.equal(user.street);
                                expect(fetchedUser.city).to.equal(user.city);
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
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal(`Retrieved ${res.body.data.length} users successfully`);
                    expect(res.body.data).that.is.an('array').with.length.gte(2);
                    done();
                });
        });

        it('TC-202-2: show users with search term on non-existent fields', (done) => {
            chai.request(app)
                .get('/api/user?Test=1')
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal(`Retrieved ${res.body.data.length} users successfully`);
                    done();
                });
        });

        it('TC-202-3: show users with search term on field isActive = false', (done) => {
            chai.request(app)
                .get('/api/user?isActive=false')
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal(`Retrieved ${res.body.data.length} users successfully`);
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
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal(`Retrieved ${res.body.data.length} users successfully`);
                    expect(res.body.data).that.is.an('array');
                    res.body.data.forEach((user) => {
                        expect(user.isActive).to.be.equal(1);
                    });
                    done();
                });
        });

        it('TC-202-5: show users with search terms on existing fields', (done) => {
            chai.request(app)
                .get('/api/user?firstName=John&lastName=Doe')
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal(`Retrieved ${res.body.data.length} users successfully`);
                    expect(res.body.data).that.is.an('array');
                    res.body.data.forEach((user) => {
                        expect(user.firstName).to.be.equal('John');
                        expect(user.lastName).to.be.equal('Doe');
                    });
                    done();
                });
        });
    });

    describe('UC-203: Get user profile', function () {
        it('TC-203-1: invalid token', (done) => {
            chai.request(app)
                .get('/api/user/profile')
                .set('authorization', 'Bearer invalid-token')
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(401);
                    expect(res.body.message).to.equal('Invalid token!');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-203-2: user is logged in with valid token', (done) => {
            chai.request(app)
                .get('/api/user/profile')
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(200);
                    expect(res.body.message).to.equal(`User profile with id 1`);
                    expect(res.body.data.firstName).to.be.equal('John');
                    expect(res.body.data.lastName).to.be.equal('Doe');
                    expect(res.body.data.emailAddress).to.be.equal('J.doe@example.com');
                    expect(res.body.data.password).to.be.equal('Password1');
                    expect(res.body.data.street).to.be.equal('street');
                    expect(res.body.data.city).to.be.equal('city');
                    done();
                });
        });
    });

    describe('UC-204: Get user with id', function () {
        it('TC-204-1: invalid token', (done) => {
            chai.request(app)
                .get('/api/user/login')
                .set('authorization', 'Bearer invalid-token')
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(401);
                    expect(res.body.message).to.equal('Invalid token!');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-204-2: user id does not exist', (done) => {
            const userId = -1;
            chai.request(app)
                .get(`/api/user/${userId}`)
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
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
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
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
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .send({ phoneNumber: '06 12345678' })
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal('emailAddress is missing');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-205-2: user is not the owner of the data', (done) => {
            const user = {
                firstName: 'NewFirstName',
                lastName: 'NewLastName',
                emailAddress: 'J.doe@example.com',
            };

            chai.request(app)
                .put(`/api/user/2`)
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .send({ user })
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(403);
                    expect(res.body.message).to.equal('User is not the owner of the data');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-205-3: invalid phone number', (done) => {
            const user = {
                emailAddress: 'b.TC@example.com',
                phoneNumber: '123',
            };

            chai.request(app)
                .put('/api/user/1')
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .send(user)
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(400);
                    expect(res.body.message).to.equal(`${user.phoneNumber} is an invalid phoneNumber`);
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-205-4: user does not exist', (done) => {
            const user = {
                emailAddress: 'b.TC@example.com',
                phoneNumber: '06 12345678',
            };

            chai.request(app)
                .put('/api/user/-1')
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .send(user)
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(404);
                    expect(res.body.message).to.equal(`User with id -1 not found`);
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-205-5: not logged in', (done) => {
            const user = {
                firstName: 'NewFirstName',
                lastName: 'NewLastName',
                emailAddress: 'J.doe@example.com',
            };

            chai.request(app)
                .put('/api/user/1')
                .send(user)
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(401);
                    expect(res.body.message).to.equal('Authorization header missing!');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-205-6: user updated successfully', (done) => {
            chai.request(app)
                .put('/api/user/1')
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .send({ emailAddress: 'J.doe@example.com', firstName: 'NewFirstName', lastName: 'NewLastName' })
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(201);
                    expect(res.body.message).to.equal(`User with id 1 has been updated`);
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
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    expect(res.body.status).to.equal(404);
                    expect(res.body.message).to.equal('User not found');
                    done();
                });
        });

        it('TC-206-2: user is not logged in', (done) => {
            chai.request(app)
                .delete('/api/user/1')
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(401);
                    expect(res.body.message).to.equal('Authorization header missing!');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-206-3: user is not the owner of the data', (done) => {
            chai.request(app)
                .delete('/api/user/2')
                .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    expect(res.body).to.be.an('object').that.has.all.keys('status', 'message', 'data');
                    expect(res.body.status).to.equal(403);
                    expect(res.body.message).to.equal('User is not the owner of the data');
                    expect(res.body.data).to.be.an('object').that.is.empty;
                    done();
                });
        });

        it('TC-206-4: user deleted successfully', (done) => {
            dbconnection.getConnection(function (err, conn) {
                if (err) {
                    done(err);
                    throw err;
                }
                chai.request(app)
                    .delete('/api/user/1')
                    .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
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
});
