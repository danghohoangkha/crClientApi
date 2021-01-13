class MessageClass {
	constructor(userid, fullName, roomId, message){
		this.userId = userid;
		this.fullName = fullName;
		this.message = message; 
		this.room = roomId; 
	}
}

module.exports.MessageClass = MessageClass;