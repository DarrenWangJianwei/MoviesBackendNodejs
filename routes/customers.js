const { Customer, validate } = require("../models/customer");
const auth = require("../middleware/auth");
const express = require("express");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  const customers = await Customer.find()
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
    user: req.body.userId
  });
  //customer = await customer.save();

  res.send(customer);
});

router.put("/:id", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const customer = await Customer.findOne({user:req.params.id}).select("-__v -user -_id");
  
  if (!customer)
  return res
    .status(404)
    .send("The customer with the given ID was not found.");

  customer.name = req.body.name;
  customer.isGold = req.body.isGold;
  customer.phone = req.body.phone;

  const result = await customer.save();

  res.send(result);
});

// router.delete("/:id", auth, async (req, res) => {
//   const customer = await Customer.findOne(req.params.id);

//   if (!customer)
//     return res
//       .status(404)
//       .send("The customer with the given ID was not found.");

//   customer.remove();
//   res.send(customer);
// });

router.get("/:id", auth, async (req, res) => {
  const customer = await Customer.findOne({user:req.params.id}).select("-__v");
  if (!customer)
    return res
      .status(404)
      .send("The customer with the given ID was not found.");

  res.send(customer);
});


module.exports = router;
