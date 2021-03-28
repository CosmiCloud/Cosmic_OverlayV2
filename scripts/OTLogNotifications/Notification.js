const { TelegramClient } = require('messaging-api-telegram');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../../configurations/overlay_config.json');
const fs = require('fs');
const dateFormat = require('dateformat');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");

const node_name = config.scripts.node_name;
const notifications = config.scripts.log_notifications.notifications;
var notif_count  = Object.keys(notifications).length;
var notif_count = Number(notif_count);

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
                return;
              }else{
                console.log(date+' - scripts/Notification.js: '+obj.header+' was triggered.');
                client.sendMessage(chatId, header + stdout , {
                  disableWebPagePreview: true,
                  disableNotification: false,
                });
              }
            });
        }else{
          console.log(date+' - scripts/Notification.js: '+obj.header+' is disabled.');
        }
    }
  }catch(e){
    console.log(date+e);
    client.sendMessage(chatId, node_name+ ' failed to search logs.' + e, {
      disableWebPagePreview: true,
      disableNotification: true,
    });
    return;
  }
}
notification()
