var express = require('express');
var router = express.Router();

const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth.controller");

router.post(
    "/api/auth/signup",
    [
        //verifySignUp.checkDuplicateEmail,
        
    ],// verifySignUp.checkRolesExisted
    controller.signup
);

router.get("/auth/verify/:id", controller.verify);

router.post("/api/auth/forgotpassword", controller.forgotpasswordpost);

router.get("/auth/forgotpasswordverify/:id", controller.forgotpasswordverify);

router.post("/api/auth/signin", controller.signin);

router.post("/api/auth/signingoogle", controller.verifyTokenGoogle);

router.post("/api/auth/signinfacebook", controller.verifyTokenFacebook);

module.exports = router