const { query } = require("../models/querydb");

exports.getRank = async (req, res, next) => {
  try {
    let topRank = await query(`select fullName, cupCount from users, user_roles where roleId = 1 and id = userId ORDER BY cupCount DESC`);
    res.status(200).json(topRank.slice(0,10));
  } catch (error) {
    
  }
}
exports.getHistoryMatch = async (req, res, next) => {
  try {
    let historyMatch = await query(`select * from matchofchess where player1 = ${req.params.id} or player2 = ${req.params.id}`);
    res.status(200).json(historyMatch);
  } catch (error) {
    res.status(500).json({message: "loi"})
  }
}
exports.getUserWithId = async(req, res, next)=>{
  try {
    let user = await query(`select * from users where id = ${req.params.id}`);
    user = user[0];
    user["rating"] = Math.round(user.winMatch/(user.winMatch + user.drawMatch + user.loseMatch) * 100);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({message: "loi"})
  }
}