var express = require('express');
var router = express.Router();

const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");
const controllerAuth = require("../controllers/auth.controller");
const passport = require("passport");
router.get(
  "/api/getrank",
  passport.authenticate('jwt', { session: false }),
  controller.getRank
);

router.get("/api/gethistorymatch/:id",
  passport.authenticate('jwt', { session: false }),
  controller.getHistoryMatch
)
router.get(
  "/api/getUser",
  passport.authenticate('jwt', { session: false }),
  controllerAuth.getUser
)

router.get("/api/getUserWithId/:id", [passport.authenticate('jwt', { session: false })], controller.getUserWithId);

module.exports = router;
