const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');

//config.scripts.status_check.frequency
cron.schedule(config.scripts.heartbeat.frequency,function(){
  if(config.scripts.heartbeat.enabled == "true"){
    console.log('cron-jobs-node/ping.js: Checking heartbeat and cpu...');
    var command = "cd ../scripts/OTHeartbeat && sudo node ping.js";
    if(shell.exec(command).code !== 0){
      console.log('cron-jobs-node/ping.js: Failed to check otnode status.');
    }else{
      console.log('cron-jobs-node/ping.js: otnode status has been requested.');
    }
  }
})
