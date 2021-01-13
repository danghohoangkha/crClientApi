var express = require('express');
var router = express.Router();
const roomcontroller = require("./../controllers/room.controller");
const chessController = require("./../controllers/chess.controller");
const passport = require("passport");
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/getroomlilst',[passport.authenticate('jwt', { session: false })], roomcontroller.getRoomList);

router.get("/api/getchessRomm/:id", chessController.getChessList);

router.post("/api/nextplay/:id", chessController.saveHistoryChess);

router.get("/api/matchhistory/:id",[passport.authenticate('jwt', { session: false })], chessController.getHistory)

router.get("/api/getmatchofchess/:id",[passport.authenticate('jwt', { session: false })], chessController.getmatchofchess);
module.exports = router;
