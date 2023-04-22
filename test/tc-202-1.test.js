const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('TC-202-1', function () {
    it('should return all users from the database', (done) => {
        chai.request(app)
            .get('/api/user')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('message', 'User getAll endpoint');
                expect(res.body).to.have.property('data').that.is.an('array').with.length.gte(2);
                done();
            });
    });
});

