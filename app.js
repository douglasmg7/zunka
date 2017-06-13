/* eslint no-unused-vars: 0 */
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
// log transaction
const morgan = require('morgan');
// body
const bodyParser = require('body-parser');
// db
const dbConfig = require('./bin/dbConfig');
const mongo = require('./model/db');
const ObjectId = require('mongodb').ObjectId;
// authentication
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// webpack HMR - hot module reload
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const compiler = webpack(webpackConfig);
const webpackDevMiddleware = require('webpack-dev-middleware')(compiler, {
  noInfo: false, publicPath: webpackConfig.output.publicPath, stats: {colors: true}
});
const webpackHotMiddleware = require('webpack-hot-middleware')(compiler);
// personal modules
const log = require('./bin/log');
// app must be before routes
const app = express();
// routes
const users = require('./routes/users');
const store = require('./routes/store');
const routeWsAllNations = require('./routes/wsAllNations');
const routeWsStore = require('./routes/wsStore');
const routeProducts = require('./routes/products');

// transaction log - no log in test mode.
if (app.get('env') !== 'test') {
  app.use(morgan('dev'));
}

// statics
app.use(express.static(path.join(__dirname, 'dist/')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components/')));
app.use('/semantic', express.static(path.join(__dirname, 'semantic/')));

// for cookie and json web token
app.set('secret', 'd7ga8gat3kaz0m');

// pretty in development
if (app.get('env') === 'development') {
  app.locals.pretty = true;
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Passport does not directly manage your session, it only uses the session.
// So you configure session attributes (e.g. life of your session) via express
// define which db to use.
let dbUrl = null;
app.get('env') === 'test' ? dbUrl = dbConfig.urlUnitTest : dbUrl = dbConfig.url;
var sessionOpts = {
  secret: app.get('secret'),
  resave: true, // saved new sessions
  saveUninitialized: true, // automatically write to the session store
  cookie: { maxAge: 2419200000 }, // configure when sessions expires,
  store: new MongoStore({ url: dbUrl })
};
if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sessionOpts.cookie.secure = true; // serve secure cookies
}

// webpack HMR
app.use(webpackDevMiddleware);
app.use(webpackHotMiddleware);

// body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// authentication
app.use(cookieParser(app.get('secret')));
app.use(session(sessionOpts));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(function (username, password, done) {
  log.info('LocalStrategy');
  // log.info(`username: ${username}`);
  // log.info(`password: ${password}`);
  mongo.db.collection(dbConfig.collSession).findOne({username: username}, (err, user)=>{
    // console.log(`user from db: ${JSON.stringify(user)}`);
    if (err) { console.log('passport error.'); return done(err); }
    if (!user) { console.log('not found user.'); return done(null, false, {message: 'Incorrect username.'}); }
    if (user.password !== password) { console.log('Incorrect password.'); return done(null, false, {message: 'Incorrect password.'}); }
    return done(null, user);
  });
}));
// Serialize _id to session, write _id to session.passport.user.
passport.serializeUser(function(user, done) {
  log.info('passport.serialize');
  // log.info(`user: ${JSON.stringify(user)}`);
  // log.info(`_id: ${JSON.stringify(user._id)}`);
  done(null, user._id);
});
// Deserialize from the session, use session.passport.user to find user into db.
passport.deserializeUser(function(id, done) {
  log.info('passport.deserialize');
  // log.info(`id: ${id}`);
  const _id = new ObjectId(id);
  mongo.db.collection(dbConfig.collSession).findOne({_id: _id}, (err, user)=>{
    // console.log(`user from db: ${JSON.stringify(user)}`);
    return done(err, user);
  });
});
// function authenticationMiddleware () {
//   return function (req, res, next) {
//     if (req.isAuthenticated()) {
//       return next();
//     }
//     res.redirect('/');
//   };
// }

// // webpack HMR
// app.use(webpackDevMiddleware);
// app.use(webpackHotMiddleware);

// routes
app.use('/', store);
app.use('/users', users);
// web service
app.use('/ws/allnations', routeWsAllNations);
app.use('/ws/store', routeWsStore);
// html
app.use('/products', routeProducts);

app.use(function(err, req, res, next) {
  res.status(500).send({error: 'Internal server error.'});
  // res.json(500, {ERROR: 'Internal server error.'} );
  log.error(err.stack);
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
module.exports = app;
