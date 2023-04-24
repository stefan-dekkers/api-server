const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

chai.use(chaiHttp);
const assert = chai.assert;

describe('TC-205', function () {
    it('should update user data if id exists', (done) => {
        const userId = 2;
        const newUser = {
            firstName: 'Mike',
            lastName: 'Johnson',
            emailAddress: 'mike.johnson@example.com',
        };
        chai.request(app)
            .put(`/api/user/${userId}`)
            .send(newUser)
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.body.message, `User with id ${userId} updated`);
                assert.equal(res.body.data.firstName, newUser.firstName);
                assert.equal(res.body.data.lastName, newUser.lastName);
                assert.equal(res.body.data.emailAddress, newUser.emailAddress);
                done();
            });
    });

    it('should return an error message if id does not exist', (done) => {
        const userId = 99;
        const newUser = {
            firstName: 'Mike',
            lastName: 'Johnson',
            emailAddress: 'mike.johnson@example.com',
        };
        chai.request(app)
            .put(`/api/user/${userId}`)
            .send(newUser)
            .end((err, res) => {
                assert.equal(res.status, 404);
                assert.equal(res.body.message, `User with id ${userId} not found`);
                done();
            });
    });
});
