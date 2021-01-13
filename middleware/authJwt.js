const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const { query } = require("../models/querydb");
verifyToken = (req, res, next) => {
  // let token = req.headers["Authorization"];
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

isUser = async (req, res, next) => {
  const user = await query(`select * from users, user_roles, roles where users.id = userId and roles.id = roles.id and users.id = ${req.userId} and roles.name = 'user'`)
  if (user.length > 0) {
    next();
    return;
  } else {
    res.status(403).send({
      message: "Require Admin Role!"
    });
    return;
  }
};

const authJwt = {
  verifyToken: verifyToken,
  isUser: isUser,
};
module.exports = authJwt;
