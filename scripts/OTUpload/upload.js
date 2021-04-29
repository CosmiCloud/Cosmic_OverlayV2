const { TelegramClient } = require('messaging-api-telegram');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../../configurations/overlay_config.json');

const node_name = config.scripts.node_name;
const token = config.scripts.aws_backup.telegram_bot_token;
const chatId = config.scripts.telegram_chat_id;
const awsbucket = config.scripts.aws_bucket_name;
const awsaccesskeyid = config.scripts.aws_access_key_id;
const awssecretaccesskey = config.scripts.aws_secret_access_key;

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

async function upload(){
  try{
    console.log(date+' - scripts/upload.js: Attempting AWS upload...');
    var upload = 'sudo docker exec otnode node /ot-node/init/scripts/backup-upload-aws.js --config=/ot-node/.origintrail_noderc --configDir=/ot-node/data --backupDirectory=/ot-node/backup --AWSAccessKeyId='+awsaccesskeyid +' --AWSSecretAccessKey='+awssecretaccesskey+' --AWSBucketName=' + awsbucket+' --TelegramChatID=' + chatId+' --TelegramBotToken=' + token+' --NodeName=' + node_name;

    exec(upload, (error, upload, stderr) => {
      if (error){
        console.log(date+' - scripts/upload.js: Failed to trigger AWS upload.');
        client.sendMessage(chatId, node_name+ ' system update failed: '+error, {
          disableWebPagePreview: true,
          disableNotification: false,
        });
      }else{
        console.log(date+' - scripts/upload.js: AWS upload has successfully triggered.');
        client.sendMessage(chatId, node_name+ ' AWS backup script triggered. If your configuration was correct, you can check AWS S3 to find your backup.', {
          disableWebPagePreview: true,
          disableNotification: false,
        });
      }
    });

  }catch(e){
    client.sendMessage(chatId, node_name+ ' AWS script failed to trigger: '+e, {

    });
  }
}
upload()
