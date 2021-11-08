const { TelegramClient } = require('messaging-api-telegram');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../../configurations/overlay_config.json');

const node_name = config.scripts.node_name;
const token = config.scripts.heartbeat.telegram_bot_token;
const chatId = config.scripts.telegram_chat_id

const fs = require('fs');
const dateFormat = require('dateformat');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");

const client = new TelegramClient({
  accessToken: token,
});

client.getWebhookInfo().catch((error) => {
  console.log(error); // formatted error message
  console.log(error.stack); // error stack trace
  console.log(error.config); // axios request config
  console.log(error.request); // HTTP request
  console.log(error.response); // HTTP response
});

module.exports={
    //prechecks for docker and jq
    job_check: async function job_check(){
      try {
        var jobs = 'sudo curl -X GET "https://v5api.othub.info/api/jobs/jobcreatedcountinperiod?timePeriod=hours&time=1&onlyFinalizedJobs=true" -H  "accept: text/plain"'
          var jobs = await exec(jobs);
          return jobs.stdout;

    }catch(e){
      console.log('\x1b[31m Something broke in the backup menu: '+ e,'\n');
    }
  }
}

async function ping(){
  try{
    console.log(date+' - scripts/ping.js: Pinging otnode...');
    var runStateq = "sudo docker inspect -f {{.State.Running}} otnode"
    var running = await exec(runStateq);
    var running = running.stdout
    var running = running.trim().replace(/\r?\n|\r/g, "");

    if(running == 'true'){
      console.log(date+' - scripts/ping.js: otnode is running.');

      console.log(date+' - scripts/ping.js: checking if node has bid recently');
      var bid_check = "sudo docker logs --since 1h otnode | grep 'Accepting' | wc -l"
      var bid_check = await exec(bid_check);
      var bids = bid_check.stdout
      var bids = Number(bids);
      console.log(date+' - scripts/ping.js: bids -> '+bids)

      console.log(date+' - scripts/ping.js: checking if there have been jobs recently');
      var jobs_count = 'sudo curl -sX GET "https://v5api.othub.info/api/jobs/jobcreatedcountinperiod?timePeriod=hours&time=1&blockchainID=2"'
      var jobs_count = await exec(jobs_count);
      var jobs_count = jobs_count.stdout
      var jobs_count = Number(jobs_count);
      console.log(date+' - scripts/ping.js: job count -> '+jobs_count)

      console.log(date+' - scripts/ping.js: Checking CPU usage...');
       var checkcpu = "echo $(vmstat 1 2|tail -1|awk '{print $15}')"
       var checkcpu = await exec(checkcpu);
       var cpuusage = checkcpu.stdout
       var cpuusage = Number(cpuusage);
       var cpuusage = 100 - cpuusage
       console.log(date+' - scripts/ping.js: CPU usage -> '+cpuusage);

       if(bids == 0){
         if(jobs_count !== 0){
           console.log(date+' - scripts/ping.js: node has NOT been bidding and there have been jobs. Attempting to restart..');
           await client.sendMessage(chatId, node_name+ ' has NOT bid in the last hour and there have been jobs. Attempting to restart..', {
             disableWebPagePreview: true,
             disableNotification: false,
           });
           var restart = "sudo docker start otnode"
           await exec(restart);
         }
       }else{
         if(cpuusage > 80){
           //console.log(date+' - scripts/ping.js: CPU usage is high:'+cpuusage+'%');
           //await client.sendMessage(chatId, node_name+ ' CPU usage is '+ cpuusage+'%', {
             //disableWebPagePreview: true,
             //disableNotification: false,
           //});
         }
       }
    }else if(running == 'false'){
        console.log(date+' - scripts/ping.js: otnode is NOT running.');
        await client.sendMessage(chatId, node_name+ ' is not running. Attempting to restart..', {
          disableWebPagePreview: true,
          disableNotification: false,
        });
        var restart = "sudo docker start otnode"
        await exec(restart);
    }

  }catch(e){
    console.log(date+e);
    return;
  }
}
ping()
