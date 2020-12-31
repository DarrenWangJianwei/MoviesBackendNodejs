const express = require("express");
const _ = require('lodash');
const auth = require("../middleware/auth");
const mongoose = require('mongoose');
const { User } = require("../models/user");
const { Customer, validate} = require("../models/customer");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  const customers = await Customer.find()
    .populate("user")
    .select("-__v")
    .sort("name");
  res.send(customers);
});

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let customer = new Customer({
    name: req.body.name,
    isGold: req.body.isGold,
    phone: req.body.phone,
    user: req.body.user
  });

  customer = await customer.save();

  res.send(customer);
});

router.put("/:id", auth, async (req, res) => {
  const { error } = validate(req.body);

  if (error) return res.status(400).send(error.details[0].message);
  const customer = await Customer.findOne({user:req.params.id});

  if (!customer)
  return res
    .status(404)
    .send("The customer with the given ID was not found.");

  customer.name = req.body.name?req.body.name:"";
  customer.address = req.body.address?req.body.address:"";
  customer.city = req.body.city?req.body.city:"";
  customer.province = req.body.province?req.body.province:"";
  customer.zip = req.body.zip?req.body.zip:"";
  customer.email = req.body.email?req.body.email:"";
  customer.isGold = req.body.isGold?req.body.isGold:false;
  customer.phone = req.body.phone?req.body.phone:"";

  const result = await customer.save();

  res.send(result);
});

router.post("/change", auth, async (req, res) => {
  const {removed} = req.body;
  const ids_customer = _.map(removed,'_id');
  const ids_user = _.map(removed,'user._id')

  const {changed} = req.body;
  const bulkOps = changed.map(c=>({
    updateOne:{
      filter:{_id: mongoose.Types.ObjectId(c._id)},
      update:{$set: {isGold: c.isGold}},
      upsert: true
    }
  }));

  const session = await mongoose.startSession();
  try{
    session.startTransaction();

    const doc = await Customer.collection.bulkWrite(bulkOps)
    const doc1 = await Customer.deleteMany({_id:{$in:ids_customer}}).session(session);
    const doc2 = await User.deleteMany({_id:{$in:ids_user}}).session(session);
    await session.commitTransaction();
    
    res.send([doc,doc1,doc2]);
  }catch(err){
    res.status(404).send("Transaction failed! unable to update or delete customers");
  }finally{
    await session.endSession();
  }
});

router.get("/:id", auth, async (req, res) => {
  const customer = await Customer.findOne({user:req.params.id}).select("-__v");
  if (!customer)
    return res
      .status(404)
      .send("The customer with the given ID was not found.");

  res.send(customer);
});

module.exports = router;
