const request = require('supertest');
const {User} = require('../../models/user');
const {Customer} = require('../../models/customer');
const jwt = require("jsonwebtoken");
const config = require('config');
let server;

describe('/api/auth', () => {
    let user = {
        email:"Demo@gmail.com",
        password: 'password',
        name: "demo"
    };

    beforeEach(async () => { 
        server = require('../../index');

    });
    afterEach(async () => { 
        await server.close();
    });
    
    describe('POST /', () => {
        beforeEach(async () => { 
            user = {
                email:"Demo@gmail.com",
                password: 'password',
                name: "demo"
            }
            await request(server).post('/api/users').send(user);
            token = new User(user).generateAuthToken();      
        });
        afterEach( async () => {
            await User.remove({});
            await Customer.remove({});
        })
        // Define the happy path, and then in each test, we change 
        // one parameter that clearly aligns with the name of the 
        // test. 
        it('should return 400 if email less than 5 characters', async () => {
            user.email = "a@c";

            const res = await request(server).post('/api/auth').send(user)

            expect(res.status).toBe(400);
        });
    
        it('should return 400 if email greater than 255 characters', async () => {
            user.email= new Array(257).join('a');

            const res = await request(server).post('/api/auth').send(user)

            expect(res.status).toBe(400);
        });
    
        it('should return 400 if email is not good format', async () => {
            user.email= "aaaaa"

            const res = await request(server).post('/api/auth').send(user)

            expect(res.status).toBe(400);
        });
        
        it('should return 400 if password is less than format', async () => {
            user.password = "a";
      
            const res = await request(server).post('/api/auth').send(user)
      
            expect(res.status).toBe(400);
          });

        it('should return 400 if password is great than 255 characters', async () => {
            user.password = new Array(257).join('a')

            const res = await request(server).post('/api/auth').send(user)

            expect(res.status).toBe(400);
        });

        it('should return 400 if email is invalid', async () => {
            user.email= "a@gmail.com"
    
            const res = await request(server).post('/api/auth').send(user)
    
            expect(res.status).toBe(400);
        });

        it('should return 400 if email is valid but password is not', async () => {
            user.password = "aaaaa"
    
            const res = await request(server).post('/api/auth').send(user)
    
            expect(res.status).toBe(400);
        });
    
        it('should return the token if both email and password are valid', async () => {

            const res = await request(server).post('/api/auth').send({email:user.email,password:user.password})
            const decoded = jwt.verify(res.text, config.get('jwtPrivateKey'));
            expect(decoded).toHaveProperty('email',user.email);
        });
      });
});