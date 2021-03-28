const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');
const fs = require('fs');
const dateFormat = require('dateformat');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");
const util = require('util');

cron.schedule(config.scripts.log_archiving.frequency,function(){
  if(config.scripts.log_archiving.enabled == "true"){
    console.log(date+' - cron-jobs-node/archive.js: Archiving Logs...');
    var command = "cd ../scripts/OTLogArchiving && sudo node archive.js";
    if(shell.exec(command).code !== 0){
      console.log(date+' - cron-jobs-node/archive.js: Failed to Archive logs.');
    }else{
      console.log(date+' - cron-jobs-node/archive.js: Logs have been archived.');
    }
  }
})
