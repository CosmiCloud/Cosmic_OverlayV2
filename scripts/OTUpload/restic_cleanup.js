const { TelegramClient } = require('messaging-api-telegram');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../../configurations/overlay_config.json');
require('dotenv')
const node_name = config.scripts.node_name;
const token = config.scripts.aws_backup.telegram_bot_token;
const chatId = config.scripts.telegram_chat_id;
const awsbucket = config.scripts.aws_bucket_name;
const awsaccesskeyid = config.scripts.aws_access_key_id;
const awssecretaccesskey = config.scripts.aws_secret_access_key;
const restic_password = config.scripts.restic_password;
const aws_region = config.scripts.aws_region;
require('dotenv')
const fs = require('fs');
const dateFormat = require('dateformat');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");

const client = new TelegramClient({
  accessToken: token,
});

client.getWebhookInfo().catch((error) => {
  console.log(error);
  console.log(error.stack);
  console.log(error.config);
  console.log(error.request);
  console.log(error.response);
});

module.exports={
    forget: async function forget(){
      try {
        console.log(date+' - scripts/restic_cleanup.js: Removing outdated snapshots and data');
        var forget ='sudo /root/Cosmic_OverlayV2/restic -r s3:s3.amazonaws.com/'+awsbucket+' forget --group-by host --keep-last 1 -p /root/restic-password.txt 2>&1'

        console.log(date+' - scripts/restic_cleanup.js: Notifying result of forget command with telegram');
        exec(forget, (error, stdout, stderr) => {
          if (error){
            console.log(date+' - scripts/restic_cleanup.js: Forget command FAILED: '+error);
            client.sendMessage(chatId, node_name+ ' Forget snapshot command FAILED: '+error, {
              disableWebPagePreview: true,
              disableNotification: false,
            });
          }else{
            console.log(date+' - scripts/restic_cleanup.js: Snapshot command SUCCESSFUL');
            client.sendMessage(chatId, node_name+ ' Forget snapshot command SUCCESSFUL. ', {
              disableWebPagePreview: true,
              disableNotification: false,
            });
            module.exports.prune();
          }
        });
    }catch(e){
      console.log('\x1b[31m Something broke in the forget: '+ e,'\n');
    }
  },

  prune: async function prune(){
    try {
      console.log(date+' - scripts/restic_cleanup.js: Pruning...');
      var prune ='sudo /root/Cosmic_OverlayV2/restic -r s3:s3.amazonaws.com/'+awsbucket+' prune -p /root/restic-password.txt 2>&1'

      console.log(date+' - scripts/restic_cleanup.js: Notifying result of prune command with telegram');
      exec(prune, (error, stdout, stderr) => {
        if (error){
          console.log(date+' - scripts/restic_cleanup.js: Pruning command FAILED '+error);
          client.sendMessage(chatId, node_name+ ' Pruning command FAILED: '+error, {
            disableWebPagePreview: true,
            disableNotification: false,
          });
        }else{
          console.log(date+' - scripts/restic_cleanup.js: Pruning command SUCCESSFUL');
          client.sendMessage(chatId, node_name+ ' Pruning command SUCCESSFUL: '+stdout, {
            disableWebPagePreview: true,
            disableNotification: false,
          });
          module.exports.check();
        }
      });
  }catch(e){
    console.log('\x1b[31m Something broke in the prune: '+ e,'\n');
  }
},

  check: async function check(){
    try {
      console.log(date+' - scripts/restic_cleanup.js: Checking...');
      var check ='sudo /root/Cosmic_OverlayV2/restic -r s3:s3.amazonaws.com/'+awsbucket+' check -p /root/restic-password.txt 2>&1'

      console.log(date+' - scripts/restic_cleanup.js: Notifying result of check command with telegram');
      exec(check, (error, stdout, stderr) => {
        if (error){
          console.log(date+' - scripts/restic_cleanup.js: Check command FAILED '+error);
          client.sendMessage(chatId, node_name+ ' Check command FAILED: '+error, {
            disableWebPagePreview: true,
            disableNotification: false,
          });
        }else{
          console.log(date+' - scripts/restic_cleanup.js: Check command SUCCESSFUL');
          client.sendMessage(chatId, node_name+ ' Check command SUCCESSFUL: '+stdout, {
            disableWebPagePreview: true,
            disableNotification: false,
          });
        }
      });
    }catch(e){
      console.log('\x1b[31m Something broke in the check: '+ e,'\n');
    }
  }
}

module.exports.forget();
