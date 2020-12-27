const winston = require("winston");
const express = require("express");
const config = require("config");
const Fawn = require("fawn");
const mongoose = require("mongoose");
const app = express();

require("./startup/logging")();
require("./startup/cors")(app);
require("./startup/routes")(app);
require("./startup/db")();
require("./startup/config")();
require("./startup/validation")();

Fawn.init(mongoose);
const port = process.env.PORT || config.get("port");
const server = app.listen(port, () =>
  winston.info(`Listening on port ${port}...`)
);

module.exports = server;
