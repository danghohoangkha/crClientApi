const shortid = require('shortid');
const ROOM = require('./room.js');
const PrivateRoom = require('./private_room.js');
// Import from Nguyen
const auth = require('./auth').auth;
const User = require('./user.js').User;
const Token = require('./user.js').Token;
const FindRoom = require('./findRoom.js').findRoom;
const HandleInRoom = require('./handleInRoom').handleInRoom;
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const { query } = require('../models/querydb.js');
const MessageClass = require('./MessageClass').MessageClass;

function runsocketapp(io) {
    var clients = 0;
    var users = [];
    const allRoomObj = {};
    const roomList = {};
    const allPrivateRoom = {};
    const quickPlayList = {};
    const allMessageObj = {};
    var chessPlayerList = [];
    var otherRoomList = {};
    var saveNewMatchHistory = {};
    var removeByAttr = function (arr, attr, value) {
        var i = arr.length;
        while (i--) {
            if (arr[i]
                && arr[i].hasOwnProperty(attr)
                && (arguments.length > 2 && arr[i][attr] === value)) {

                arr.splice(i, 1);

            }
        }
        return arr;
    }
    var deleteUplicate = (arr) => {
        let obj = {};

        for (var i = 0, len = arr.length; i < len; i++)
            obj[arr[i]['userId']] = arr[i];

        let newarr = new Array();
        for (var key in obj)
            newarr.push(obj[key]);
        return newarr;
    }

    const getVisitors = async () => {
        // return Object.keys(users).length;
        let removeDuplicate = deleteUplicate(users);
        let usernameArr = []
        for (let i = 0; i < removeDuplicate.length; i++) {
            // query lai
            // let getuser = await query(`select * from users where id = '${removeDuplicate[i].userId}'`);
            // usernameArr.push(getuser[0])
            usernameArr.push({ fullName: removeDuplicate[i].fullName, id: removeDuplicate[i].userId });
        }
        console.log(usernameArr)
        return usernameArr;
    };

    const emitVisitors = async () => {
        //console.log(users);
        io.emit("visitors", await getVisitors());//tat ca
        //nhung nguoi ngoai phong
        await emitGetusersnotinroom();
    };

    const filterUsersNotRoom = async (users) => {
        const checkUsersNotRoom = []; //cung 1 id nhieu socket trong do co 1 da vao phong
        for (let i = 0; i < users.length; i++) {
            const userNotRooms = users.filter(item => item.userId == users[i].userId && item.room.length > 0)
            if (userNotRooms.length === 0) {
                //let getuser = await query(`select * from users where id = '${users[i].userId}'`);
                //checkUsersNotRoom.push(getuser[0]);
                checkUsersNotRoom.push(users[i]);
            }
        }

        //xoa duplicate
        let removeDuplicate = deleteUplicate(checkUsersNotRoom)
        let usernameArr = []
        for (let i = 0; i < removeDuplicate.length; i++) {
            // query lai
            // let getuser = await query(`select * from users where id = '${removeDuplicate[i].userId}'`);
            // usernameArr.push(getuser[0])
            usernameArr.push({ fullName: removeDuplicate[i].fullName, id: removeDuplicate[i].userId });
        }
        return usernameArr;
    }

    const emitGetusersnotinroom = async () => {
        io.emit(`getusersnotinroom`, await filterUsersNotRoom(users))
    }

    const createRoom = (clientId, roomName, password, roomIdDefault) => {
        // check if both params are passed into
        if (typeof clientId === 'undefined' || typeof roomName === 'undefined') {
            throw new Error('Error: params are not passed into the function');
        } else {
            let roomId = roomIdDefault === null ? shortid.generate() : roomIdDefault === undefined ? shortid.generate() : roomIdDefault;
            let newRoom = new ROOM(roomId, roomName, clientId, password);
            allRoomObj[roomId] = newRoom;
            password == null ? roomList[roomId] = { roomName, isPassword: false } : roomList[roomId] = { roomName, isPassword: true };
            return roomId;
        }
    }

    const joinRoom = (clientID, roomID) => {
        if (clientID == undefined) {
            console.log("loi const joinRoom = ")
            return;
        }
        if (typeof clientID === 'undefined' || typeof roomID === 'undefined') {
            throw new Error('Error: params are not passed into the function');
        } else if (allRoomObj[roomID] === undefined) {
            throw new Error('Error: Room does not exist !!');
        } else {
            let room = allRoomObj[roomID];
            room.addClient(clientID);
        }
    }
    const leaveRoom = (clientID, roomID) => {
        if (typeof clientID === 'undefined' || typeof roomID === 'undefined') {
            throw new Error('Error: params are not passed into the function');
        } else if (allRoomObj[roomID] === undefined) {
            throw new Error('Error: Room does not exist !!');
        } else {
            let room = allRoomObj[roomID];
            room.removeClient(clientID);
        }
    }

    const deleteRoom = (clientID, roomID) => {
        if (typeof clientID === 'undefined' || typeof roomID === 'undefined') {
            throw new Error('Error: params are not passed into the function');
        } else if (allRoomObj[roomID] === undefined) {
            throw new Error('Error: Room does not exist !!');
        } else {
            // only allows the room's creator
            let roomCreator = allRoomObj[roomID].creator;
            if (clientID !== roomCreator) {
                throw new Error("Error: Only the room's creator is allowed to delete it !!");
            } else {
                delete allRoomObj[roomID];
                delete roomList[roomID];
            }
        }
    }
    const joinRoomSocket = (socket, clientId, roomId) => {
        // check if the client is already in the room
        let alreadyInRoom = allRoomObj[roomId].client.some(ele => ele === clientId);

        if (!alreadyInRoom) {
            //xoa het neu da trong phong
            // if (socket.rooms.size > 1) {
            //     const roomListId = [...socket.rooms];
            //     for (let i = 1; i < roomListId.length; i++) {
            //         leaveRoomSocket(socket, clientId, roomListId[i]);
            //     }
            // }

            joinRoom(clientId, roomId);
            let client = users.find(ele => ele.userId === clientId);
            client.room.push(roomId);
            //xoa room da join
            emitGetusersnotinroom();



            socket.join(roomId)
            // console.log(io.sockets.adapter.rooms[roomId]);
            //============================
            // emit a msg back to the sender
            socket.emit('join room', {
                clientName: socket.username,
                roomId: roomId,
                roomName: roomList[roomId].roomName
            });
        } else {
            // socket.emit('join room', {
            //     clientName: socket.username,
            //     roomId: roomId,
            //     roomName: roomList[roomId].roomName
            // });
            socket.emit('join room error', "You are already in the room!");
        }
    }
    const leaveRoomSocket = (socket, clientId, roomId) => {
        if (allRoomObj[roomId] == undefined) {
            return;
        }
        let alreadyInRoom = allRoomObj[roomId].client.some(ele => ele === clientId);
        if (alreadyInRoom) {
            leaveRoom(socket, clientId, roomId);
            let client = users.find(ele => ele.userId === clientId);
            let roomIndex = client.room.indexOf(roomId);
            //xoa room khoi client
            client.room.splice(roomIndex, 1);

            emitGetusersnotinroom();
            // new code to fix room msg events -> leave room
            // console.log(io.sockets.adapter.rooms[roomId]);;
            socket.leave(roomId)
            socket.emit('leave room', {
                clientName: socket.username,
                roomId: roomId,
                roomName: roomList[roomId].roomName
            });
        } else {
            socket.emit('leave room error', "You are not in the room!");
        }

    };
    const createRoomSocket = async (socket, roomName, clientId, password, roomIdDefault) => {
        try {
            //xoa het da tham gia phong
            // const roomListId = [...socket.rooms];

            // if (roomListId.length > 1) {

            //     for (let i = 1; i < roomListId.length; i++) {
            //         leaveRoomSocket(socket, clientId, roomListId[i]);
            //     }
            // }
            // have user info -> use clientId not socket.id
            let newRoomId = createRoom(clientId, roomName, password, roomIdDefault);

            await query(`INSERT INTO matchofchess set id = '${newRoomId}', name = '${roomName}', password = '${password}', status = 0, createdDate = '${new Date().toISOString().substring(0, 10)}'`)

            let client = users.find(ele => ele.userId === clientId);
            client.room.push(newRoomId);
            emitGetusersnotinroom();
            // emit a msg back to the sender
            socket.emit('new room', {
                clientName: socket.username,
                newRoomId: newRoomId,
                newRoomName: roomName
            });
            io.sockets.emit('update room', roomList);
            // new code to fix room msg events -> join newly created room
            //xoa join khi da tham gia phong moi



            socket.join(newRoomId)
            return newRoomId;
        } catch (err) {
            console.log(err);
            socket.emit('create room error', socket.username, err);
        }
    }
    
    io.on('connection', function (socket) {
        console.log("a user connected");
        clients++;
        FindRoom(socket, users, allRoomObj, roomList);
        HandleInRoom(socket, users, allRoomObj, roomList);
        socket.on(`getusersnotinroom`, async () => {
            await emitGetusersnotinroom();
        })
        socket.on("checkplaying", roomId => {
            if (chessPlayerList[roomId] == undefined) {
                return;
            }
            if (chessPlayerList[roomId].length >= 2) {
                users.forEach(user => {
                    if (user.userId === chessPlayerList[roomId][0].userId || user.userId === chessPlayerList[roomId][1].userId) {
                        io.to(user.socketId).emit("checkplaying", true);
                    }
                })

                //socket.emit("checkplaying", true);
            } else {
                socket.emit("checkplaying", false);
            }
        })
        socket.on('i play', async (data) => {
            let roomId = data.id, userId = data.iduser, pos = data.pos;

            if (chessPlayerList[roomId] != undefined) {
                if (chessPlayerList[roomId].indexOf(userId) !== -1)
                    return;
                if (chessPlayerList[roomId].length >= 2)
                    return;
                chessPlayerList[roomId].push({ userId: userId, pos: pos })
                //console.log(chessPlayerList[roomId]);
                if (chessPlayerList[roomId].length === 2) {
                    chessPlayerList[roomId][2] == null ? chessPlayerList[roomId].push(0) : chessPlayerList[roomId][2] = chessPlayerList[roomId][2] + 1;
                    let idclient = chessPlayerList[roomId][2] % 2;
                    console.log(idclient);

                    let datasend = {
                        player: (idclient + 1) + '',
                        position: undefined,
                        nextPlayerId : chessPlayerList[roomId][0].userId,
                        playedPlayerId: chessPlayerList[roomId][1].userId
                    };
                    //tu dong choi
                    // users.forEach((user) => {
                    //     let datasend = {
                    //         player: (idclient + 1) + '',
                    //         position: undefined,
                    //     };
                    //     if (user.userId === chessPlayerList[roomId][0].userId) {
                    //         console.log(datasend);
                    //         socket.to(user.socketId).emit('next play', datasend)
                    //     }
                    // })

                    io.to(roomId).emit('next play', datasend)
                    //bao dang choi
                    //luu 2 nguoi choi vao bang
                    await query(`update matchofchess set player1 = ${chessPlayerList[roomId][0].userId}, player2 =${chessPlayerList[roomId][1].userId} where id = '${roomId}'`);
                    io.to(roomId).emit("checkplaying", true);
                    //lay tu database
                    //let client = await query(`select * from users where id = ${userId}`)
                    //io.to(roomId).emit("i play", { user: client[0], pos: pos });
                    //console.log(chessPlayerList[roomId]);
                    return;
                }
            } else {
                let arr = [];
                arr.push({ userId: userId, pos: pos });
                chessPlayerList[roomId] = arr;
                //let client = await query(`select * from users where id = ${userId}`)
                //io.to(roomId).emit("i play", { user: client[0], pos: pos });
            }
        })

        socket.on("save new history", (data, roomId)=>{
            saveNewMatchHistory[roomId] = data;
        })

        socket.on("get new history", (roomId)=>{
            io.to(roomId).emit("get new history", saveNewMatchHistory[roomId]);
        })
        socket.on("get2playermatch", async (roomId) => {
            const arr = chessPlayerList[roomId];
            if (arr == undefined) {
                return;
            }
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].pos === 1) {
                    let clients = await query(`select * from users where id = ${arr[i].userId}`)
                    io.to(roomId).emit("get2playermatchforplayer1", clients[0]);
                } else if (arr[i].pos === 2) {
                    let clients = await query(`select * from users where id = ${arr[i].userId}`)
                    io.to(roomId).emit("get2playermatchforplayer2", clients[0]);
                }
            }
        })

        socket.on("draw", async (roomId, userId) => {
            users.forEach((user) => {
                if (user.userId === chessPlayerList[roomId][0].userId || user.userId === chessPlayerList[roomId][1].userId) {
                    socket.to(user.socketId).emit('draw')
                }
            })
        })
        //dong y hoa
        socket.on("yesDraw", async (roomId, userId) => {
            await query(`update matchofchess set status = ${1} where id = '${roomId}'`);
            //update message
            let messageData = JSON.stringify(allMessageObj[roomId]);
            //await query(`insert into chat_match set content = '${messageData}', matchId = '${roomId}' `);
            saveDatabaseAfterMatch(true, null, null, messageData, roomId)
            io.to(roomId).emit("DrawloseWin", "Trận chiến hòa");
        })

        const saveDatabaseAfterMatch = async (isdraw, userWinId, userloseId, messageData, roomId) => {
            try {
                //const player1 = chessPlayerList[roomId][0].pos == 1 ? chessPlayerList[roomId][0].userId: chessPlayerList[roomId][1].userId;
                // const player2 = chessPlayerList[roomId][0].pos == 2 ? chessPlayerList[roomId][0].userId: chessPlayerList[roomId][1].userId;
                await query(`update matchofchess set status = ${isdraw ? 1 : 2}, winner = ${userWinId} where id = '${roomId}'`);
                //update message
                // let messageData = JSON.stringify(allMessageObj[roomId]);
                try {
                    await query(`insert into chat_match set content = '${messageData}', matchId = '${roomId}' `);
                } catch (error) {
                    console.log(error);
                }
                
                if (isdraw) {
                    return;
                }
                let userlose = await query(`select * from users where id = ${userloseId}`)
                userlose = userlose[0]
                let userWin = await query(`select * from users where id = ${userWinId}`)
                userWin = userWin[0]
                //cap nhat cup win
                userWin.winMatch = userWin.winMatch + 1;
                userWin.cupCount += userWin.cupCount >= userlose.cupCount ? 1 : 2;
                userWin.level = userWin.cupCount / 10 + 1;
                await query(`update users set winMatch = ${userWin.winMatch}, cupCount = ${userWin.cupCount}, level= ${userWin.level} where id = ${userWin.id}  `)
                //cap nhat nguoi thua
                userlose.loseMatch = userlose.loseMatch + 1;
                userlose.cupCount -= userlose.cupCount > userWin.cupCount ? 2 : 1;
                userlose.cupCount = userlose.cupCount < 0 ? 0 : userlose.cupCount;
                userlose.level = userlose.cupCount / 10 + 1;
                await query(`update users set loseMatch = ${userlose.loseMatch}, cupCount = ${userlose.cupCount}, level= ${userlose.level} where id = ${userlose.id}  `)

            } catch (error) {
                console.log(error);
            }
        }
        socket.on("winnerOrDraw", async (winnerordraw, roomId) => {
            let winnerId, loseId, isDraw = false;
            if (chessPlayerList[roomId] == undefined) {
                return;
            }
            if (winnerordraw === 'X') {
                //mat dinh la chessPlayer[0] la thang danh dau tien
                winnerId = chessPlayerList[roomId][0].userId;
                loseId = chessPlayerList[roomId][1].userId;

            } else if (winnerordraw === 'O') {
                winnerId = chessPlayerList[roomId][1].userId;
                loseId = chessPlayerList[roomId][0].userId;
            } else if (winnerordraw === 'draw') {
                isDraw = true;
            }
            if (isDraw) {
                socket.emit("DrawloseWin", "Hai nguoi choi hoa");
            } else {
                let userlose = await query(`select * from users where id = ${loseId}`)
                userlose = userlose[0]
                let userWin = await query(`select * from users where id = ${winnerId}`)
                userWin = userWin[0]
                socket.emit("DrawloseWin", `Thắng là: ${userWin.fullName}, Thua là: ${userlose.fullName}`);
            }
            let messageData = JSON.stringify(allMessageObj[roomId]);
            delete chessPlayerList[roomId]
            saveDatabaseAfterMatch(isDraw, winnerId, loseId, messageData, roomId)
        })
        socket.on("lose", async (roomId, userId) => {
            await chessPlayerList[roomId].forEach(async (user) => {
                if (user.userId == undefined) {
                    return;
                }
                if (user.userId !== userId) {
                    try {

                        let messageData = JSON.stringify(allMessageObj[roomId]);
                        saveDatabaseAfterMatch(false, user.userId, userId, messageData, roomId)
                        // await query(`insert into chat_match set content = '${messageData}', matchId = '${roomId}' `);
                    } catch (error) {
                        console.log(error);
                    }
                    let userlose = await query(`select * from users where id = ${userId}`)
                    let userWin = await query(`select * from users where id = ${user.userId}`)
                    io.to(roomId).emit("DrawloseWin", `Người thắng là: ${userWin[0].fullName}, người thua là: ${userlose[0].fullName}`);
                    return true;
                }
                //return false;
            })
        })

        socket.on('next play', (data) => {
            console.log(chessPlayerList);
            try {
                if (chessPlayerList[data.roomId].length > 1) {
                    chessPlayerList[data.roomId][2] == null ? chessPlayerList[data.roomId].push(0) : chessPlayerList[data.roomId][2] = chessPlayerList[data.roomId][2] + 1;
                    let idclient = chessPlayerList[data.roomId][2] % 2;
                    console.log(idclient);
                    console.log(console.log(chessPlayerList[data.roomId]))
                    let nextPlayerId, playedPlayerId;
                    if(data.playedPlayerId === chessPlayerList[data.roomId][0].userId){
                        nextPlayerId = chessPlayerList[data.roomId][1].userId;
                        playedPlayerId = chessPlayerList[data.roomId][0].userId;
                    }else{
                        nextPlayerId = chessPlayerList[data.roomId][0].userId;
                        playedPlayerId = chessPlayerList[data.roomId][1].userId;
                    }
                    let datasend = {
                        player: (idclient + 1) + '',
                        position: data.position,
                        nextPlayerId : nextPlayerId,
                        playedPlayerId: playedPlayerId
                    };

                    // users.forEach((user) => {
                    //     let datasend = {
                    //         player: (idclient + 1) + '',
                    //         position: data.position,
                    //     };
                    //     if (user.userId === chessPlayerList[data.roomId][0].userId || user.userId === chessPlayerList[data.roomId][1].userId) {
                    //         console.log(datasend);
                    //         socket.to(user.socketId).emit('next play', datasend)
                    //     }
                    // })
                    io.to(data.roomId).emit('next play', datasend)
                }
            } catch (error) {
                console.log(error);
            }
        })
        socket.on("inviteToUser", (inviteUserId, roomId) => {
            let alreadyInRoom = allRoomObj[roomId].client.some(ele => ele === inviteUserId);

            if (!alreadyInRoom) {
                let client = users.find(ele => ele.userId === inviteUserId);

                socket.to(client.socketId).emit('inviteToUser', {
                    senderName: socket.username,
                    roomId: roomId,
                    roomName: roomList[roomId].roomName
                });
            } else {
                socket.emit('invite room error', "You are already in the room!");
            }
        })
        socket.on('acceptToRoom', (inviteUserId, roomId) => {
            joinRoomSocket(socket, inviteUserId, roomId);
            socket.emit('acceptToRoom', roomId)
        })
        socket.on('quick play', (userId) => {
            if (Object.keys(quickPlayList).length > 0) {
                const matchuser = users.find(ele => ele.userId === quickPlayList[Object.keys(quickPlayList)[0]]);
                if (matchuser) {
                    const quickRoomId = Object.keys(quickPlayList)[0];
                    socket.join(quickRoomId);
                    joinRoomSocket(socket, userId, quickRoomId);
                    io.to(quickRoomId).emit('quick play', true, quickRoomId);
                    delete quickPlayList[quickRoomId];
                }
            } else {
                let roomId = shortid.generate();
                if (Object.keys(quickPlayList).indexOf(userId) > 0) {
                    return
                }
                quickPlayList[roomId] = userId;
                createRoomSocket(socket, roomId, userId, null, roomId);

                // socket.join(roomId);
                socket.emit('quick play', false);
            }
        })

        socket.on('authenticate', (token) => {
            const existUser = users.some(user => {
                if (user.socketId === socket.id) {
                    return true;
                }
            })

            io.sockets.emit('update room', roomList);
            if (!token) {
                return ({
                    message: "No token provided!"
                });
            }
            if (existUser) {
                return;
            }
            jwt.verify(token, config.secret, (err, decoded) => {
                if (err) {
                    return {
                        message: "Unauthorized!"
                    };
                }
                socket.username = decoded.fullName;
                socket.userId = decoded.id;
                let user = new User(socket.id, decoded.id, decoded.fullName);
                users.push(user);
                emitVisitors();
                //console.log(users);
                return ({
                    message: "Thêm thành công"
                });
            });
        })

        socket.on('create room', (roomName, clientId, password) => {

            createRoomSocket(socket, roomName, clientId, password,);
        });

        socket.on('join room', (clientId, roomId, password) => {
            const roomPassword = allRoomObj[roomId].password;
            if (roomPassword == null || (roomPassword != null && roomPassword == password)) {
                joinRoomSocket(socket, clientId, roomId);
            } else {
                socket.emit('invite room error', "Mật khẩu không đúng!")
            }
        });
        socket.on('to other room', async (clientId, currentRoomId) => {
            if (otherRoomList[currentRoomId] == undefined) {
                otherRoomList[currentRoomId] = await createRoomSocket(socket, `From ${currentRoomId} To Room.`, clientId, undefined);
            } else {
                joinRoomSocket(socket, clientId, otherRoomList[currentRoomId]);
            }
            socket.emit("to other room", otherRoomList[currentRoomId])
        })
        socket.on('refreshorlink', (roomId, userId) => {
            if (allRoomObj[roomId] == undefined) {
                return;
            }
            if (allRoomObj[roomId].password != undefined) {
                const client = users.find(ele => ele.userId === userId);
                if (client === undefined) {
                    socket.emit('refreshorlink');
                }
                let checkHasJoin = false;
                for (let i = 0; i < client.room.length; i++) {
                    if (client.room[i] === roomId) {
                        checkHasJoin = true;
                        break;
                    }
                }
                if (!checkHasJoin) {
                    socket.emit('refreshorlink');
                }

            } else {
                joinRoomSocket(socket, userId, roomId);
                //join lai neu da join
                socket.join(roomId);
            }
        })
        socket.on('leave room', (clientId, roomId) => {
            if (allRoomObj[roomId] === undefined) {
                return;
            }
            let alreadyInRoom = allRoomObj[roomId].client.some(ele => ele === clientId);
            if (alreadyInRoom) {
                leaveRoom(clientId, roomId);
                let client = users.find(ele => ele.userId === clientId);
                let roomIndex = client.room.indexOf(roomId);
                client.room.splice(roomIndex, 1);

                emitGetusersnotinroom();

                // new code to fix room msg events -> leave room
                // console.log(io.sockets.adapter.rooms[roomId]);;
                socket.leave(roomId)

                socket.emit('leave room', {
                    clientName: socket.username,
                    roomId: roomId,
                    roomName: roomList[roomId].roomName
                });
            } else {
                socket.emit('leave room error', "You are not in the room!");
            }
            //xoa phong
            if (allRoomObj[roomId].quantity === 0) {
                delete allRoomObj[roomId];
                delete roomList[roomId];
            }
        });

        socket.on('delete room', (clientId, roomId) => {
            let roomName = roomList[roomId].roomName;
            try {
                deleteRoom(clientId, roomId);
                let client = user.find(ele => ele.id === clientId);
                let roomIndex = client.room.indexOf(roomId);
                client.room.splice(roomIndex, 1);
                emitGetusersnotinroom();

                // new code to fix room msg events -> delete room
                // console.log(io.sockets.adapter.rooms[roomId]);
                // remove all clients from the room
                // get array of all clients in 'roomId'
                io.in(roomId).clients(function (error, clients) {
                    if (clients.length > 0) {
                        console.log('clients in the room: ');
                        console.log(clients);
                        clients.forEach(function (socket_id) {
                            // clients leave room
                            io.sockets.sockets[socket_id].leave(roomId);
                        });
                    }
                });
                // console.log(io.sockets.adapter.rooms[roomId]);
                //============================
                // emit to all clients new roomList -> update room list
                io.sockets.emit('delete room', roomId, roomName, roomList);
            } catch (err) {
                console.log(err);
                // emit a msg back to the sender
                socket.emit('delete room error', err.message);
            }
        })

        socket.on('chat message', (data) => {
            // emit msg to clients in the room only
            let messageObj = new MessageClass(data.userId, socket.username, data.roomId, data.message);
            if (allMessageObj[data.roomId] == undefined) {
                let arr = [];
                arr.push(messageObj)
                allMessageObj[data.roomId] = arr;
            } else {
                allMessageObj[data.roomId].push(messageObj);
            }
            io.to(data.roomId).emit('chat message', {
                roomId: data.roomId,
                username: socket.username,
                message: data.message
            });
        });

        socket.on('room exist', (roomId) => {
            //let roomListArr = [...roomList];
            socket.emit("room exist", Object.keys(roomList).some((keyObject, index) => {
                if (keyObject === roomId) {
                    return true;
                }
            }));
        })
        socket.on("visitors", () => {
            emitVisitors();
        })

        socket.on("logout", () => {
            clients--;
            //xoa ra khoi user
            removeByAttr(users, 'socketId', socket.id);
            emitVisitors();
            console.log("user disconnected");
        })
        socket.on("disconnect", function () {
            clients--;
            //xoa ra khoi user
            Object.keys(quickPlayList).some((item) => {
                if (quickPlayList[item] === socket.userId) {
                    delete quickPlayList[item];
                    return true;
                }
            })
            removeByAttr(users, 'socketId', socket.id);
            emitVisitors();
            console.log("user disconnected");
        });
    });
}

exports.runsocketapp = runsocketapp;