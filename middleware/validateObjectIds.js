const mongoose = require('mongoose');

module.exports = function(req, res, next) {
  for(id in req.params){
    if (!mongoose.Types.ObjectId.isValid(req.params[id]))
        return res.status(404).send('Invalid ID.'+id);
  }
  next();
}
