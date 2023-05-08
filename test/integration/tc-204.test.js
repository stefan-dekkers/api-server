const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Tests for: UC-204', function () {
    it('TC-204-1: invalid token', (done) => {
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
