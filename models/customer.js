const Joi = require('joi');
const mongoose = require('mongoose');
const Customer = mongoose.model('Customer', new mongoose.Schema({
  name: {
    type: String,
    default:"customer"
  },
  email:{
    type: String,
    default:""
  },
  address:{
    type: String,
    default:""
  },
  city:{
    type: String,
    default:""
  },
  province:{
    type: String,
    default:""
  },
  zip:{
    type: String,
    default:""
  },
  isGold: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    default:""
  },
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}));

function validateCustomer(customer) {
  const schema = {
    name: Joi.string().default(""),
    phone: Joi.string().default(""),
    email: Joi.string().default(""),
    address: Joi.string().default(""),
    city: Joi.string().default(""),
    province: Joi.string().default(""),
    zip: Joi.string().default(""),
    isGold: Joi.boolean().default(false),
    user: Joi.string().required(),
    _id: Joi.string()
  };

  return Joi.validate(customer, schema);
}

exports.Customer = Customer; 
exports.validate = validateCustomer;