const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('TC-201-5', function () {
    it('should add a user to the in-mem database and return the user data', (done) => {
        const user = {
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'johndoe@example.com'
        };
        
        chai.request(app)
            .post('/api/user')
            .send(user)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.status).to.equal(200);
                expect(res.body.message).to.equal(`User with id ${res.body.data.id} is added`);
                expect(res.body.data.firstName).to.equal(user.firstName);
                expect(res.body.data.lastName).to.equal(user.lastName);
                expect(res.body.data.emailAddress).to.equal(user.emailAddress);
                done();
            });
    });
});
