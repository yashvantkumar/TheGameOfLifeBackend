var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var controller = require('./controllers')
var db = require('./db')

io.on('connection', function(socket){
    //Create Game
    socket.on('create game', (data) => {
        data.unique_id = Math.floor(Math.random() * 1000);
        controller.addGame(data, (err, data) => {
            socket.join(data._id)
            socket.emit('game created', data)
            data.socket = socket.id;
            controller.storeSocketId(data)            
        })
    })
    socket.on('end game', (udata) => {
        controller.endGame(udata, (err, data) => {
            socket.broadcast.to(udata._id).emit('game ended', data)
        })
    })
    socket.on('join banker', (data) => {
        socket.join(data._id)
        data.socket = socket.id;
        controller.storeSocketId(data)
    })
    socket.on('join player', (data) => {
        console.log(socket.id)
        
        controller.getUser(data, (err, data) => {
            if(data){
                socket.join(data.game_id);
                socket.emit('room rejoined', data);
                socket.broadcast.to(data.game_id).emit('player rejoined', data)
                data.socket = socket.id;
                controller.storeSocketId(data)
            } else {
                socket.emit('No player found', {});
            }   
        })
    })
    socket.on('join game', (data) => {
        console.log('ionic:', data)
        controller.getGame(data, (err, data) => {
            socket.join(data.game_id);
            socket.emit('room joined', data);
            data.socket = socket.id;
            controller.storeSocketId(data)
            socket.broadcast.to(data.game_id).emit('player joined', data)
        })
    })
    
    socket.on('get players', (data) => {
        controller.getGamePlayers(data, (err, data) => {
            socket.emit('players', data)
        })
    })

    socket.on('get my data', (data) => {
        controller.getUser(data, (err, data) => {
            socket.emit('my data', data)
        })
    })

    socket.on('bonus card', (data) => {
        controller.bonusCards(data, io, (err, data) => {
            socket.broadcast.to(data.from.game_id).emit('bonus card response', data)
        })
    });

    socket.on('deduct', (udata) => {
        controller.deduct(udata, io, (err, data) => {

        })
    });


    socket.on('credit', (udata) => {
        controller.credit(udata, io, (err, data) => {

        })
    });

    socket.on('issue bonus card', (data) => {
        controller.issueBonusCards(data, (err, data) => {
            socket.emit('issued bonus card', data)
        })
    });

    socket.on('issue payday', (data) => {
        controller.issueSalary(data, io, (err, data) => {
            socket.emit('issued payday', data)
        })
    });

    socket.on('issue promisary note', (udata) => {
        controller.issuePromisaryCard(udata, io,  (err, data) => {
            
            socket.emit('issued promisary note', data)
        })
    });

    socket.on('set salary', (udata) => {
        controller.setSalary(udata, io, (err, data) => {
            socket.emit('salary updated', data)
        })
    });

    socket.on('add children', (udata) => {
        controller.addChildren(udata, io, (err, data) => {

            socket.emit('added children', data);
            socket.broadcast.to(data.game_id).emit('new child', {message: udata.count+" children have been added to "+data.name})            
        })
    });

    socket.on('issue insurance', (udata) => {
        controller.addInsurance(udata, io, (err, data) => {
            socket.emit('issued insurance', data);
        })
    });

    socket.on('remove insurance', (udata) => {
        controller.removeInsurance(udata, (err, data) => {
            socket.emit('removed insurance', data);
        })
    });

    socket.on('revenge', (udata) => {
        console.log('sock',udata);
        controller.revenge(udata, io, (err, data) => {
            socket.broadcast.to(data.from.game_id).emit('revenge taken', data);
        });
    });

    socket.on('luckywheel', (data) => {
        
    })
});

http.listen(2700, function(){
  console.log('listening on *:2700');
});