const cron = require('node-cron');
const express = require('express');
const shell = require('shelljs');
const config = require('../configurations/overlay_config.json');
const fs = require('fs');
const dateFormat = require('dateformat');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");
const util = require('util');

//config.scripts.status_check.frequency
cron.schedule(config.scripts.report.frequency,function(){
  if(config.scripts.report.enabled == "true"){
    console.log(date+' - cron-jobs-node/report.js: Report generation triggered...');
    var command = "cd ../scripts/OTNodeReport && sudo node report.js";
    if(shell.exec(command).code !== 0){
      console.log(date+' - cron-jobs-node/report.js: Failed to generate report.');
    }else{
      console.log(date+' - cron-jobs-node/report.js: Node report created and sent.');
    }
  }
})
