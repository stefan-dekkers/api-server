const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');

chai.use(chaiHttp);
const expect = chai.expect;
const assert = chai.assert;

describe('TC-204-3', function () {
    it('should return the user with the given ID', (done) => {
        const userId = 1;
        chai.request(app)
            .get(`/api/user/${userId}`)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.status).to.equal(200);
                expect(res.body.message).to.equal(`User with id ${userId} retrieved`);
                assert.isObject(res.body.data);
                assert.equal(res.body.data.id, userId);
                assert.property(res.body.data, 'firstName');
                assert.property(res.body.data, 'lastName');
                assert.property(res.body.data, 'emailAddress');
                done();
            });
      });
});

