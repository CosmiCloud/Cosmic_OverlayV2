const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');

//config.scripts.log_notifications.frequency
cron.schedule(config.scripts.create_aws_job.frequency,function(){
  if(config.scripts.create_aws_job.enabled == "true"){
    console.log('cron-jobs-node/awsjob.js: Kicking off job creation...');
    var command = "cd ../scripts/AWS && sudo node createJob.js";
    if(shell.exec(command).code !== 0){
      console.log('cron-jobs-node/awsjob.js: Unable to kick off job creation.');
    }else{
      console.log('cron-jobs-node/awsjob.js: Job has was successfully initiated.');
    }
  }
})
