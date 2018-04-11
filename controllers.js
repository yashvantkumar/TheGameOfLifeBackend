let async = require('async')
let service = require('./service')
var mongoose = require('mongoose');

let addGame = (data, callback) => {
    service.addGame(data, callback)
};

let getGame = (data, callback) => {
    async.waterfall([
        (cb) => {
            if(data && data.unique_id){
                let criteria = {
                    unique_id: data.unique_id
                }
                service.getGame(criteria, {}, {}, cb)
            }else{
                callback()
            }
        }, 
        (game, cb) =>{
            data = {
                name: data.name,
                game_id: game._id
            }
            service.addUser(data, cb)
        }
    ], (err, data) => {
        if(err){
            callback(err)
        }
        callback(null, data)
    })
    
}

let getGamePlayers = (data, callback) => {
    let criteria = {
        game_id: mongoose.Types.ObjectId(data.game_id)
    }
    service.getUsers(criteria, {}, {}, (err, data) => {
        callback(err, data)
    })
}

let getUser = (data, callback) => {
    let criteria = {
        _id: mongoose.Types.ObjectId(data._id)
    }
    service.getUser(criteria, {}, {}, (err, data) => {
        callback(err, data)
    })
}

let bonusCards = (data, io, callback) => {
    async.waterfall([
        (cb) => {
            //by
            let criteria = {
                _id: mongoose.Types.ObjectId(data.from)
            }
            service.getUser(criteria, {}, {}, (err, data) => {
                if(err){
                    cb(err)
                }
                cb(null, data)
            })
        },
        (from, cb) => {
            //by
            let criteria = {
                _id: mongoose.Types.ObjectId(data.to)
            }
            service.getUser(criteria, {}, {}, (err, data) => {
                if(err){
                    cb(err)
                }
                cb(null, from, data)
            })
        },
        (from, to, cb) => {
            if(data.event == 'share'){
                if(from.share_card > 0){
                    let data = {
                        share_card: from.share_card - 1
                    }
                    service.updateUser({_id: from._id}, data, (err, data) => {
                        if(to.socket && io.sockets.connected[to.socket]){
                            io.sockets.connected[to.socket].emit('shared card', from.name+" wants to share wealth with you.");
                        }  
                        cb(null, {from: from, to: to, reply:'share', message: from.name+" wants to share wealth with "+to.name })                    
                    })
                }else{
                    cb(null, {from: from, to: null, reply:'share', message: "You dont have any share a wealth cards."})                    
                }
            }else{
                if(from.exemption_card > 0){
                    let data = {
                        exemption_card: from.exemption_card - 1
                    }
                    service.updateUser({_id: from._id}, data, (err, data) => {
                        cb(null, {from: from, to: to, reply:'exemption', message: from.name+" used exemption card" })                    
                    })
                }else{
                    cb(null, {from: from, to: null, reply:'exemption', message: "You dont have any exemption cards."})                    
                }
            }
        }
    ], (err, data) => {
        callback(err, data)
    })
}

let issueBonusCards = (data, callback) => {
    
    let criteria = {
        _id: mongoose.Types.ObjectId(data._id)
    }
    service.getUser(criteria, {}, {}, (err, data) => {
        let rand = Math.floor(Math.random() * 10);
        let update = {
            
        }
        if(rand%2 == 0){
            update.share_card = data.share_card + 1
        }else{
            update.exemption_card = data.exemption_card + 1
        }
        service.updateUser(criteria, update, (err, data) => {
            data.message = "Card Issued";
            callback(err, data)
        })
        
    })
}
let issueSalary = (data, io, callback) => {
    
    let criteria = {
        _id: mongoose.Types.ObjectId(data._id)
    }
    service.getUser(criteria, {}, {}, (err, data) => {
        let update = {
            holdings: data.salary + data.holdings
        }
        let ud = data;
        
        service.updateUser(criteria, update, (err, data) => {
            data.message = "Salary Issued";
            if(ud.socket && io.sockets.connected[ud.socket]){
                io.sockets.connected[ud.socket].emit('issued payday', 'Payday added');                            
            }
            callback(err, data)
        })
        
    })
}

let addChildren = (userdata, io, callback) => {
    let users = 0;
    async.waterfall([
        (cb) => {
            let criteria = {
                _id: mongoose.Types.ObjectId(userdata._id)
            }
            service.getUser(criteria, {}, {}, cb);
        },
        (udata, cb) => {
            service.getUsers({game_id: udata.game_id}, {}, {}, (err, d) => {
                
                users = d.length;
                d.forEach(element => {
                    let update = {
                        holdings: element.holdings - (1000 * parseInt(userdata.count))
                    }
                    let c = {
                        _id: mongoose.Types.ObjectId(element._id)
                    }
                    service.updateUser(c, update, (err, data) => {
                        if(element.socket && io.sockets.connected[element.socket] && udata._id.toString() != element._id.toString()){
                            io.sockets.connected[element.socket].emit('children update', (1000 * parseInt(userdata.count))+' has been deducted from your account');                            
                        }
                    });
                });
                cb(null, udata)
                
            })
        },
        (udata, cb) => {
            let criteria = {
                _id: mongoose.Types.ObjectId(userdata._id)
            }
            let update = {
                children: udata.children + parseInt(userdata.count),
                holdings: udata.holdings + ((1000 * users) * parseInt(userdata.count))
            }

            service.updateUser(criteria, update, (err, data) => {
                if(udata.socket && io.sockets.connected[udata.socket])
                    io.sockets.connected[udata.socket].emit('children update', (((1000 * users) * parseInt(userdata.count)) - (1000 * parseInt(userdata.count)))+' has been added to your account');
                
                cb(err, udata)
            })
        }
       
    ],(err, data) => {
        callback(err, data)
    })
    
}

let issuePromisaryCard = (userdata, io, callback) => {

    let criteria = {
        _id: mongoose.Types.ObjectId(userdata._id)
    }
    service.getUser(criteria, {}, {}, (err, data) => {
        let update = {
            promisary_note: data.promisary_note + parseInt(userdata.count),
            holdings: data.holdings + (20000 * parseInt(userdata.count))
        }
        let udata = data;
        
        service.updateUser(criteria, update, (err, data) => {
            data.message = "Promisary notes issued.";  
            if(udata.socket && io.sockets.connected[udata.socket]){
                io.sockets.connected[udata.socket].emit('issued promisary note', userdata.count+" Promisary notes issued");
            }  
            callback(err, data)
        })
        
    })
    
}
let returnPromisaryCard = (userdata, callback) => {
    
    let criteria = {
        _id: mongoose.Types.ObjectId(userdata._id)
    }
    service.getUser(criteria, {}, {}, (err, data) => {

        let total = userdata.promisary_note * 25000;
        if(data.holdings > total){
            let update = {
                promisary_note: data.promisary_note - userdata.promisary_note,
                holdings: data.holdings - total
            }
            
            service.updateUser(criteria, update, (err, data) => {
            data.message = "Loan amount credited by "+data.name+" : "+total;            
                
                callback(err, data)
            })
        }else{

        }
        
        
    })
}
let addInsurance = (userdata, io, callback) => {
    let ded = 0;
    if(userdata.insurance == 'Auto Insurance'){
        ded = 1000;
    }else if(userdata.insurance == 'Stock'){
        ded = 50000;
    }else if(userdata.insurance == 'Life Insurance'){
        ded = 8000;
    }else{
        ded = 10000;
    }

    let criteria = {
        _id: mongoose.Types.ObjectId(userdata._id)
    }
    service.getUser(criteria, {}, {}, (err, data) => {

        
        let update = {
            $push:{
                insurance: userdata.insurance
            },
            holdings: data.holdings - ded 
        }
        service.updateUser(criteria, update, (err, data) => {
            data.message = "Insurance issued.";  
            if(data.socket && io.sockets.connected[data.socket]){
                io.sockets.connected[data.socket].emit('issued insurance', userdata.insurance+ ' added');
            }            
            callback(err, data)
        })
    })
};

let removeInsurance = (userdata, callback) => {
    
    let criteria = {
        _id: mongoose.Types.ObjectId(userdata._id)
    }
    let update = {
        $pull:{
            insurance: userdata.insurance
        }
    }
    service.updateUser(criteria, update, (err, data) => {
        data.message = "Insurance removed.";            
        callback(err, data)
    })
};

let endGame = (userdata, callback) => {
    let criteria = {
        _id: mongoose.Types.ObjectId(userdata._id)
    }
    let update = {
        active: false
    }
    service.updateGame(criteria, update, (err, data) => {
        data.message = "Game Ended";    
        callback(err, data)
    })
}

let setSalary = (userdata, io, callback) => {
    let criteria = {
        _id: mongoose.Types.ObjectId(userdata._id)
    }
    let update = {
        salary: parseInt(userdata.salary)
    }
    service.updateUser(criteria, update, (err, data) => {
        data.message = "Salary updated";  
        if(data.socket && io.sockets.connected[data.socket]){
            io.sockets.connected[data.socket].emit('salary updated', 'Your salaray has been revised to '+parseInt(userdata.salary));
        }          
        callback(err, data)
    })
}

let storeSocketId = (userdata) => {
    let criteria = {
        _id: mongoose.Types.ObjectId(userdata._id)
    }
    let update = {
        socket: userdata.socket
    }
    service.updateUser(criteria, update, (err, data) => {
        // callback(err, data)
    })
}

let deduct = (userdata, io, callback) => {
    async.waterfall([
        (cb) => {
            let criteria = {
                _id: mongoose.Types.ObjectId(userdata._id)
            }
            service.getUser(criteria, {}, {}, cb);
        },
        (udata, cb) => {
            if(udata.holdings > userdata.value){
                let criteria = {
                    _id: mongoose.Types.ObjectId(userdata._id)
                }
                let update = {
                    holdings: udata.holdings - userdata.value
                }
                service.updateUser(criteria, update, (err, data) => {
                    data.message = "Amount Deducted";  
                    if(udata.socket && io.sockets.connected[udata.socket]){
                        io.sockets.connected[udata.socket].emit('deducted', userdata.value+" has been deducted from your account");
                    }  
                    cb(err, data)
                })
            }else{
                data.message = "No Money. Please sanction promissary notes before deduction.";
                cb(null, data)
            }
        }
    ],(err, data) => {
        callback(err, data)
    });
    
}

let credit = (userdata, io, callback) => {

    async.waterfall([
        (cb) => {
            let criteria = {
                _id: mongoose.Types.ObjectId(userdata._id)
            }
            service.getUser(criteria, {}, {}, cb);
        },
        (udata, cb) => {
            let criteria = {
                _id: mongoose.Types.ObjectId(userdata._id)
            }
            let update = {
                holdings: udata.holdings + parseInt(userdata.value)
            }
            service.updateUser(criteria, update, (err, data) => {
                data.message = "Amount Credited";  
                if(udata.socket && io.sockets.connected[udata.socket]){
                    io.sockets.connected[udata.socket].emit('credited', userdata.value+" has been credited to your account");
                }  
                cb(err, data)
            })
        }
    ],(err, data) => {
        callback(err, data)
    });
    
}

let revenge = (data, io, callback) => {
    console.log(data);
    async.waterfall([
        (cb) => {
            let criteria = {
                _id: mongoose.Types.ObjectId(data.from)
            };
            service.getUser(criteria, {}, {}, (err, udata) => {
                if(err) {
                    cb(err);
                } else {
                    cb(null, udata);
                }
            });
        },
        (from, cb) => {
            let criteria = {
                _id: mongoose.Types.ObjectId(data.to)
            };
            service.getUser(criteria, {}, {}, (err, data) => {
                if(err){
                    cb(err)
                }
                else {
                    cb(null, from, data)
                }
            });
        },
        (from, to, cb) => {
            if(to.holdings > 200000){
                let data = {
                    holdings: parseInt(to.holdings - 200000) 
                }
                let criteria = {
                    _id: mongoose.Types.ObjectId(to._id)
                }
                console.log('holdings',data);
                service.updateUser(criteria, data, (err, rdata) => {
                    if(err) {

                        cb(err)
                    } else {
                        if(to.socket && io.sockets.connected[to.socket]){
                            io.sockets.connected[to.socket].emit('revenge taken', "200000 has been deducted from your account.");
                        }
                        cb(null, from, true)
                        // cb(null, {from: from, to: to, reply:'revenge', message: from.name+" wants to share wealth with "+to.name })                    
                    }
                })
            } else {
                if(to.socket && io.sockets.connected[to.socket]){
                    io.sockets.connected[to.socket].emit('revenge taken', "Please move 15 steps back.");
                }  
                cb(null, {from: from, to: to, reply:'revenge', message: "The player does not have enough holdings move back 15 places."})  
            }
        },
        (from, deducted, cb) => {
            console.log('from',from)
            if(deducted){
                let data = {
                    holdings: parseInt(from.holdings + 200000)
                }
                let criteria = {
                    _id: mongoose.Types.ObjectId(from._id)
                }
                console.log('000000',data, criteria);
                service.updateUser(criteria, data, (err, rdata) => {
                    if(err) {
                        cb(err)
                    } else {
                        if(from.socket && io.sockets.connected[from.socket]){
                            io.sockets.connected[from.socket].emit('revenge taken', "200000 has been added to your account.");
                        }
                        cb(null, from, true)
                        // cb(null, {from: from, to: to, reply:'revenge', message: from.name+" wants to share wealth with "+to.name })                    
                    }
                })
            }else{
                if(from.socket && io.sockets.connected[from.socket]){
                    io.sockets.connected[from.socket].emit('revenge taken', "Player will move 15 steps back.");
                }
                cb()
            }
        }
    ]), (err, data) => {
        callback(err, data); 
    }
};


module.exports = {
    addGame, getGame, getGamePlayers, endGame, setSalary, storeSocketId, deduct, credit,
    getUser, bonusCards, issueBonusCards, issueSalary, issuePromisaryCard, addChildren, 
    addInsurance, removeInsurance, revenge
}