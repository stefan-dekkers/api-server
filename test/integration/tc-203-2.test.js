const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('TC-203-2', function () {
    it('should return user profile', (done) => {
        chai.request(app)
          .get('/api/user/profile')
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.status).to.equal(200);
            expect(res.body.message).to.equal('User profile retrieved');
            expect(res.body.data).to.be.an('object');
            expect(res.body.data).to.have.property('id');
            expect(res.body.data).to.have.property('userName');
            expect(res.body.data).to.have.property('password');
            expect(res.body.data).to.have.property('firstName');
            expect(res.body.data).to.have.property('lastName');
            expect(res.body.data).to.have.property('emailAddress');
            done();
          });
      });
});

