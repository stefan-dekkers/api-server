const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

const logger = require('../../src/util/utils').logger;
const pool = require('../../src/util/mysql-db');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Tests for: UC-205', function () {
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

    // it('TC-205-2: user is not the owner of the data', (done) => {
    //     done();
    // });

    it('TC-205-3: invalid phone number', (done) => {
        chai.request(app)
            .put('/api/user/1')
            .send({ emailAddress: 'user@example.com', phoneNumber: 'invalid' })
            .end((err, res) => {
                expect(res.body.status).to.equal(400);
                expect(res.body.message).to.equal('Invalid phone number (Example: 06 12345678)');
                done();
            });
    });

    it('TC-205-4: user does not exist', (done) => {
        chai.request(app)
            .put('/api/user/999')
            .send({ emailAddress: 'user@example.com', phoneNumber: '06 12345678' })
            .end((err, res) => {
                expect(res.body.status).to.equal(404);
                expect(res.body.message).to.equal('User with id 999 not found');
                done();
            });
    });

    // it('TC-205-5: not logged in', (done) => {
    //     done();
    // });

    it('TC-205-6: user updated successfully', (done) => {
        const user = {
            firstName: 'TC',
            lastName: '205-6',
            emailAddress: 'tc-205-6@example.com',
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
            } else {
                // Remove the test user if it already exists
                conn.query(deleteQuery, deleteValues, (err, results) => {
                    if (err) {
                        logger.error('Error executing query:', err.message);
                        done(err);
                    } else {
                        logger.info('Deleted test user:', user);

                        // Add the test user to the database
                        conn.query(insertQuery, insertValues, (err, results) => {
                            if (err) {
                                logger.error('Error executing query:', err.message);
                                done(err);
                            } else {
                                const userId = results.insertId;

                                // Update the test user
                                chai.request(app)
                                    .put(`/api/user/${userId}`)
                                    .send({
                                        emailAddress: user.emailAddress,
                                        firstName: 'NewFirstName',
                                        lastName: 'NewLastName',
                                    })
                                    .end((err, res) => {
                                        expect(res.body.status).to.equal(200);
                                        expect(res.body.message).to.equal(
                                            `User with id ${userId} has been updated`
                                        );
                                        expect(res.body.data.firstName).to.equal('NewFirstName');
                                        expect(res.body.data.lastName).to.equal('NewLastName');
                                        done();
                                    });
                            }
                        });
                    }
                });
            }
        });
    });
});
