const { query } = require("../models/querydb");
const config = require("../config/auth.config");
var mailer = require('../config/mailer')
require('dotenv').config();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const randomstring = require("randomstring")

module.exports.getUser = async function (req, res, next) {
  try {
    //let user = await query(`select * from users where id = ${req.userId}`);
    //user = user[0];
    let user = req.user;
    user["rating"] = Math.round(user.winMatch/(user.winMatch + user.drawMatch + user.loseMatch) * 100);
    res.status(200).send(user)
  } catch (error) {
    res.status(500).send({ message: "loi lay user" })
  }
}
module.exports.signup = async function (req, res, next) {
  try {
    let data = await query('SELECT * FROM users WHERE email=?', [req.body.email]);
    if (data.length === 0) {
      const secretToken = randomstring.generate();
      let user = await query(`insert into users set fullName = '${req.body.name}', email = '${req.body.email}', password= '${bcrypt.hashSync(req.body.password, 8)}', state = ${false}, secretToken = '${secretToken}' , createdDate = '${new Date().toISOString().substring(0,10)}'`)
      await query(`insert into user_roles set userId = ${parseInt(user.insertId)}, roleId = ${1}`);
      const html = `Xin chào ${req.body.name},
        <br/>
        Cảm ơn bạn đã đăng ký!
        <br/><br/>
        Vui lòng nhấp vào link để verify your email.
        <br/>
        Link: <b>${process.env.urlwebsite}verify/${secretToken}</b>
        <br/>
        <br/><br/>
        Chúc bạn thành công`
      await mailer.sendEmail(process.env.usermailer, req.body.email, 'Please verify your email!', html);

      return res.status(200).json({ message: "Successfully", secretToken: secretToken });
    }
    else {
      return res.status(200).json({ message: "Email is exist!" });
    }
  } catch (error) {
    res.status(200).json({ message: "error" });
  }
};

module.exports.verify = async function (req, res, next) {
  try {
    const secretToken = req.params.id;

    const user = await query(`select * from users where secretToken = '${secretToken}'`);

    if (user.length === 0) {
      res.status(401).json({ message: "Loi Token verify" });
      return;
    }

    await query(`update users set state = ${true}, secretToken = ''`)

    res.status(200).json({ message: 'verify thanh cong' })
  } catch (error) {
    next(error);
  }
}

module.exports.forgotpasswordpost = async function (req, res, next) {
  try {

    const email = req.body.email;

    const user = await query(`select * from users where email = '${email}'`)

    if (user.length === 0) {
      return res.status(200).json({message: "Email không tồn tại"})
    }

    secretToken = randomstring.generate();

    await query(`update users set secretToken = '${secretToken}' where email = '${email}'`)

    const html = `Xin chào ${user.username},
    <br/>
    Bạn đã lấy lại mật khẩu thành công!
    <br/><br/>
    Mật khẩu của bạn là: 123456
    <br/>
    <b>Vui lòng nhấn vào link để hoàn tất quá trình đổi mật khẩu</b>
    <br/>
    Link : <b>${process.env.urlwebsite}resetPassword/${secretToken}</b>
    <br/>
    <p>Vui lòng đổi mật khẩu sau khi hoàn tất</p>
    <br/><br/>
    Chúc bạn thành công`
    await mailer.sendEmail(process.env.usermailer, email, 'Đổi mật khẩu!', html);

    res.status(200).json({ message: "Vui lòng kiểm tra email để xác nhận đổi mật khẩu" })
  } catch (err) {
    res.status(500).json({ "error": "Loi doi mat khau" });
  }
}

module.exports.forgotpasswordverify = async function (req, res, next) {
  try {
    const updateUser = await query(`update users set password = '${bcrypt.hashSync("123456", bcrypt.genSaltSync(8))}', secretToken = "" where secretToken = '${req.params.id}'`)
    // var user = await query(`select * from users where id = ${updateUser}`);
    res.status(200).json({'message': "Thay đổi mật khẩu thành công"});
  } catch (err) {
    next(err);
  }
}

exports.signin = async (req, res) => {
  try {
    let user = await query(`select * from users where email = '${req.body.email}'`)

    if (user.length === 0) {
      return res.status(404).send({ message: "User Not found." });
    }

    if(user[0].state == 0){
      return res.status(200).send({ message: "Vui lòng active tài khoản" });
    }
    user = user[0];
    let passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Invalid Password!"
      });
    }

    let token = jwt.sign({ id: user.id, fullName: user.fullName }, config.secret, {
      expiresIn: 86400 // 24 hours
    });

    // let authorities = [];

    let rolelist = await query(`select name from users, user_roles, roles as r where users.id = userId and r.id = roleId and users.id = ${user.id} and r.name = 'user'`)

    if (rolelist.length === 0) {
      return res.status(404).send({ message: "Account is not user" });
    }
    res.status(200).send({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      // roles: rolelist,list
      accessToken: token
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
async function createUser(fullName, email, password, type = 0) {
  let user = await query(`insert into users set fullName = '${fullName}', email = '${email}', password= '${bcrypt.hashSync(password, 8)}'`)
  await query(`insert into user_roles set userId = ${parseInt(user.insertId)}, roleId = ${1}`);
  return user;

}
function guidGenerator() {
  let S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
async function findOrCreateUser(email, name) {
  let data = await query(`select * from users where email = '${email}'`);
  if (data.length == 0) {
    let randPass = guidGenerator();
    let createdData = await createUser(name, email, randPass, 0)
    if (createdData) {
      data = await query(`select * from users where id = ${createdData.insertId}`)
    }
  }
  return data[0];
}

exports.verifyTokenGoogle = async (req, res, next) => {
  try {
    const { tokenId } = req.body;
    const googleData = await axios.get('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + tokenId);

    if (googleData.status === 200) {
      const user = await findOrCreateUser(googleData.data.email, googleData.data.name);
      if(user.state == 0){
        return res.status(200).send({ message: "Vui lòng active tài khoản" });
      }
      const payload = { id: user.id, fullName: user.fullName };
      const token = jwt.sign(payload, config.secret);
      res.status(200).json({ token: token })
    }
  } catch (error) {
    res.status(401).json({ message: "Lỗi xác thực" })
  }
}

exports.verifyTokenFacebook = async (req, res, next) => {
  try {
    const { fbObject } = req.body;

    if (fbObject.userID) {
      let facebookData = await axios.get(`https://graph.facebook.com/${fbObject.userID}?fields=id,name,email&access_token=${fbObject.accessToken}`)
      if (facebookData.status === 200) {
        const user = await findOrCreateUser(facebookData.data.email, facebookData.data.name);
        if(user.state == 0){
          return res.status(200).send({ message: "Vui lòng active tài khoản" });
        }
        const payload = { id: user.id, fullName: user.fullName };
        const token = jwt.sign(payload, config.secret);
        return res.status(200).json({ token: token })
      } else {
        return res.status(400).json({ message: "Lỗi đăng nhập facebook" });
      }
    }
  } catch (error) {
    res.status(401).json({ message: "Lỗi xác thực" })
  }
}