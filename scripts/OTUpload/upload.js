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
    console.log(date+' - scripts/upload.js: Declaring upload variables');
    process.env.AWS_ACCESS_KEY_ID = awsaccesskeyid
    process.env.AWS_SECRET_ACCESS_KEY = awssecretaccesskey

    var dir = "/root/restic-backup"
    if(fs.existsSync(dir)){
      console.log(date+' - scripts/upload.js: A restic-backup directory already exists.');
    }else{
      console.log(date+' - scripts/upload.js: Creating /root/restic-backup');
      var restic ='sudo mkdir -p /root/restic-backup && sudo chmod -R 777 /root/restic-backup'
      await exec(restic);

      console.log(date+' - scripts/upload.js: Creating password file in root');
      var restic ='sudo touch /root/restic-password.txt'
      await exec(restic);

      console.log(date+' - scripts/upload.js: Writing password file in root');
      var data = fs.writeFileSync('/root/restic-password.txt', restic_password)
      await exec(restic);
      
      console.log(date+' - scripts/upload.js: Making restic exectuable');
      var restic ='sudo chmod +x /root/Cosmic_OverlayV2/restic'
      await exec(restic);

      console.log(date+' - scripts/upload.js: Initializing restic');
      var restic ='sudo /root/Cosmic_OverlayV2/restic -r s3:s3.amazonaws.com/'+awsbucket+' init -p /root/restic-password.txt -o s3.region='+aws_region
      await exec(restic);
    }

    console.log(date+' - scripts/upload.js: Removing existing backups in otnode container');
    var backup = 'sudo docker exec otnode rm -rf /ot-node/backup'
    await exec(backup);

    console.log(date+' - scripts/upload.js: Backing up data');
    var backup = 'sudo docker exec otnode node scripts/backup.js --config=/ot-node/.origintrail_noderc --configDir=/ot-node/data --backupDirectory=/ot-node/backup'
    await exec(backup);

    console.log(date+' - scripts/upload.js: Linking backup folder to docker container');
    var link_backup = 'sudo ln -sf "$(sudo docker inspect --format="{{.GraphDriver.Data.MergedDir}}" otnode)/ot-node/backup" /root/restic-backup/'
    await exec(link_backup);
    
    console.log(date+' - scripts/upload.js: Removing backup on otnode container');
    var del_bu = 'sudo docker exec otnode rm -rf /ot-node/backup'
    exec(del_bu);
    
    var asas = 'sudo ls /root/restic-backup/backup/*/'
    asas = await exec(asas);
    console.log(date+' - '+asas.stdout);

    console.log(date+' - scripts/upload.js: Renaming backup');
    var rename = 'sudo cp -r /root/restic-backup/backup/202*/* /root/restic-backup/ 2>&1'
    await exec(rename);

    console.log(date+' - scripts/upload.js: Moving hidden data to backup folder');
    var hid_data = 'sudo cp -r /root/restic-backup/backup/202*/.origintrail_noderc /root/restic-backup/ 2>&1'
    await exec(hid_data);

    console.log(date+' - scripts/upload.js: Removing empty backup folder');
    var del_bu = 'sudo rm -rf /root/restic-backup/backup 2>&1'
    await exec(del_bu);

    console.log(date+' - scripts/upload.js: Uploading backup');
    var upload ='sudo /root/Cosmic_OverlayV2/restic -r s3:s3.amazonaws.com/'+awsbucket+' backup /root/restic-backup/.origintrail_noderc /root/restic-backup/* -p /root/restic-password.txt'
    exec(upload, (error, stdout, stderr) => {
      if (error){
        console.log(date+' - scripts/upload.js: Failed to trigger AWS upload.');
        client.sendMessage(chatId, node_name+ ' Restic backup to AWS S3 FAILED: '+error, {
          disableWebPagePreview: true,
          disableNotification: false,
        });
      }else{
        console.log(date+' - scripts/upload.js: AWS upload has successfully triggered.');
        client.sendMessage(chatId, node_name+ ' Restic backup to AWS S3 SUCCESSFUL: '+stdout, {
          disableWebPagePreview: true,
          disableNotification: false,
        });
        
        console.log(date+' - scripts/upload.js: Removing backup used for upload');
        var del_bu = 'sudo rm -rf /root/restic-backup/*'
        exec(del_bu);
      }
    });
    
  }catch(e){
    client.sendMessage(chatId, node_name+ ' AWS upload failed: '+e, {

    });
  }
}
upload()
