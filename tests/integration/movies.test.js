const request = require('supertest');
const mongoose = require('mongoose');
const {Genre} = require('../../models/genre');
const {Movie} = require('../../models/movie');
const {User} = require('../../models/user');
const {seed} = require('../../test-seed');

describe('/api/movies', () => {
    beforeEach(() => { server = require('../../index'); })
    afterEach(async () => { 
      await server.close(); 
      await Genre.remove({});
      await Movie.remove({});
      await User.remove({});
    });

    describe('GET /', () => {
        it('should return all movies', async () => {
          await seed();

          const res = await request(server).get('/api/movies');
          
          expect(res.status).toBe(200);
          expect(res.body.length).toBe(12);
          expect(res.body.some(m => m.title === 'Airplane')).toBeTruthy();
          expect(res.body.some(m => m.title === 'The Hangover')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return 404 if invalid movie id passed', async () => {
          const res = await request(server).get('/api/movies/1');
    
          expect(res.status).toBe(404);
        });
    
        it('should return 404 and text with given ID was not found if not found given movie id', async () => {
          const id = mongoose.Types.ObjectId();
          const res = await request(server).get('/api/movies/'+ id);
    
          expect(res.status).toBe(404);
          expect(res.text).toMatch(/given ID was not found/);
        });
    
        it('should return a movie if valid id is passed', async () => {
          const id = mongoose.Types.ObjectId();
          const movie = new Movie({ title: 'movie1',numberInStock:1,dailyRentalRate:1,genre:{_id:id,name:"genre1"} });
          await movie.save();

          const res = await request(server).get('/api/movies/' + movie._id);
    
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty('title', movie.title);  
        });
    });

    describe('POST /', () => {
        // Define the happy path, and then in each test, we change 
        // one parameter that clearly aligns with the name of the 
        // test. 
        let token; 
        let movie;
    
        const exec = async () => {
          return await request(server)
            .post('/api/movies')
            .set('x-auth-token', token)
            .send( movie );
        }
    
        beforeEach(async () => {
            token = new User().generateAuthToken();
            genre = new Genre({ name: 'genre1' });
            await genre.save();
            movie = {
                title: 'movie1',
                numberInStock:1,
                dailyRentalRate:1,
                genreId: genre._id
            }   
        })
    
        it('should return 401 if client is not logged in', async () => {
            token = ''; 
        
            const res = await exec();
        
            expect(res.status).toBe(401);
        });
    
        it('should return 400 if title is less than 1 characters', async () => {
            movie.title = ''; 
            
            const res = await exec();
        
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if tilte is more than 255 characters', async () => {
            movie.title = new Array(257).join('a');
        
            const res = await exec();
        
            expect(res.status).toBe(400);
        });

        it('should return 400 if genreId is invalid', async () => {
            movie.genreId = '1'
      
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 and text with Invalid genre if genreId is not found', async () => {
            movie.genreId = mongoose.Types.ObjectId();
      
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Invalid genre/);
        });

        it('should return 400 if numberInStock is less than 0', async () => {
            movie.numberInStock = -1;
      
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if numberInStock greater than 255', async () => {
            movie.numberInStock = 256;
      
            const res = await exec();

            expect(res.status).toBe(400);
        });

        
        it('should return 400 if dailyRentalRate is less than 0', async () => {
            movie.dailyRentalRate = -1;
      
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if dailyRentalRate greater than 255', async () => {
            movie.dailyRentalRate = 256;
      
            const res = await exec();

            expect(res.status).toBe(400);
        });
    
        it('should save the movie if it is valid', async () => {
            await exec();
      
            const movie = await Movie.find({ name: 'movie1' });
      
            expect(movie).not.toBeNull();
          });
      
        it('should return the genre if it is valid', async () => {
            const res = await exec();
      
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', 'movie1');
          });
      });
    
    describe('PUT /:id', () => {
        let token; 
        let movie; 
        let genre; 
        let id; 
        let newMovie;
        const exec = async () => {
          return await request(server)
            .put('/api/movies/' + id)
            .set('x-auth-token', token)
            .send(newMovie);
        }
    
        beforeEach(async () => {
            token = new User().generateAuthToken();
            genre = new Genre({ name: 'genre1' });
            await genre.save();
            movie = {
                title: 'movie1',
                numberInStock:1,
                dailyRentalRate:1,
                genre: genre
            }
            movie = new Movie(movie);
            await movie.save();
            id = movie._id;
            
            newMovie = {
                title: 'newMovie',
                numberInStock:2,
                dailyRentalRate:2,
                genreId: genre._id
            }
        })
    
        it('should return 401 if client is not logged in', async () => {
            token = ''; 

            const res = await exec();

            expect(res.status).toBe(401);
        });
    
        it('should return 400 if title is less than 1 characters', async () => {
            newMovie.title = ''; 
            
            const res = await exec();

            expect(res.status).toBe(400);
        });
    
        it('should return 400 if title is more than 255 characters', async () => {
            newMovie.title = new Array(257).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genreId is invalid', async () => {
            newMovie.genreId = '1'
      
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 and text with Invalid genre if genreId is not found', async () => {
            newMovie.genreId = mongoose.Types.ObjectId();
      
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Invalid genre/);
        });

        it('should return 400 if numberInStock is less than 0', async () => {
            newMovie.numberInStock = -1;
      
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if numberInStock greater than 255', async () => {
            newMovie.numberInStock = 256;
      
            const res = await exec();

            expect(res.status).toBe(400);
        });

        
        it('should return 400 if dailyRentalRate is less than 0', async () => {
            newMovie.dailyRentalRate = -1;
      
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if dailyRentalRate greater than 255', async () => {
            newMovie.dailyRentalRate = 256;
      
            const res = await exec();

            expect(res.status).toBe(400);
        });
    
        it('should return 404 if id is invalid', async () => {
            id = 100;
        
            const res = await exec();
            
            expect(res.status).toBe(404);
        });
    
        it('should return 404 if movie with the given id was not found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.text).toMatch(/ID was not found/);
        });
    
        it('should update the movie if input is valid', async () => {
            await exec();

            const updatedMovie = await Movie.findById(movie._id);

            expect(updatedMovie.title).toBe("newMovie");
            expect(updatedMovie.numberInStock).toBe(2);
            expect(updatedMovie.dailyRentalRate).toBe(2);
        });
    });
    
    describe('DELETE /:id', () => {
        let token; 
        let movie; 
        let genre; 
        let id; 
    
        const exec = async () => {
            return await request(server)
            .delete('/api/movies/' + id)
            .set('x-auth-token', token)
            .send();
        }
    
        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();     
            genre = new Genre({ name: 'genre1' });
            await genre.save();
            movie = {
                title: 'movie1',
                numberInStock:1,
                dailyRentalRate:1,
                genre: genre
            }
            movie = new Movie(movie);
            await movie.save();
            id = movie._id;   
        })
    
        it('should return 401 if client is not logged in', async () => {
            token = ''; 
        
            const res = await exec();
            
            expect(res.status).toBe(401);
        });
    
        it('should return 403 if the user is not an admin', async () => {
            token = new User({ isAdmin: false }).generateAuthToken(); 
        
            const res = await exec();
        
            expect(res.status).toBe(403);
        });
    
        it('should return 404 if id is invalid', async () => {
            id = 1; 
            
            const res = await exec();
        
            expect(res.status).toBe(404);
        });
    
        it('should return 404 if no movie with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
        
            const res = await exec();
        
            expect(res.status).toBe(404);
        });
    
        it('should delete the moive if input is valid', async () => {
            await exec();
        
            const movieInDb = await Movie.findById(id);
        
            expect(movieInDb).toBeNull();
        });
    
        it('should return the removed movie', async () => {
            const res = await exec();
        
            expect(res.body).toHaveProperty('_id', movie._id.toHexString());
            expect(res.body).toHaveProperty('title', movie.title);
        });
    });  
});