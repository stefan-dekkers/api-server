const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Tests for: UC-206', function () {
    it('should delete user with a valid id', async () => {
        const res = await chai.request(app).delete('/api/user/0');
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('status').to.equal(200);
        expect(res.body).to.have.property('message').to.equal('User with id 0 deleted');
        expect(res.body).to.have.property('data').to.be.an('object');
    });

    it('should return 404 with a non-existent id', async () => {
        const res = await chai.request(app).delete('/api/user/10');
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('status').to.equal(404);
        expect(res.body).to.have.property('message').to.equal('User with id 10 not found');
        expect(res.body).to.have.property('data').to.be.an('object');
    });
});
