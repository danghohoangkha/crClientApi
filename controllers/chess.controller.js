const { query } = require("../models/querydb");
module.exports.getChessList = async function (req, res, next) {
    res.status(200).json([{ id: 1, chessName: "chess01", roomId: 1 }])
}

module.exports.saveHistoryChess = async function (req, res, next) {
    try {
      let match = await query(`select * from history_match where matchId = '${req.body.matchId}'`);
      if(match.length === 0){
        await query(`insert into history_match set matchId = '${req.body.matchId}'`);
      }
      await query(`update history_match set history = '${req.body.data}', next = '${req.body.nextType === false? 0: 1}' where matchId = '${req.body.matchId}'`);
      res.status(200).json({message: "thanh cong"});
    } catch (error) {
      res.status(500).send({ message: "loi lay user" })
    }
  }
module.exports.getHistory = async function (req,res,next){
  try{
    let dataReturn={};
    let history=await query(`Select * From history_match Where matchId = '${req.params.id}'`);
    let chat = await query(`Select * From chat_match Where matchId = '${req.params.id}'`);
    let chessInfor = await query(`Select * From matchofchess mc, users u Where mc.id = '${req.params.id}' And mc.winner = u.id`);
    let player1 = await query(`Select fullName From users Where id = '${chessInfor[0].player1}'`)
    let player2 = await query(`Select fullName From users Where id = '${chessInfor[0].player2}'`)
    dataReturn['history']=history[0];
    dataReturn['chat']=chat[0]===undefined?[]:chat[0]
    dataReturn['chessInfor']=chessInfor[0]===undefined?[]:chessInfor[0]
    dataReturn['player1']=player1[0]
    dataReturn['player2']=player2[0]
    res.status(200).json(dataReturn);
  }catch(error){
    console.log(error);
    res.status(500).send({message:"error"});
  }
}

module.exports.getmatchofchess = async function(req, res, next){
  try {
    let MatchChess = await query(`Select * From matchofchess Where id = '${req.params.id}'`);
    res.status(200).json(MatchChess[0]);
  } catch (error) {
    res.status(500).send({message:"error"});
  }
}