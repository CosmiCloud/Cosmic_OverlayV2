const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');
const fs = require('fs');
const dateFormat = require('dateformat');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");
const util = require('util');

cron.schedule(config.scripts.aws_backup.frequency,function(){
  if(config.scripts.aws_backup.enabled == "true"){
    console.log(date+' - cron-jobs-node/awsbackup.js: Backing up node to AWS...');
    var command = "cd ../scripts/OTUpload && sudo node upload.js";
    if(shell.exec(command).code !== 0){
      console.log(date+' - cron-jobs-node/awsbackup.js: Failed to back up to AWS.');
    }else{
      console.log(date+' - cron-jobs-node/awsbackup.js: AWS back up has been triggered.');
    }
  }
})
