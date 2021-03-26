const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');

//config.scripts.log_notifications.frequency
cron.schedule(config.scripts.log_notifications.frequency,function(){
  if(config.scripts.log_notifications.enabled == "true"){
    var command = "cd ../scripts/OTLogNotifications && sudo node Notification.js";
    console.log("notification");
    if(shell.exec(command).code !== 0){
      console.log("Something went wrong");
    }
  }
})
