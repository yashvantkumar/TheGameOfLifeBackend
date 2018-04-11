var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    
  name: { type: String, required: true },
  game_id: { type: Schema.ObjectId, ref: 'Game' },
  holdings: { type: Number, required: true, default: 10000 },
  salary: { type: Number, default: 16000 },
  share_card: { type: Number, default: 0 },
  exemption_card: { type: Number, default: 0 },
  children: { type: Number, default: 0 },
  promisary_note: { type: Number, default: 0 },
  socket: {type: String},
  insurance: [{type: String}],
  updated_at: {type: Date, default: Date.now}
});



var User = mongoose.model('User', userSchema);
module.exports.User = User;