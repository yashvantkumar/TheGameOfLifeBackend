var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = new Schema({
  game_id: { type: Schema.ObjectId, ref: 'Game' },
  message: {type: String},    
  created_at: {type: Date, default: Date.now}
});



var Notification = mongoose.model('Notification', NotificationSchema);
module.exports.Notification = Notification;