const request = require('supertest');
const mongoose = require('mongoose');
const {Rental} = require('../../models/rental');
const {User} = require('../../models/user');
const {seed,rentalsSize} = require('../../test-seed');
const { Customer } = require('../../models/customer');
const { Movie } = require('../../models/movie');

let server;

describe('/api/rentals', () => {
    beforeEach(async () => { 
        server = require('../../index'); 
        await seed();
    })
    
    afterEach(async () => { 
      await server.close();
    });

    describe('GET /', () => {
        it('should return 401 if token is not privoded', async()=>{
            const token = ""
            
            const res = await request(server).get('/api/rentals').set('x-auth-token', token);

            expect(res.status).toBe(401);
        })

        it('should return 403 if user is not admin', async()=>{
            const token = new User({ isAdmin: false }).generateAuthToken();

            const res = await request(server).get('/api/rentals').set('x-auth-token', token);

            expect(res.status).toBe(403);
        })

        it('should return all rentals', async () => {
            const token = new User({ isAdmin: true }).generateAuthToken(); 
            
            const res = await request(server).get('/api/rentals').set('x-auth-token', token);
            
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(rentalsSize());
        });
    });

    describe('GET /:id', () => {
        let token;
        let id;
        let user;

        beforeEach(async () => {
            user = await User.findOne({name:"client1"});
            token = user.generateAuthToken();
            id= user._id;
          });

        const exec = async () => {
            return await request(server)
                .get('/api/rentals/' + id)
                .set('x-auth-token', token)
                .send();
        }

        it('should return 401 if token is not privoded', async()=>{
            token = ""
            
            const res = await exec();

            expect(res.status).toBe(401);
        })

        it('should return 404 if id is not valid format', async()=>{
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        })

        it('should return 404 if this user do not have any rentals', async()=>{
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        })

        it('should return rentals if id and token are valid', async()=>{
            const res = await exec();
            const rentals = await Rental.find({'customer.user':id});
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(rentals.length);
        })
    });
    
    describe('POST /', () => {
        let rental;
        let token;
        let customer;
        let movie;

        beforeEach(async () => {

            user = await User.findOne({name:"client1"});
            token = user.generateAuthToken();
            customer = await Customer.findOne({user:user._id});
            movie = await Movie.findOne({title:"Airplane"});
            rental = {
                userId: user._id,
                movieId: movie._id
            };
        });

        const exec = async () => {
            return await request(server)
                .post('/api/rentals')
                .set('x-auth-token', token)
                .send(rental);
        }

        it('should return 401 if token is not privoded', async()=>{
            token = ""
            
            const res = await exec();

            expect(res.status).toBe(401);
        })

        it('should return 400 if userId is not valid', async()=>{
            rental.userId = "1"
            
            const res = await exec();

            expect(res.status).toBe(400);
        })

        it('should return 400 if movieId is not valid', async()=>{
            rental.movieId = "1"
            
            const res = await exec();

            expect(res.status).toBe(400);
        })

        it('should return 400 if userId is not found', async()=>{
            rental.userId = mongoose.Types.ObjectId();
            
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Invalid customer/);
        })

        it('should return 400 if movieId is not found', async()=>{
            rental.movieId = mongoose.Types.ObjectId();
            
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Invalid movie/);
        })

        
        it('should return 400 if numberInStock is 0', async()=>{
            movie.numberInStock = 0;
            movie.save();
            
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Movie not in stock./);
        })

        it('should return new Rental and the numberInStock of this movie is decreased by 1', async ()=>{
            const res = await exec();
            
            expect(res.status).toBe(200);
            expect(res.body.customer._id).toEqual((customer._id).toString());
            expect(res.body.movie._id).toEqual((movie._id).toString());

            const theNewMovie = await Movie.findById(movie._id);
            expect(theNewMovie.numberInStock).toBe(movie.numberInStock-1);
        })
        
    });

    describe('DELETE /:userId/:movieId', () => {
        let rental;
        let token;
        let customer;
        let movie;
        let userId;
        let movieId;

        beforeEach(async () => {
            user = await User.findOne({name:"client1"});
            token = user.generateAuthToken();
            rental = await Rental.findOne({'customer.user._id':user._id})
            customer = await Customer.findOne({user:user._id});
            movie = await Movie.findOne({title:"Airplane"});
            userId = user._id;
            movieId = movie._id;
        });

        const exec = async () => {
            return await request(server)
                .delete('/api/rentals/'+userId+'/'+movieId)
                .set('x-auth-token', token)
                .send();
        }

        it('should return 401 if token is not privoded', async()=>{
            token = ""
            
            const res = await exec();

            expect(res.status).toBe(401);
        })

        it('should return 404 if userId is not valid format', async()=>{
            userId = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        })

        it('should return 404 if movieId is not valid format', async()=>{
            movieId = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        })

        it('should return 400 if rentalId is not found', async()=>{
            userId = mongoose.Types.ObjectId();
            
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/You don't have this movie/);
        })

        it('should return 400 if movieId is not found', async()=>{
            await Movie.remove({_id:movieId});
            
            const res = await exec();

            expect(res.status).toBe(400);
        })

        it('should return the deleted Rental and the numberInStock of this movie is increased by 1', async ()=>{
            const res = await exec();
            
            expect(res.status).toBe(200);
            expect(res.body.customer._id).toEqual((customer._id).toString());
            expect(res.body.movie._id).toEqual((movie._id).toString());

            const theDeletedMovie = await Movie.findById(movie._id);
            expect(theDeletedMovie.numberInStock).toBe(movie.numberInStock+1);
        })
        
    });
    describe('DELETE /:rentalId', () => {
        let rental;
        let token;


        beforeEach(async () => {
            user = await User.findOne({name:"client1"});
            token = user.generateAuthToken();
            rental = await Rental.findOne({'customer.user':user._id})
            rentalId = rental._id;
        });

        const exec = async () => {
            return await request(server)
                .delete('/api/rentals/'+rentalId)
                .set('x-auth-token', token)
                .send();
        }

        it('should return 401 if token is not privoded', async()=>{
            token = ""
            
            const res = await exec();

            expect(res.status).toBe(401);
        })

        it('should return 404 if rentalId is not valid format', async()=>{
            rentalId = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        })

        
        it('should return 400 if rentalId is not found', async()=>{
            rentalId = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/can not find this rental id/);
        })

        it('should return 400 if movie is not available anymore', async()=>{
            await Movie.remove({_id:rental.movie._id})

            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/can not find this movie id/);
        })

        it('should return the deleted Rental and the numberInStock of this movie is increased by 1', async ()=>{
            const movie = await Movie.findById(rental.movie._id);
            const res = await exec();
            
            expect(res.status).toBe(200);
            expect(res.body._id).toBe((rental._id).toString())

            const theDeletedMovie = await Movie.findById(rental.movie._id);
            expect(theDeletedMovie.numberInStock).toBe(movie.numberInStock+1);
        })
    });
});