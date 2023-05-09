const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

const logger = require('../../src/util/utils').logger;
const pool = require('../../src/util/mysql-db');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Tests for: UC-206', function () {
    it('TC-206-1: user does not exist', (done) => {
        chai.request(app)
            .delete('/api/user/999')
            .end((err, res) => {
                expect(res.body.status).to.equal(404);
                expect(res.body.message).to.equal('User not found');
                done();
            });
    });

    // it('TC-206-2: user is not logged in', (done) => {
    //     done();
    // });

    // it('TC-206-3: user is not the owner of the data', (done) => {
    //     done();
    // });

    it('TC-206-4: user deleted successfully', (done) => {
        const user = {
            firstName: 'TC',
            lastName: '206-4',
            emailAddress: 'tc-206-4@example.com',
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

                                // Delete the test user
                                chai.request(app)
                                    .delete(`/api/user/${userId}`)
                                    .end((err, res) => {
                                        expect(res.body.status).to.equal(200);
                                        expect(res.body.message).to.equal(
                                            `User with id ${userId} is deleted`
                                        );

                                        // Check if the user is actually deleted from the database
                                        conn.query(
                                            'SELECT * FROM user WHERE id = ?',
                                            [userId],
                                            (err, results) => {
                                                if (err) {
                                                    logger.error(
                                                        'Error executing query:',
                                                        err.message
                                                    );
                                                    done(err);
                                                } else {
                                                    expect(results.length).to.equal(0);
                                                    done();
                                                }
                                            }
                                        );
                                    });
                            }
                        });
                    }
                });
            }
        });
    });
});
