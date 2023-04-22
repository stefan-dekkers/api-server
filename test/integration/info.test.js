const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

chai.should();
chai.use(chaiHttp);

describe('TC-102', function () {
    it('TC-102', (done) => {
        chai.request(app).get('/api/info').end((err, res) => {
            res.body.should.be.an('object');
            res.body.should.has.property('status').to.be.equal(200);
            res.body.should.has.property('message');
            res.body.should.has.property('data');
            let {data, message} = res.body;
            data.should.be.an('object');
            data.should.has.property('studentName').to.be.equal('Stefan');
            data.should.has.property('studentNumber').to.be.equal(1234567);
            done();
        });
    });
});

