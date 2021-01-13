module.exports.getRoomList =async function (req, res, next){
    res.status(200).json([{id: 1, roomName: "Phong01"}])
}