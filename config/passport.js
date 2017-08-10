'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const redis = require('../model/redis');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// My moudles.
const log = require('../bin/log');

// Transporter object using the default SMTP transport.
let transporter = nodemailer.createTransport({
    host: 'smtps.dialhost.com.br',
    port: 587,
    // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'dev@zunka.com.br',
        pass: 'SergioMiranda1'
    }
});

// How to save user on the session.
passport.serializeUser(function(user, done) {
  log.info('passport.serialize');
  done(null, user.email);
});

// Use the user saved in the session to retrive the data.
passport.deserializeUser(function(id, done) {
  log.info('passport.deserialize');
  // log.info('id: ', id);
  redis.get(`user:${id}`, (err, value)=>{
    // log.info('user: ', value);
    done(null, JSON.parse(value));
  });
});

// Signup.
passport.use('local.signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, email, password, done){
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.checkBody('password', 'Senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
  req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.checkBody('password', 'Senha e confirmação da senha devem ser iguais').equals(req.body.passwordConfirm);
  req.checkBody('name', 'Nome inválido.').isLength({min: 1, max: 40});
  req.checkBody('cpf', 'Campo cpf deve ser preenchido.').notEmpty();
  req.checkBody('cpf', 'Cpf inválido.').isCpf();
  req.checkBody('birthday', 'Data de nacimento inválida.').isDate();
  req.checkBody('phone', 'Campo telefone deve ser preenchido.').notEmpty();
  req.checkBody('phone', 'Telefone inválido.').isLength({min: 14, max: 16});
  req.sanitizeBody("email").normalizeEmail();
  req.sanitizeBody('name').escape().trim();
  req.sanitizeBody('birthday').toDate();
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return done(null, false, req.flash('error', messages));
    }    
    // Verify if user exist.
    redis.get(`user:${req.body.email}`, (err, redisUser)=>{
      if (err) { return done(err, { message: 'Internal error.'} ); }
      if (redisUser) { return done(null, false, { message: 'E-mail já cadastrado.' }); }
      // Create user.
      const cryptPassword = bcrypt.hashSync(req.body.password.trim(), bcrypt.genSaltSync(5), null);
      const newUser = {
        email: req.body.email,
        password: cryptPassword,
        name: req.body.name,
        cpf: req.body.cpf,
        birthday: req.body.birthday,
        phone: [req.body.phone],
        group: 'client',
        status: 'active'
      };        
      // Create a radom key.
      crypto.randomBytes(20, function(err, buf) {
        if (err) { 
          log.error(err, new Error().stack);
          return done(err, false, { message: 'Serviço indisponível.'});
        }
        var token = buf.toString('hex');
        // Create temp user disponible for 2 horas (2 x 60 x 60 = 7200).
        redis.setex(`user:${token}`, 7200, JSON.stringify(newUser), err=>{
          if (err) { 
            log.error(err, new Error().stack);
            return done(err, false, { message: 'Serviço indisponível.'});
          }
          let mailOptions = {
                from: 'dev@zunka.com.br',
                to: req.body.email,
                subject: 'Solicitação de criação de conta no site da Zunka.',
                text: 'Você recebeu este e-mail porquê você (ou alguem) requisitou a criação de uma conta no site da Zunka usando este e-mail.\n\n' + 
                      'Por favor click no link, ou cole no seu navegador de internet para confirmar a criação da conta.\n\n' + 
                      'https://' + req.headers.host + '/users/login/' + token + '\n\n' +
                      'Se não foi você que requisitou esta criação de conta, por favor ignore este e-mail e nenhuma conta será criada.'
          }; 
          transporter.sendMail(mailOptions, function(err, info){
            if(err){
              log.error(err, new Error().stack);
            } else {
              log.info("mail send successfully");
            }
          }); 
          req.flash('success', `Foi enviado um e-mail para ${req.body.email} com instruções para completar o cadastro.`);
          done(null, newUser);
        });
      });
    });
  });
}));

// Signin.
passport.use('local.signin', new LocalStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true }, function (req, email, password, done) {
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return done(null, false, req.flash('error', messages));
    }    
    redis.get(`user:${req.body.email}`, (err, strUser)=>{
      if (err) { 
        log.error(`Passport.use - local strategy - Database error: ${err}`); 
        return done(err, false, {message: 'Internal error.'}); 
      }
      // User not found.
      if (!strUser) { 
        log.warn(`email ${email} not found on database.`); 
        return done(null, false, { message: 'Usuário não cadastrado.'} ); 
      }
      let user = JSON.parse(strUser);
      // Password match.
      if (bcrypt.compareSync(req.body.password, user.password)) {
        // Merge cart from session.
        redis.get(`cart:${req.sessionID}`, (err, sessCart)=>{
          if (sessCart) {
            // Get authenticated user cart.
            redis.get(`cart:${user.email}`, (err, userCart)=>{
              let cart;
              if (userCart) {
                cart = new Cart(JSON.parse(userCart));
              } else {
                cart = new Cart();
              }
              // Merge anonymous cart to authenticated user cart.
              cart.mergeCart(JSON.parse(sessCart));
              redis.del(`cart:${req.sessionID}`);
              redis.set(`cart:${user.email}`, JSON.stringify(cart), (err)=>{
                // log.warn('merged cart: ', JSON.stringify(cart));
                return done(null, user); 
              });   
            }); 
          }
          // No cart session to merge.
          else {
            return done(null, user); 
          }        
        });
      } 
      // Wrong password.
      else {
        log.warn(`Incorrect password for user ${email}`);
        return done(null, false, { message: 'Senha incorreta.'} ); 
      }
    });
  });
}));