const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');

//config.scripts.status_check.frequency
cron.schedule(config.scripts.heartbeat.frequency,function(){
  if(config.scripts.heartbeat.enabled == "true"){
    var command = "cd ../scripts/OTHeartbeat && sudo node ping.js";
    console.log("Heartbeat");
    if(shell.exec(command).code !== 0){
      console.log("Something went wrong");
    }
  }
})
