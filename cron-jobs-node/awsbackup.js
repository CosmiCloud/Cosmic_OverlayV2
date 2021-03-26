const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');

cron.schedule(config.scripts.aws_backup.frequency,function(){
  if(config.scripts.aws_backup.enabled == "true"){
    var command = "cd ../scripts/OTUpload && sudo node upload.js";
    if(shell.exec(command).code !== 0){
      console.log("Something went wrong");
    }
  }
})
