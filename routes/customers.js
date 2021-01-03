const express = require("express");
const _ = require('lodash');
const mongoose = require('mongoose');
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const { User } = require("../models/user");
const { Customer, validate} = require("../models/customer");
const router = express.Router();

router.get("/", [auth,admin], async (req, res) => {
  const customers = await Customer.find()
    .populate("user")
    .select("-__v")
    .sort("name");
  res.send(customers);
});

router.put("/:id", [auth,validateObjectId], async (req, res) => {
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

router.post("/change", [auth, admin], async (req, res) => {
  const {removed} = req.body;
  const ids_customer = _.map(removed,'_id');
  const ids_user = _.map(removed,'user._id')

  const {changed} = req.body;

  const session = await mongoose.startSession();
  var bulk = Customer.collection.initializeUnorderedBulkOp();
  changed.map(c=>{
    if(mongoose.Types.ObjectId.isValid(c._id))
      bulk.find({_id:mongoose.Types.ObjectId(c._id)}).updateOne( { $set: {isGold:c.isGold} } );
  })

  try{
    session.startTransaction();

    const doc = await bulk.execute(null,{session});
    if(doc.result.nModified !== changed.length){
      throw new Error("Can not update all of customers, transaction rollback!");
    }

    const doc1 = await Customer.deleteMany({_id:{$in:ids_customer}}).session(session);
    if(doc1.deletedCount !== removed.length){
      throw new Error("Can not delete all of customers, transaction rollback!");
    }

    const doc2 = await User.deleteMany({_id:{$in:ids_user}}).session(session);
    if(doc2.deletedCount !== removed.length){
      throw new Error("Can not delete all of users, transaction rollback!");
    }
    
    await session.commitTransaction();
    res.send([doc,doc1,doc2]);
  }catch(err){
    res.status(500).send(err);
    await session.abortTransaction();
  }finally{
    await session.endSession();
  }
});

router.get("/:id", [auth,validateObjectId], async (req, res) => {
  const customer = await Customer.findOne({user:req.params.id}).select("-__v");
  if (!customer)
    return res
      .status(404)
      .send("The customer with the given ID was not found.");

  res.send(customer);
});

module.exports = router;
