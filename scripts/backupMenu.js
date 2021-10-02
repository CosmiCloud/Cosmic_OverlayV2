const overlay = require('../start_overlay.js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('../configurations/overlay_config.json');
const node_config = require('../configurations/node_config.json');
const prompts = require('prompts');
const node_name = overlay_config.scripts.node_name;
const awsbucket = overlay_config.scripts.aws_bucket_name;
const awsaccesskeyid = overlay_config.scripts.aws_access_key_id;
const awssecretaccesskey = overlay_config.scripts.aws_secret_access_key;

module.exports={
    //prechecks for docker and jq
    backup_menu: async function menu(){
      try {
        console.log('\n','\x1b[35m',"What would you like to do?");
        console.log('\x1b[35m',"[1] - Create a local backup file");
        console.log('\x1b[35m',"[2] - Create a backup file and upload it to AWS bucket: "+awsbucket);
        console.log('\x1b[35m',"[3] - Delete local backups in /root/OTBackup");
        console.log('\x1b[35m',"[0] - Return to main menu");

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
      const overlay = require('../start_overlay.js');
      overlay.menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  cleanbackups: async function option_3(){
    try{
      console.log('\x1b[35m',"Deleting node backups in /root/OTBackups/backup/* ...");
      var cleanbackups = 'sudo rm -rf /root/OTBackups/backup/*'
      await exec(cleanbackups);

      var displaybackups = 'sudo ls /root/OTBackups/backup'
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
