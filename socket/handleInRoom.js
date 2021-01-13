function handleInRoom(socket, users, allRoomObj, roomList) {
    const deleteUplicate = (arr) => {
        let obj = {};

        for (var i = 0, len = arr.length; i < len; i++)
            obj[arr[i]['userId']] = arr[i];

        let newarr = new Array();
        for (var key in obj)
            newarr.push(obj[key]);
        return newarr;
    }

    
}

exports.handleInRoom = handleInRoom;