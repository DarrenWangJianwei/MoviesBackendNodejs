const Joi = require('joi');
const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  customer: { 
    type: new mongoose.Schema({
      name: {
        type: String,
        default:""
      },
      user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isGold: {
        type: Boolean,
        default: false
      },     
    }),  
    required: true
  },
  movie: {
    type: new mongoose.Schema({
      title: {
        type: String,
        required: true,
        trim: true, 
        minlength: 5,
        maxlength: 255
      },
      dailyRentalRate: { 
        type: Number, 
        required: true,
        min: 0,
        max: 255
      }   
    }),
    required: true
  },
  rentalFee: { 
    type: Number, 
    min: 0
  }
});

rentalSchema.statics.lookup = function(customerId, movieId, user) {
  return this.findOne({
    'customer._id': customerId,
    'movie._id': movieId,
    'customer.user':user
  });
}

const Rental = mongoose.model('Rental', rentalSchema);

function validateRental(rental) {
  const schema = {
    userId: Joi.objectId().required(),
    movieId: Joi.objectId().required()
  };

  return Joi.validate(rental, schema);
}

exports.Rental = Rental; 
exports.validate = validateRental;