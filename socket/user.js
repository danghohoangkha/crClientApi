
class User {
	constructor(id, userid, fullName){
		this.socketId = id; // unique id stays the same for one account regardless of socket.id
		this.userId = userid;
		this.fullName = fullName;
		//this.password = pwd;
		this.friend = {}; // each key-value pair is friendId: privateRoomId, stores all private rooms that the user joins
		this.room = []; // all public rooms they are in
	}
}

class Token{
	constructor(id, token){
		this.id = id;
		this.token = token;
	}
}

module.exports.User = User;
module.exports.Token = Token;