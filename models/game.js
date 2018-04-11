var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameSchema = new Schema({
  name: { type: String, required: true },
  banker_name: { type: String, required: true },
  unique_id : {type: Number, default: 0},
  active: {type: Boolean, default: true},
  created_at: {type: Date, default: Date.now}
});



var Game = mongoose.model('Game', GameSchema);
module.exports.Game = Game;