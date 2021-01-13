const { query } = require("../models/querydb");


checkDuplicateEmail = async (req, res, next) => {
  try {
    //email
    user = await query(`select * from users where email = '${req.body.email}'`)
    if (user.length) {
      res.status(200).send({
        message: "Failed! Email is already in use!"
      });
      return;
    }
    next();
  } catch (error) {
    console.log(error)
  }
};


const verifySignUp = {
  checkDuplicateEmail: checkDuplicateEmail,
  // checkRolesExisted: checkRolesExisted
};

module.exports = verifySignUp;
