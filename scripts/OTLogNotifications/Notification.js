const { TelegramClient } = require('messaging-api-telegram');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../../configurations/overlay_config.json');
const fs = require('fs');
const os = require('os');
const dateFormat = require('dateformat');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");

const notifications = config.scripts.log_notifications.notifications;
var notif_count  = Object.keys(notifications).length;
var notif_count = Number(notif_count);

const node_name = config.scripts.node_name;
const chatId = config.scripts.telegram_chat_id;

async function notification(){
  try{
    console.log(date+' - scripts/Notification.js: Checking logs for enabled notifications...');
    for(var i = 0; i < notif_count; i++) {
        var obj = Object.entries(notifications)[i];
        var obj = obj[1];
        const enabled = obj.enabled
        const searchfor = obj.searchfor
        const since = obj.since
        const header = obj.header

        const token = obj.telegram_bot_token;
        const client = new TelegramClient({
          accessToken: token,
        });

        if(enabled == 'true'){
            const command = 'sudo docker logs --since '+obj.since+' otnode | grep '+obj.searchfor
            const header = node_name + ' - '+obj.header

            exec(command, (error, stdout, stderr) => {
              if (error) {
                console.log(date+' - scripts/Notification.js: '+searchfor+' was not found.');
                return;
              }else{
                if(searchfor == "'ve been chosen'"){
                  job_report();
                }else{
                  console.log(date+' - scripts/Notification.js: '+searchfor+' was found.');
                  client.sendMessage(chatId, header + stdout , {
                    disableWebPagePreview: true,
                    disableNotification: false,
                  });
                }
                console.log(date+' - scripts/Notification.js: '+header+' notification was sent.');
              }
            });
        }else{
          console.log(date+' - scripts/Notification.js: '+obj.header+' is disabled.');
        }
    }
  }catch(e){
    console.log(date+e);
    const client = new TelegramClient({
      accessToken: token,
    });
    client.sendMessage(chatId, node_name+ ' failed to search logs.' + e, {
      disableWebPagePreview: true,
      disableNotification: true,
    });
    return;
  }
}
notification();

async function job_report(){
  const token = config.scripts.log_notifications.notifications.job_won_detection.telegram_bot_token;
  const since = config.scripts.log_notifications.notifications.job_won_detection.since;
  const searchfor = config.scripts.log_notifications.notifications.job_won_detection.searchfor;
  const header = config.scripts.log_notifications.notifications.job_won_detection.header;
  const node_name = config.scripts.node_name;
  var command = 'sudo docker logs --since '+since+' otnode | grep '+searchfor
  const client = new TelegramClient({
    accessToken: token,
  });

  var command = await exec(command);
  var command = command.stdout.slice(0,-7);
  var offer_id = command.substring(81);

  if (config.environment == 'mainnet'){
    var job_info = 'sudo curl -X GET "https://v5api.othub.info/api/Job/detail/'+offer_id+'" -H "accept: text/plain"'
  }else{
    var job_info = 'sudo curl -X GET "https://testnet-api.othub.info/api/Job/detail/'+offer_id+'" -H "accept: text/plain"'
  }

  var job_info = await exec(job_info);
  var job_info = JSON.parse(job_info.stdout);
  var token_amount = parseFloat(job_info.TokenAmountPerHolder);
  var report =  os.EOL+date+
                os.EOL+
               node_name+' - '+header+os.EOL+
                os.EOL+
               'Offer Id: '+job_info.OfferId+os.EOL+
                os.EOL+
               'Token Amount: '+token_amount+' Trac'+os.EOL+
                os.EOL+
               'Holding Time: '+job_info.HoldingTimeInMinutes+' min.'+os.EOL

  client.sendMessage(chatId, report , {
    disableWebPagePreview: true,
    disableNotification: false,
  });
  console.log(date+' - scripts/Notification.js: '+header+' notification was sent.');
}
