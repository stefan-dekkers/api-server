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
            firstName: 'TC',
            lastName: '201-1',
            password: 'secret',
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
            emailAddress: 'invalid',
            password: 'secret',
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
            firstName: 'TC',
            lastName: '201-3',
            emailAddress: 'tc-201-3@example.com',
            password: '123',
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
            firstName: 'TC',
            lastName: '201-4',
            emailAddress: 'tc-201-4@example.com',
            password: 'secret',
        };

        const deleteQuery = 'DELETE FROM user WHERE emailAddress = ?';
        const deleteValues = [user.emailAddress];

        const insertQuery =
            'INSERT INTO user (firstName, lastName, emailAddress, password) VALUES (?, ?, ?, ?)';
        const insertValues = [user.firstName, user.lastName, user.emailAddress, user.password];

        pool.getConnection((err, conn) => {
            if (err) {
                logger.error('Error connecting to database');
                done(err);
            } else if (conn) {
                // Remove the test user if it already exists
                conn.query(deleteQuery, deleteValues, (err, results) => {
                    if (err) {
                        logger.error('Error executing query:', err.message);
                        done(err);
                    } else {
                        logger.info('Deleted test user:', user);

                        // Add the test user to the database to simulate an existing user
                        conn.query(insertQuery, insertValues, (err, results) => {
                            if (err) {
                                logger.error('Error executing query:', err.message);
                                done(err);
                            } else {
                                // Make a request to create the user
                                chai.request(app)
                                    .post('/api/user')
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
            firstName: 'TC',
            lastName: '201-5',
            emailAddress: 'tc-201-5@example.com',
            password: 'secret',
        };

        const deleteQuery = 'DELETE FROM user WHERE emailAddress = ?';
        const values = [user.emailAddress];

        pool.getConnection((err, conn) => {
            if (err) {
                logger.error('Error connecting to database');
                done(err);
            } else {
                // Remove the test user if it already exists
                conn.query(deleteQuery, values, (err, results) => {
                    if (err) {
                        logger.error('Error executing query:', err.message);
                        done(err);
                    } else {
                        logger.info('Deleted test user:', user);
                        pool.releaseConnection(conn);

                        chai.request(app)
                            .post('/api/user')
                            .send(user)
                            .end((err, res) => {
                                expect(res.body.status).to.equal(201);
                                expect(res.body.message).to.equal(
                                    `User with id ${res.body.data.id} is added`
                                );
                                expect(res.body.data.firstName).to.equal(user.firstName);
                                expect(res.body.data.lastName).to.equal(user.lastName);
                                expect(res.body.data.emailAddress).to.equal(user.emailAddress);
                                expect(res.body.data.password).to.equal(user.password);

                                done();
                            });
                    }
                });
            }
        });
    });
});
