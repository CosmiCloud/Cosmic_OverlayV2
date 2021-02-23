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

var upload = 'sudo docker exec otnode node scripts/backup-upload-aws.js --config=/ot-node/.origintrail_noderc --configDir=/ot-node/data --backupDirectory=/ot-node/backup --AWSAccessKeyId='+awsaccesskeyid +' --AWSSecretAccessKey='+awssecretaccesskey+' --AWSBucketName=' + awsbucket

  try{
    exec(upload, (error, upload, stderr) => {
      if (error){
        client.sendMessage(chatId, node_name+ ' system update failed: '+error, {
          disableWebPagePreview: true,
          disableNotification: false,
        });
      }else{
        client.sendMessage(chatId, node_name+ ' AWS backup script triggered. If your configuration was correct, you can check AWS S3 to find your backup.', {
          disableWebPagePreview: true,
          disableNotification: false,
        });
      }
    });
  }catch(e){
    client.sendMessage(chatId, node_name+ ' AWS script failed to trigger: '+e, {
      disableWebPagePreview: true,
      disableNotification: false,
    });
    return;
  }
