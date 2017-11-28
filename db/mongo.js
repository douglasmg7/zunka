'use strict';

const mongo = require('mongodb').MongoClient;
const dbConfig = require('../config/db');
const log = require('../config/log');

const state = {
  db: null,
  config: dbConfig
};

// Define which db to use.
let url = null;
process.env.NODE_ENV === 'unitTest' ? url = dbConfig.urlUnitTest : url = dbConfig.url;

mongo.connect(url, (err, database)=>{
  if(err){
    log.error('MongoDb connection error.', {err: err});
    process.exit(1);
  } else {
    state.db = database;
    log.info('Connected to Mongo.');
  }
});

module.exports = state;