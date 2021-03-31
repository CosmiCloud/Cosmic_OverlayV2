const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');

//config.scripts.log_notifications.frequency
cron.schedule(config.scripts.log_notifications.frequency,function(){
  if(config.scripts.log_notifications.enabled == "true"){
    console.log('cron-jobs-node/notifications.js: Checking node logs...');
    var command = "cd ../scripts/OTLogNotifications && sudo node Notification.js";
    if(shell.exec(command).code !== 0){
      console.log('cron-jobs-node/notifications.js: Unable to query node logs...');
    }else{
      console.log('cron-jobs-node/notifications.js: Logs have been checked.');
    }
  }
})
