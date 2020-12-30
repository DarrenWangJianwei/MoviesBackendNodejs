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
    name: Joi.string().allow('', null).default(""),
    phone: Joi.string().allow('', null).default(""),
    email: Joi.string().allow('', null).default(""),
    address: Joi.string().allow('', null).default(""),
    city: Joi.string().allow('', null).default(""),
    province: Joi.string().allow('', null).default(""),
    zip: Joi.string().allow('', null).default(""),
    isGold: Joi.boolean().allow('', null).default(false),
    user: Joi.string().required(),
    _id: Joi.string().allow('', null).default("")
  };

  return Joi.validate(customer, schema);
}
exports.Customer = Customer; 
exports.validate = validateCustomer;