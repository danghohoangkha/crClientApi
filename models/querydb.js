const util = require('util');
const config = require("../config/db.config.js");
require('dotenv').config();
const mysql = require("mysql");
const db = mysql.createConnection({
    host: "freedb.tech",
    user: "freedbtech_carowebnangcao",
    password: "caro482509528",
    database: "freedbtech_caro",
    // host: "localhost",
    // user: "root",
    // password: "nthung",
    // database: "testdb",
});
db.connect((err) => {

    if (err) {
        throw err;
    }
    console.log('Mysql Connected')
})
let query = util.promisify(db.query).bind(db);

module.exports.query = query;