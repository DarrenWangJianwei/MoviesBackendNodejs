const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');

module.exports = function() {

  const db = config.get('db');
  mongoose.connect(db,{
    socketTimeoutMS: 0,
    keepAlive: true,
    reconnectTries: 30
  })
    .then(() => {winston.info(`Connected to ${db}...`)});
}
