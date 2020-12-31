const express = require("express");
const Fawn = require("fawn");
const auth = require("../middleware/auth");
const { Rental, validateRentalByUserAndMovie,validateRentalByRentalId } = require("../models/rental");
const { Movie } = require("../models/movie");
const { Customer } = require("../models/customer");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  const rentals = await Rental.find().select("-__v")
  res.send(rentals);
});

router.post("/", auth, async (req, res) => {
  const { error } = validateRentalByUserAndMovie(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const customer = await Customer.findOne({user:req.body.userId});
  if (!customer) return res.status(400).send("Invalid customer.");

  const movie = await Movie.findById(req.body.movieId);
  if (!movie) return res.status(400).send("Invalid movie.");

  if (movie.numberInStock === 0)
    return res.status(400).send("Movie not in stock.");

  let rental = new Rental({
    customer: {
      _id: customer._id,
      user: customer.user,
      name: customer.name,
    },
    movie: {
      _id: movie._id,
      title: movie.title,
      dailyRentalRate: movie.dailyRentalRate
    }
  });

  try {
    new Fawn.Task()
      .save("rentals", rental)
      .update(
        "movies",
        { _id: movie._id },
        {
          $inc: { numberInStock: -1 }
        }
      )
      .run();
    res.send(rental);
  } catch (ex) {
    res.status(500).send("Something failed.");
  }
});

router.delete("/:userId/:movieId", auth, async (req, res) => {
  const { error } = validateRentalByUserAndMovie(req.params);
  if (error) return res.status(400).send(error.details[0].message);

  const rental = await Rental.findOne({'customer.user':req.params.userId,'movie._id':req.params.movieId});
  if (!rental) return res.status(400).send("You don't have this movie");

  const movie = await Movie.findById(req.params.movieId);
  if (!movie) return res.status(400).send("Invalid movie.");

  try {
    new Fawn.Task()
      .remove("rentals", {_id:rental._id})
      .update(
        "movies",
        { _id: movie._id },
        {
          $inc: { numberInStock: +1 }
        }
      )
      .run();
    res.send(rental);
  } catch (ex) {
    res.status(500).send("Something failed. "+ex);
  }
});

router.delete("/:rentalId", auth, async (req, res) => {
  const { error } = validateRentalByRentalId(req.params);
  if (error) return res.status(400).send(error.details[0].message);

  const rental = await Rental.findById(req.params.rentalId);
  if (!rental) return res.status(404).send("can not find this rental id");

  const movie = await Movie.findById(rental.movie._id);
  if (!movie) return res.status(400).send("can not find this rental movie id.");

  try {
    new Fawn.Task()
      .remove("rentals", {_id:rental._id})
      .update(
        "movies",
        { _id: movie._id },
        {
          $inc: { numberInStock: +1 }
        }
      )
      .run();
    res.send(rental);
  } catch (ex) {
    res.status(500).send("Something failed. "+ex);
  }
});

router.get("/:id", [auth], async (req, res) => {
  const rental = await Rental.find({'customer.user':req.params.id}).select("-__v");

  if (!rental)
    return res.status(404).send("The rental with the given ID was not found.");

  res.send(rental);
});

module.exports = router;
