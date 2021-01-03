const { Genre } = require("./models/genre");
const { Movie } = require("./models/movie");
const { User } = require("./models/user");
const { Customer } = require("./models/customer");
const { Rental } = require("./models/rental");

const data = [
  {
    name: "Comedy",
    movies: [
      { title: "Airplane", numberInStock: 5, dailyRentalRate: 2 },
      { title: "The Hangover", numberInStock: 10, dailyRentalRate: 2 },
      { title: "Wedding Crashers", numberInStock: 15, dailyRentalRate: 2 }
    ]
  },
  {
    name: "Action",
    movies: [
      { title: "Die Hard", numberInStock: 5, dailyRentalRate: 2 },
      { title: "Terminator", numberInStock: 10, dailyRentalRate: 2 },
      { title: "The Avengers", numberInStock: 15, dailyRentalRate: 2 }
    ]
  },
  {
    name: "Romance",
    movies: [
      { title: "The Notebook", numberInStock: 5, dailyRentalRate: 2 },
      { title: "When Harry Met Sally", numberInStock: 10, dailyRentalRate: 2 },
      { title: "Pretty Woman", numberInStock: 15, dailyRentalRate: 2 }
    ]
  },
  {
    name: "Thriller",
    movies: [
      { title: "The Sixth Sense", numberInStock: 5, dailyRentalRate: 2 },
      { title: "Gone Girl", numberInStock: 10, dailyRentalRate: 2 },
      { title: "The Others", numberInStock: 15, dailyRentalRate: 2 }
    ]
  }
];
  const users = [
    {email:"client1@gmail.com",password:"password",name:"client1"},
    {email:"client2@gmail.com",password:"password",name:"client2"},
    {email:"client3@gmail.com",password:"password",name:"client3"}
  ]

  const rentals = Array(10);

function rentalsSize(){
  return rentals.length;
}

async function seed() {
  await Movie.deleteMany({});
  await Genre.deleteMany({});
  await User.deleteMany({});
  await Customer.deleteMany({});
  await Rental.deleteMany({});

  for (let genre of data) {
    const { _id: genreId } = await new Genre({ name: genre.name }).save();
    const movies = genre.movies.map(movie => ({
      title: movie.title,
      numberInStock: movie.numberInStock,
      dailyRentalRate: movie.dailyRentalRate,
      genre: { _id: genreId, name: genre.name }
    }));
    await Movie.insertMany(movies);
  }

  for (let user of users) {
    const result = await new User(user).save();
    await new Customer({ 
      name: result.name,
      user: result._id,
      isGold: false
    }).save();
  }
  
  const movies = await Movie.find();
  const customers = await Customer.find();

  for (let i=0;i<rentals.length;i++){
    rentals[i] = await new Rental({
      customer: {
        _id: customers[i%customers.length]._id,
        user: customers[i%customers.length].user,
        name: customers[i%customers.length].name,
      },
      movie: {
        _id: movies[i%movies.length]._id,
        title:  movies[i%movies.length].title,
        dailyRentalRate:  movies[i%movies.length].dailyRentalRate,
      }
    }).save();
  }
}

exports.seed = seed; 
exports.rentalsSize = rentalsSize;