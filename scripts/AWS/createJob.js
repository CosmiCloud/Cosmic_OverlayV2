const util = require('util');
const exec = util.promisify(require('child_process').exec);
const prompts = require('prompts');
const config = require('../../configurations/overlay_config.json');
const fs = require('fs');
const os = require('os');
const dateFormat = require('dateformat');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");
const { TelegramClient } = require('messaging-api-telegram');

const s3_url_of_data = config.scripts.create_aws_job.s3_url_of_data;
const chatId = config.scripts.telegram_chat_id;
const token = config.scripts.create_aws_job.telegram_bot_token;
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

module.exports = {
  createJob: async function job(){
    //build the node config file mainnet
    try{
      var aws_dir = "sudo mkdir /root/OTawsjobdata -p && sudo rm -rf /root/OTawsjobdata/*"
      await exec(aws_dir);

      var dl_s3 = "sudo aws s3 cp "+s3_url_of_data+" /root/OTawsjobdata --recursive"
      console.log(date+" - scripts/AWS/createJob.js: Downloading job data from AWS s3...");
      console.log(date+" - scripts/AWS/createJob.js:This could take a while...");
      await exec(dl_s3,{maxBuffer: 1024 * 100000000});

      var dl_check = "sudo find /root/OTawsjobdata  -type f | wc -l"
      var dl = await exec(dl_check);
      if(dl.stdout == '0'){
        client.sendMessage(chatId, config.scripts.node_name+" - Nothing was downloaded from aws s3 for job creation.", {
          disableWebPagePreview: true,
          disableNotification: false,
        });
        console.log(date+" - scripts/AWS/createJob.js: Nothing was downloaded from aws s3.")
        return;
      }else{
        var get_bu_size = "sudo ls -l /root/OTawsjobdata"
        var size = await exec(get_bu_size);
        console.log(date+" - scripts/AWS/createJob.js:Downloaded data is: "+size.stdout);
      }

      var path = '/root/OTawsjobdata/data.xml'
      var data = /[^/]*$/.exec(path)[0];

      var find_init = 'sudo find /var/lib/docker/overlay2/ -maxdepth 1 -name "*-init"'
      var find_init = await exec(find_init)
      var find_init = find_init.stdout
      var overlay_id = find_init.slice(25,-6);

      var move = 'sudo mv '+path+' /var/lib/docker/overlay2/'+overlay_id+'/merged/ot-node/data/'+data
      await exec(move);

      var standard = config.scripts.create_aws_job.standard
      var type = config.scripts.create_aws_job.type
      var import_cmd = 'sudo docker exec otnode curl -X POST http://localhost:8900/api/latest/import -H "accept: application/json" -H  "Content-Type: multipart/form-data" -F "standard_id='+standard+'" -F "file=@/ot-node/data/'+data+';type='+type+'"'
      var import_cmd = await exec(import_cmd);
      var import_cmd = JSON.parse(import_cmd.stdout);
      var import_handler_id = import_cmd.handler_id
      console.log(date+' - scripts/AWS/createJob.js: Your handler id for this import is: '+import_handler_id)

      var import_res = 'sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/import/result/'+import_handler_id+' -H "accept: application/json"'

      console.log(date+' - scripts/AWS/createJob.js: Waiting on import to complete..');

      var hasDataSetID = false;
      var time = 1;
      const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

  	  do {
        var import_res = 'sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/import/result/'+import_handler_id+' -H "accept: application/json"'
        var import_res = await exec(import_res);
        var stdout = JSON.parse(import_res.stdout);

        if(stdout.status == "COMPLETED"){
          console.log(date+' - scripts/AWS/createJob.js: Import completed.')
          var dataset_id = stdout.data.dataset_id;
          console.log(date+" - scripts/AWS/createJob.js: Data set ID for this job is: "+stdout.data.dataset_id);
          time = 21;
          hasDataSetID = true;
        }else{
          time++;
        }
  			await snooze(2000);
  	  }
  	  while(!hasDataSetID && time <= 20);

      var network = config.scripts.create_aws_job.network
      var holding_time = config.scripts.create_aws_job.holding_time_in_minutes
      var payment = config.scripts.create_aws_job.token_amount_per_holder

      if(isNaN(payment) || payment == '0'){
        console.log(date+" - scripts/AWS/createJob.js: 0 or non-number used in configuration. Script will not proceed...");
        return;
      }else{
        console.log(date+" - scripts/AWS/createJob.js: Parsing payment...");
        if(payment % 1 != 0){
          var payment = Number(payment);
          var payment = payment.toFixed(2);
          var payment_str = payment+""
          var payment = Number(payment);
          var whole = payment.toString().split(".")[0];
          var decimal = payment.toString().split(".")[1];

          var dec_dif = 18 - decimal.length

          var zeros = ""
          for (i = 0; i < dec_dif; i++) {
            var zeros = zeros + "0"
          }

          var decimal = decimal + zeros

          if(whole != '0'){
            var payment = whole + decimal
          }else{
            var payment = decimal
          }
        }else{
          var payment_str = payment+""
          var payment = payment_str+"000000000000000000"
        }
      }

      console.log(date+" - scripts/AWS/createJob.js: Replicating data...");
      if(hasDataSetID){
        var params = '{"dataset_id": "'+dataset_id+'", "network_id": "'+network+'", "holding_time_in_minutes": '+holding_time+', "token_amount_per_holder": "'+payment+'"}'
        var replicate = "sudo docker exec otnode curl -X POST http://localhost:8900/api/latest/replicate -H 'accept: application/json' -H 'Content-Type: application/json' -d '"+params+"'"
        var replicate = await exec(replicate);
        var replicate = JSON.parse(replicate.stdout)
        var rep_handler_id = replicate.handler_id;
        console.log(date+" - scripts/AWS/createJob.js: Your replicate handler id is: "+replicate.handler_id)
      }else{
        console.log(date+' - scripts/AWS/createJob.js: No data set id was created.')
        client.sendMessage(chatId, config.scripts.node_name+" - No data set id was created.", {
          disableWebPagePreview: true,
          disableNotification: false,
        });
        return;
      }

      var isFinished = false;
      var time = 1;

  	  do {
        var replicate_res = 'sudo docker exec otnode curl -X GET http://localhost:8900/api/latest/replicate/result/'+rep_handler_id+' -H "accept: application/json"'
        var replicate_res = await exec(replicate_res);
        var stdout = JSON.parse(replicate_res.stdout);

        if(stdout.status == "COMPLETED"){
          if(stdout.data.status == "FINALIZED"){
            console.log(date+' - scripts/AWS/createJob.js: AWS job has been finalized.');
            console.log(date+" - scripts/AWS/createJob.js: Offer ID: "+stdout.data.offer_id);
            client.sendMessage(chatId, config.scripts.node_name+" - AWS job has been finalized. Offer ID is: "+stdout.data.offer_id, {
              disableWebPagePreview: true,
              disableNotification: false,
            });
            var isFinished = true;
            time = 601;
          }
        }else if(stdout.status == "FAILED"){
          if(stdout.data.status == "PREPARING_OFFER"){
            console.log(date+' - scripts/AWS/createJob.js: AWS job failed to finish preparing offer.')
            client.sendMessage(chatId, config.scripts.node_name+" - AWS job failed to finish preparing offer.", {
              disableWebPagePreview: true,
              disableNotification: false,
            });
            var isFinished = true;
            time = 601;
          }
          if(stdout.data.status == "WAITING_FOR_HOLDERS"){
            console.log(date+' - scripts/AWS/createJob.js: AWS job failed because not enough Data Holders responded.')
            client.sendMessage(chatId, config.scripts.node_name+" - AWS job failed because not enough Data Holders responded.", {
              disableWebPagePreview: true,
              disableNotification: false,
            });
            var isFinished = true;
            time = 601;
          }
        }else{
          time++;
        }
  			await snooze(10000);
  	  }
  	  while(!isFinished && time <= 600);

    }catch(e){
      console.log(date+' - scripts/AWS/createJob.js: ',e);
      client.sendMessage(chatId, config.node_name+" - AWS job creation failed. " +e, {
        disableWebPagePreview: true,
        disableNotification: false,
      });
    }
  }
}
module.exports.createJob()
