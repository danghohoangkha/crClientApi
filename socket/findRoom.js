function findRoom(socket, users, allRoomObj, roomList) {
    socket.on(`findroom`, (roomId, password) => {
        if (allRoomObj[roomId] == null) {
            socket.emit(`findroom`, { find: false });
        } else {
            if (allRoomObj[roomId].password == null) {
                socket.emit(`findroom`, { find: true, isPassword: false })
            } else {
                if (allRoomObj[roomId].password === password) {
                    socket.emit(`findroom`, { find: true, isPassword: false })
                }
                else {
                    socket.emit(`findroom`, { find: true, isPassword: true })
                }

            }
        }
    })
}

exports.findRoom = findRoom;