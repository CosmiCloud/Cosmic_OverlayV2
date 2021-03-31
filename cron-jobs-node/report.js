const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');

//config.scripts.status_check.frequency
cron.schedule(config.scripts.report.frequency,function(){
  if(config.scripts.report.enabled == "true"){
    console.log('cron-jobs-node/report.js: Report generation triggered...');
    var command = "cd ../scripts/OTNodeReport && sudo node report.js";
    if(shell.exec(command).code !== 0){
      console.log('cron-jobs-node/report.js: Failed to generate report.');
    }else{
      console.log('cron-jobs-node/report.js: Node report created and sent.');
    }
  }
})
