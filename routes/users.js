const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const Fawn = require("fawn");
const auth = require("../middleware/auth");
const { User, validate } = require("../models/user");
const router = express.Router();

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(req.body, ["name", "email", "password"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  new Fawn.Task()
    .save("users", user)
    .save(
      "customers",
      { 
        user: {$ojFuture: "0._id"},
        name: user.name
      },
    )
    .run({useMongoose:true})
    .then(function(){
      const token = user.generateAuthToken();
      res
        .header("x-auth-token", token)
        .header("access-control-expose-headers","x-auth-token")
        .send(_.pick(user, ["_id", "name", "email"]));
    }).catch(function(err){
      res.status(500).send("System Error, Transaction.");
    })
});

module.exports = router;
