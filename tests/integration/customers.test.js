const request = require('supertest');
const mongoose = require('mongoose');
const {Customer} = require('../../models/customer')
const {User} = require('../../models/user');

let server;

describe('/api/customers', () => {
    beforeEach(() => { server = require('../../index'); })
    
    afterEach(async () => { 
      await server.close(); 
      await Customer.remove({});
      await User.remove({});
    });

    describe('GET /', () => {
        it('should return 401 if token is not privoded', async()=>{
            const token = ""
            
            const res = await request(server).get('/api/customers').set('x-auth-token', token);

            expect(res.status).toBe(401);
        })

        it('should return 403 if user is not admin', async()=>{
            const token = new User({ isAdmin: false }).generateAuthToken();

            const res = await request(server).get('/api/customers').set('x-auth-token', token);

            expect(res.status).toBe(403);
        })

        it('should return all customers', async () => {
            const user1 = new User({name:"admin",email:"admin@gmail.com",password:"password"});
            const user2 = new User({name:"client",email:"client@gmail.com",password:"password"});
            const token = new User({ isAdmin: true }).generateAuthToken(); 
            await user1.save();
            await user2.save();
            const customers = [
                {name:"admin",user:user1._id},
                {name:"client",user:user2._id}
            ]
            await Customer.collection.insertMany(customers);
            
            const res = await request(server).get('/api/customers').set('x-auth-token', token);
            
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(c => c.name === 'admin')).toBeTruthy();
            expect(res.body.some(c => c.name === 'client')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        let token;
        let id;
        let customer;

        beforeEach(async () => {
            const user = new User({name:"user",email:"user@gmail.com",password:"password"});
            await user.save();
            customer = {name:"customer",user:user._id}
            await Customer.collection.insertOne(customer);
            token = user.generateAuthToken();
            id= user._id;
          });

        const exec = async () => {
            return await request(server)
                .get('/api/customers/' + id)
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

        it('should return 404 if id is not found', async()=>{
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        })

        it('should return customer if id and token are valid', async()=>{
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("name",customer.name);
        })
    });

    describe("PUT /:id", async()=>{
        let token;
        let id;
        let newCustomer;
        
        beforeEach(async () => {
            const user = new User({name:"user",email:"user@gmail.com",password:"password"});
            await user.save();
            customer = {name:"customer",user:user._id}
            newCustomer = {
                name:"newCustomer",
                address:"newAddress",
                city:"newCity",
                province:"newProvince",
                zip:"newZip",
                email:"newEmail",
                isGold:true,
                phone:"00000000",
                user:user._id
            }
            await Customer.collection.insertOne(customer);
            token = user.generateAuthToken();
            id= user._id;
        })

        const exec = async () => {
            return await request(server)
                .put('/api/customers/' + id)
                .set('x-auth-token', token)
                .send(newCustomer);
        }

        it('should return 401 if client is not logged in', async () => {
            token = ''; 
      
            const res = await exec();
      
            expect(res.status).toBe(401);
        });

        it('should return 400 if input is not include a user filed', async () => {
            delete newCustomer['user'];
      
            const res = await exec();
      
            expect(res.status).toBe(400);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;
      
            const res = await exec();
      
            expect(res.status).toBe(404);
        });

        it('should return 404 if customer with the given user id was not found', async () => {
            id = mongoose.Types.ObjectId();
      
            const res = await exec();
      
            expect(res.status).toBe(404);
        });

        it('should update customer if id and token are valid', async()=>{
            await exec();

            const updatedMovie = await Customer.findOne({user:id});
            
            expect(updatedMovie).toHaveProperty("name",newCustomer.name);
            expect(updatedMovie).toHaveProperty("address",newCustomer.address);
            expect(updatedMovie).toHaveProperty("city",newCustomer.city);
            expect(updatedMovie).toHaveProperty("province",newCustomer.province);
            expect(updatedMovie).toHaveProperty("zip",newCustomer.zip);
            expect(updatedMovie).toHaveProperty("email",newCustomer.email);
            expect(updatedMovie).toHaveProperty("isGold",newCustomer.isGold);
            expect(updatedMovie).toHaveProperty("phone",newCustomer.phone);
        })

        it('should return the updated customer if id and token are valid', async () => {
            const res = await exec();
      
            expect(res.body).toHaveProperty("name",newCustomer.name);
            expect(res.body).toHaveProperty("address",newCustomer.address);
            expect(res.body).toHaveProperty("city",newCustomer.city);
            expect(res.body).toHaveProperty("province",newCustomer.province);
            expect(res.body).toHaveProperty("zip",newCustomer.zip);
            expect(res.body).toHaveProperty("email",newCustomer.email);
            expect(res.body).toHaveProperty("isGold",newCustomer.isGold);
            expect(res.body).toHaveProperty("phone",newCustomer.phone);
        });
    })

    describe("POST /change", async()=>{
        let token;
        let removedAndChanged;
        let user1;
        let user2;
        let user3;
        let user4;
        beforeEach(async () => {
            user1 = new User({name:"user1",email:"user1@gmail.com",password:"password"});
            user2 = new User({name:"user2",email:"user2@gmail.com",password:"password"});
            user3 = new User({name:"user3",email:"user3@gmail.com",password:"password"});
            user4 = new User({name:"user4",email:"user4@gmail.com",password:"password"});
            
            await user1.save();
            await user2.save();
            await user3.save();
            await user4.save();
            
            const customer1 = new Customer({name:"customer1",user:user1._id,isGold:false});
            const customer2 = new Customer({name:"customer2",user:user2._id,isGold:false});
            const customer3 = new Customer({name:"customer3",user:user3._id,isGold:false});
            const customer4 = new Customer({name:"customer4",user:user4._id,isGold:false});

            await customer1.save();
            await customer2.save();
            await customer3.save();
            await customer4.save();

            removedAndChanged = {
                changed:[
                    {_id:(customer1._id).toString(),name:"customer1",user:user1,isGold:true},
                    {_id:(customer2._id).toString(),name:"customer2",user:user2,isGold:true}
                ],
                removed:[
                    {_id:(customer3._id).toString(),name:"customer3",user:user3,isGold:false},
                    {_id:(customer4._id).toString(),name:"customer4",user:user4,isGold:false}
                ]
            } 
            
            token = new User({ isAdmin: true }).generateAuthToken();
        })

        const exec = async () => {
            return await request(server)
                .post('/api/customers/change')
                .set('x-auth-token', token)
                .send(removedAndChanged);
        }
        it('should return 401 if client is not logged in', async () => {
            token = ''; 
      
            const res = await exec();
      
            expect(res.status).toBe(401);
        });

        it('should return 403 if user is not admin', async()=>{
            token = new User({ isAdmin: false }).generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        })

        it('should return 500 and rollback if can not update customers', async()=>{
            removedAndChanged.changed[0]._id = "";

            const res = await exec();
            expect(res.status).toBe(500);

            const customers = await Customer.find();
            expect(customers.length).toBe(4);

            const falsy = await Customer.find({isGold:false});
            expect(falsy.length).toBe(4);

            const users = await User.find();
            expect(users.length).toBe(4);
        })

        it('should return 500 and rollback if can not delete customers', async()=>{
            removedAndChanged.removed[1]._id = "aaaaaaaaaaaaaaaaaaaaaaaa";

            const res = await exec();
            expect(res.status).toBe(500);
            
            const customers = await Customer.find();
            expect(customers.length).toBe(4);

            const falsy = await Customer.find({isGold:false});
            expect(falsy.length).toBe(4);

            const users = await User.find();
            expect(users.length).toBe(4);
        })

        it('should return 500 and rollback if can not delete users', async()=>{
            removedAndChanged.removed[1].user = "1";

            const res = await exec();
            expect(res.status).toBe(500);
            
            const customers = await Customer.find();
            expect(customers.length).toBe(4);

            const falsy = await Customer.find({isGold:false});
            expect(falsy.length).toBe(4);

            const users = await User.find();
            expect(users.length).toBe(4);
        })

        it("should update and delete customers and users if token is valid", async ()=>{
            const res = await exec();
            expect(res.status).toBe(200);
            
            const updatedCustomers = await Customer.find({isGold:true});
            expect(updatedCustomers.length).toBe(2);
            expect(updatedCustomers.some(c => c.name === 'customer1')).toBeTruthy();
            expect(updatedCustomers.some(c => c.name === 'customer2')).toBeTruthy();

            const deleteCustomers = await Customer.find({user:{$in:[user3._id,user4._id]}});
            expect(deleteCustomers.length).toBe(0);

            const deleteUsers = await User.find({_id:{$in:[user3._id,user4._id]}});
            expect(deleteUsers.length).toBe(0);
        })
    });
});