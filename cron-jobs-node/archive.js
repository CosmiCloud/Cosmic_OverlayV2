const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');

cron.schedule(config.scripts.log_archiving.frequency,function(){
  if(config.scripts.log_archiving.enabled == "true"){
    console.log('cron-jobs-node/archive.js: Attempting to archive logs...');
    var command = "cd ../scripts/OTLogArchiving && sudo node archive.js";
    if(shell.exec(command).code !== 0){
      console.log('cron-jobs-node/archive.js: Log archiving failed to start.');
    }else{
      console.log('cron-jobs-node/archive.js: Log archiving finished.');
    }
  }
})
