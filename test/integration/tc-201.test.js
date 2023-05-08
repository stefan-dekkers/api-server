const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');
const logger = require('../../src/util/utils').logger;
const pool = require('../../src/util/mysql-db');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Tests for: UC-201', function () {
    it('TC-201-1: required field is missing', (done) => {
        const user = {
            firstName: 'John',
            lastName: 'Doe',
            password: 'password123',
        };

        chai.request(app)
            .post('/api/user')
            .send(user)
            .end((err, res) => {
                expect(res.body.status).to.equal(400);
                expect(res.body.message).to.equal('emailAddress must be a string');
                expect(res.body.data).to.be.an('object').that.is.empty;
                done();
            });
    });

    it('TC-201-2: invalid email', (done) => {
        const user = {
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'invalidemail',
            password: 'password123',
        };

        chai.request(app)
            .post('/api/user')
            .send(user)
            .end((err, res) => {
                expect(res.body.status).to.equal(400);
                expect(res.body.message).to.equal('Invalid email address');
                expect(res.body.data).to.be.an('object').that.is.empty;
                done();
            });
    });

    it('TC-201-3: invalid password', (done) => {
        const user = {
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'johndoe2@example.com',
            password: 'pass',
        };

        chai.request(app)
            .post('/api/user')
            .send(user)
            .end((err, res) => {
                expect(res.body.status).to.equal(400);
                expect(res.body.message).to.equal('Password must have at least 6 characters');
                expect(res.body.data).to.be.an('object').that.is.empty;
                done();
            });
    });

    it('TC-201-4: user already exists', (done) => {
        const user = {
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'johndoe1@example.com',
            password: 'password',
        };

        const query1 = 'DELETE FROM user WHERE emailAddress = ?';
        const values1 = [user.emailAddress];

        const query2 =
            'INSERT INTO user (firstName, lastName, emailAddress, password) VALUES (?, ?, ?, ?)';
        const values2 = [user.firstName, user.lastName, user.emailAddress, user.password];

        pool.getConnection((err, conn) => {
            if (err) {
                next({
                    status: 500,
                    message: 'Error connecting to database',
                });
                return;
            } else if (conn) {
                // Remove the test user if it already exists
                conn.query(query1, values1, (err, results) => {
                    if (err) {
                        logger.error('Error executing query:', err.message);
                        done(err);
                    } else {
                        logger.info('Deleted user with emailAddress:', user.emailAddress);

                        // Add the test user to the database to simulate an existing user
                        conn.query(query2, values2, (err, results) => {
                            if (err) {
                                logger.error('Error executing query:', err.message);
                                done(err);
                            } else {
                                // Make a request to create the user
                                chai.request(app)
                                    .post('api/user')
                                    .send(user)
                                    .end((err, res) => {
                                        // Check that the response has the expected status code and message
                                        expect(res.body.status).to.equal(403);
                                        expect(res.body.message).to.equal(
                                            'Email address already taken'
                                        );

                                        // Check that the data is empty
                                        expect(res.body.data).to.be.an('object').that.is.empty;

                                        // Check that the user has not been added to the system
                                        const selectQuery =
                                            'SELECT * FROM user WHERE emailAddress = ?';
                                        const selectValues = [user.emailAddress];
                                        conn.query(selectQuery, selectValues, (err, results) => {
                                            if (err) {
                                                logger.error('Error executing query:', err.message);
                                                done(err);
                                            } else {
                                                expect(results).to.be.an('array').that.is.not.empty;
                                                expect(results.length).to.equal(1);
                                                done();
                                            }
                                        });
                                    });
                            }
                        });
                    }
                });
            }
        });
    });

    it('TC-201-5: user successfully registered', (done) => {
        const user = {
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'johndoe1@example.com',
            password: 'password123',
        };

        const query = 'DELETE FROM user WHERE emailAddress = ?';
        const values = [user.emailAddress];

        // First, remove the user if it already exists
        pool.getConnection((err, conn) => {
            if (err) {
                logger.error('Error executing query:', err.message);
                next({
                    status: 500,
                    message: 'Error connecting to database',
                });
                return;
            } else {
                conn.query(query, values, (err, results) => {
                    if (err) {
                        logger.error('Error executing query:', err.message);
                        done(err);
                    } else {
                        logger.info('Deleted user with emailAddress:', user.emailAddress);
                        pool.releaseConnection(conn);

                        chai.request(app)
                            .post('/api/user')
                            .send(user)
                            .end((err, res) => {
                                expect(err).to.be.null;
                                expect(res).to.have.status(201);
                                expect(res.body.status).to.equal(201);
                                expect(res.body.message).to.equal(
                                    `User with id ${res.body.data.id} is added`
                                );
                                expect(res.body.data.firstName).to.equal(user.firstName);
                                expect(res.body.data.lastName).to.equal(user.lastName);
                                expect(res.body.data.emailAddress).to.equal(user.emailAddress);

                                done();
                            });
                    }
                });
            }
        });
    });
});
