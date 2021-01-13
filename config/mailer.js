const nodemailer = require('nodemailer');
require('dotenv').config();
const transport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.usermailer,
    pass: process.env.passmailer
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports = {
  sendEmail(from, to, subject, html) {
    return new Promise((resolve, reject) => {
      transport.sendMail({ from, subject, to, html }, (err, info) => {
        if (err) {
          reject(err);
        }
        console.log('Email sent: ');
        resolve(info);
      });
    });
  }
}