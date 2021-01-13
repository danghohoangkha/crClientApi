var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors')
const bodyParser = require("body-parser");
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth.routes');
const config = require("./config/auth.config");
const {query} = require("./models/querydb")
//passport
const jwt = require("jsonwebtoken");
var passport = require('passport');
var passportJWT = require('passport-jwt');
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var jwtOptions = {};


jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'hcmus-secret-key';

// lets create our strategy for web token
var strategy = new JwtStrategy(jwtOptions, async function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  // var user = getUser({ id: jwt_payload.id });
  let user = await query(`select * from users where id = ${jwt_payload.id} and state = ${1}`);
  if (user.length) {
    next(null, user[0]);
  } else {
    next(null, false);
  }
});
// use the strategy
passport.use(strategy);

var app = express();
//khoi tao passport
app.use(passport.initialize());


const port = process.env.PORT || 4001;
// var corsOptions = {
//   origin: "http://localhost:3000"
// };

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(cors())


var server = require('http').createServer(app);
var io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

require('./socket/index').runsocketapp(io);

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/', authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

server.listen(port, () => console.log(`Listening on port ${port}`));
module.exports = app;
