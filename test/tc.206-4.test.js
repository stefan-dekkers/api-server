const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('TC-206-4', function () {
    it('should delete the user with the given ID', (done) => {
        const userId = 0;
        chai
          .request(app)
          .delete(`/api/user/${userId}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal(`User with id ${userId} deleted`);
            done();
          });
      });
});

