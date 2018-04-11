'use strict'

var Models = require("./models")

var addGame = function(data, callback) {
    Models.Game.Game(data).save(callback)
}

var addUser = function(data, callback) {
    Models.User.User(data).save(callback)
}

var getGame = function(criteria, projection, options, callback) {
    Models.Game.Game.findOne(criteria, projection, options, callback);
};

var updateGame = function(criteria, data, callback) {
    Models.Game.Game.update(criteria, data, callback);
};

var getUser = function(criteria, projection, options, callback) {
    Models.User.User.findOne(criteria, projection, options, callback);
};

var getUsers = function(criteria, projection, options, callback) {
    Models.User.User.find(criteria, projection, options, callback);
};

var updateUser = function(criteria, data, callback) {
    Models.User.User.findOneAndUpdate(criteria, data, {}, callback);
};

var asyncUpdateUser = function(criteria, data) {
    Models.User.User.update(criteria, data);
};

module.exports = {
    addGame,addUser, getGame, getUser, getUsers, updateUser, asyncUpdateUser, updateGame
}