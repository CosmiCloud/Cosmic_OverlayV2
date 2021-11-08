const overlay = require('../start_overlay.js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('../configurations/overlay_config.json');
const node_config = require('../configurations/node_config.json');
const prompts = require('prompts');
const { TelegramClient } = require('messaging-api-telegram');
const node_name = overlay_config.scripts.node_name;
const token = overlay_config.scripts.aws_backup.telegram_bot_token;
const chatId = overlay_config.scripts.telegram_chat_id;
const awsbucket = overlay_config.scripts.aws_bucket_name;
const awsaccesskeyid = overlay_config.scripts.aws_access_key_id;
const awssecretaccesskey = overlay_config.scripts.aws_secret_access_key;
const restic_password = overlay_config.scripts.restic_password;
const aws_region = overlay_config.scripts.aws_region;
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
    //prechecks for docker and jq
    backup_menu: async function menu(){
      try {
        console.log('\x1b[35m',"[1] - Create a full local backup file");
        console.log('\x1b[35m',"[2] - Create a full backup and upload it to AWS bucket: "+awsbucket);
        console.log('\x1b[35m',"[3] - Create a restic backup and upload it to AWS bucket: "+awsbucket);
        console.log('\x1b[35m',"[4] - Delete local backups in /root/OTBackup");
        console.log('\x1b[35m',"[0] - Return to main menu",'\n');

        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWhat would you like to do?'
        });

        if(response.response == '1'){
          module.exports.createbackup();

        }else if(response.response == '2'){
          module.exports.awsbackup();

        }else if(response.response == '3'){
          module.exports.resticbackup();

        }else if(response.response == '4'){
          module.exports.cleanbackups();

        }else if(response.response == '0'){
          const overlay = require('../start_overlay.js');
          overlay.menu();

        }else{
          console.log('\x1b[31m',"Exited Back up Menu.");
          const overlay = require('../start_overlay.js');
          overlay.menu();
        }
    }catch(e){
      console.log('\x1b[31m Something broke in the backup menu: '+ e,'\n');
    }
  },

  createbackup: async function option_1(){
    try {
      var cleannode = 'sudo docker exec otnode rm -rf /ot-node/backup'
      await exec(cleannode);

      console.log('\n','\x1b[35m',"Creating a back up file...");
      var createbackup = 'sudo docker exec otnode node /ot-node/current/scripts/backup.js --configDir=/ot-node/data'
      await exec(createbackup);

      console.log('\x1b[32m',"Back up file successfully created.",'\n');
      console.log('\x1b[35m',"Back up file path: /root/OTBackup",'\n');

      var copybackup = 'sudo mkdir -p /root/OTBackup && sudo rm -rf /root/OTBackup/* && sudo docker cp otnode:/ot-node/backup/ /root/OTBackup'
      await exec(copybackup);

      find_dir = "sudo ls /root/OTBackup/backup"
      find_dir = await exec(find_dir);
      ip_dir = find_dir.stdout;
      ip_dir = ip_dir.slice(0, -1);

      mv_files = 'sudo mv /root/OTBackup/backup/'+ip_dir+'/* /root/OTBackup/'
      await exec(mv_files);

      rm_fluff = 'sudo rm -rf /root/OTBackup/backup'
      await exec(rm_fluff);

      var displaybackups = 'sudo ls /root/OTBackup'
      const { stdout, stderr } = await exec(displaybackups);

      console.log('\x1b[35m',"-------Back up files-------");
      console.log(stdout);

      var cleannode = 'sudo docker exec otnode rm -rf /ot-node/backup'
      await exec(cleannode);
      console.log('\x1b[33m',"The back up in the docker container has been removed to preserve space.");

      const overlay = require('../start_overlay.js');
      overlay.menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  awsbackup: async function option_2(){
    try{
      console.log('\x1b[35m',"Backing up node and sending it to AWS bucket "+awsbucket+"...");
      console.log('\x1b[35m',"This could take several minutes depending on the amount of data stored on your node.");

      var upload = 'sudo docker exec otnode node /ot-node/current/scripts/backup-upload-aws.js --config=/ot-node/.origintrail_noderc --configDir=/ot-node/data --backupDirectory=/ot-node/backup --AWSAccessKeyId='+awsaccesskeyid +' --AWSSecretAccessKey='+awssecretaccesskey+' --AWSBucketName='+awsbucket
      await exec(upload);

      console.log('\x1b[32m',"AWS backup triggered, if your configuration was correct, you can check AWS S3 to find your backup.");

      var cleannode = 'sudo docker exec otnode rm -rf /ot-node/backup'
      await exec(cleannode);
      console.log('\x1b[33m',"The back up in the docker container has been removed to preserve space.");

      const overlay = require('../start_overlay.js');
      overlay.menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  resticbackup: async function option_3(){
    try{
      var dir = "/root/aws"
      if(fs.existsSync(dir)){
        console.log('AWS folder already exists in root, assuming aws cli v2 is installed and configured.')
      }else{
        console.log('\x1b[35m',"Downloading aws cli v2...");
        awsdl = 'sudo curl --silent "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /root/awscliv2.zip'
        await exec(awsdl);
        console.log('\x1b[32m',"Aws cli downloaded.",'\n');

        rmaws = 'sudo rm -rf /root/aws'
        await exec(rmaws);
        //unzip download
        console.log('\x1b[35m',"Extracting files...");
        unzipaws = 'sudo unzip /root/awscliv2.zip -d /root/'
        await exec(unzipaws,{maxBuffer: 1024 * 2000});
        console.log('\x1b[32m',"aws cli v2 files extracted.",'\n');

        rmawsz = 'sudo rm -rf /root/awscliv2.zip'
        await exec(rmawsz);

        console.log('\x1b[35m',"Installing aws cli v2...");
        installaws = 'sudo /root/aws/install --update'
        await exec(installaws);
        console.log('\x1b[32m',"AWS cli v2 installed",'\n');

        console.log('\x1b[35m',"Configuring aws cli v2...");
        var region = 'sudo aws configure set region '+config.scripts.aws_region
        await exec(region);

        var accesskey = 'sudo aws configure set aws_access_key_id '+config.scripts.aws_access_key_id
        await exec(accesskey);

        var secretkey = 'sudo aws configure set aws_secret_access_key '+config.scripts.aws_secret_access_key
        await exec(secretkey);

        console.log('\x1b[32m',"AWS cli v2 configured.",'\n');
      }

      var dir = "/root/restic-backup"
      if(fs.existsSync(dir)){
        console.log(date+' - scripts/upload.js: A restic-backup directory already exists.');

        console.log(date+' - scripts/upload.js: Creating password file in root');
        var restic ='sudo touch /root/restic-password.txt'
        await exec(restic);

        console.log(date+' - scripts/upload.js: Writing password file in root');
        //var restic_password = restic_password+''
        await fs.writeFile('/root/restic-password.txt', restic_password, err => {
          if (err) {
            console.error(err)
            return
          }
          //file written successfully
        })

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

      var asas = 'sudo ls /root/restic-backup/backup/*/'
      asas = await exec(asas);
      console.log(date+' - '+asas.stdout);

      console.log(date+' - scripts/upload.js: Moving backup data to backup folder');
      var mv_data = 'sudo mv /root/restic-backup/backup/202*/* /root/restic-backup/ 2>&1'
      await exec(mv_data);

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
          //console.log(date+' - scripts/upload.js: Failed to trigger AWS upload.');
          client.sendMessage(chatId, node_name+ ' Restic backup to AWS S3 FAILED: '+error, {
            disableWebPagePreview: true,
            disableNotification: false,
          });

          //console.log(date+' - scripts/upload.js: Removing backup used for upload');
          var del_bu = 'sudo rm -rf /root/restic-backup'
          exec(del_bu);

          //console.log(date+' - scripts/upload.js: Removing existing backups in otnode container');
          var backup = 'sudo docker exec otnode rm -rf /ot-node/backup'
          exec(backup);

          //console.log(date+' - scripts/upload.js: Removing password file of failed upload');
          var rm_pwd = 'sudo rm -rf /root/restic-password.txt'
          exec(rm_pwd);

        }else{
          //console.log(date+' - scripts/upload.js: AWS upload has successfully triggered.');
          client.sendMessage(chatId, node_name+ ' Restic backup to AWS S3 SUCCESSFUL: '+stdout, {
            disableWebPagePreview: true,
            disableNotification: false,
          });

          //console.log(date+' - scripts/upload.js: Removing backup used for upload');
          var del_bu = 'sudo rm -rf /root/restic-backup/*'
          exec(del_bu);

          //console.log(date+' - scripts/upload.js: Removing existing backups in otnode container');
          var backup = 'sudo docker exec otnode rm -rf /ot-node/backup'
          exec(backup);
        }
      });

      const overlay = require('../start_overlay.js');
      overlay.menu();

    }catch(e){
      client.sendMessage(chatId, node_name+ ' AWS upload failed: '+e, {

      });
    }
  },

  cleanbackups: async function option_4(){
    try{
      console.log('\x1b[35m',"Deleting node backups in /root/OTBackups/* ...");
      var cleanbackups = 'sudo rm -rf /root/OTBackups/*'
      await exec(cleanbackups);

      var cleannode = 'sudo docker exec otnode rm -rf /ot-node/backup'
      await exec(cleannode);
      console.log('\x1b[33m',"The back up in the docker container has been removed to preserve space.");

      var displaybackups = 'sudo ls /root/OTBackups/'
      const { stdout, stderr } = await exec(displaybackups);

      console.log('\x1b[35m',"Backups have been deleted.");
      console.log('\x1b[35m',"-------Back up files-------");
      console.log(stdout);

      module.exports.backup_menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  }
}
