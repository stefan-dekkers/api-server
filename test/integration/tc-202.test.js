const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Tests for: UC-202', function () {
    it('TC-202-1: show all users', (done) => {
        chai.request(app)
            .get('/api/user')
            .end((err, res) => {
                expect(res.body.status).to.equal(200);
                expect(res.body.message).to.equal('User getAll endpoint');
                expect(res.body.data).that.is.an('array').with.length.gte(2);
                done();
            });
    });

    // it('TC-202-2: ', (done) => {
    //     done();
    // });

    it('TC-202-3: show users where isActive = false', (done) => {
        chai.request(app)
            .get('/api/user?isActive=false')
            .end((err, res) => {
                expect(res.body.status).to.equal(200);
                expect(res.body.message).to.equal('User getAll endpoint');
                expect(res.body.data).that.is.an('array');
                res.body.data.forEach((user) => {
                    expect(user.isActive).to.be.equal(0);
                });
                done();
            });
    });

    it('TC-202-4: show users where isActive = true', (done) => {
        chai.request(app)
            .get('/api/user?isActive=true')
            .end((err, res) => {
                expect(res.body.status).to.equal(200);
                expect(res.body.message).to.equal('User getAll endpoint');
                expect(res.body.data).that.is.an('array');
                res.body.data.forEach((user) => {
                    expect(user.isActive).to.be.equal(1);
                });
                done();
            });
    });

    // it('TC-202-5: ', (done) => {
    //     done();
    // });
});
