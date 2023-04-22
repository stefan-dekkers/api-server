const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('TC-203', function () {
  it('should return a 501 status code and a "This functionality has not yet been realized." message', (done) => {
    chai.request(app)
        .get('/api/user/profile')
        .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(501);
            expect(res.body.status).to.equal(501);
            expect(res.body.message).to.equal("This functionality has not yet been realized.");
            expect(res.body.data).to.deep.equal({});
            done();
        });
});
});

