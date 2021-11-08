const util = require('util');
const fs = require('fs');
const exec = util.promisify(require('child_process').exec);
const prompts = require('prompts');
const config = require('../../configurations/overlay_config.json');
const s3_url_of_backup = config.scripts.s3_url_of_backup;

module.exports = {
  s3download: async function s3dl(){
    try{
      aws_dir = "sudo mkdir -p /root/OTawsbackup"
      await exec(aws_dir);

      dl_s3 = "sudo aws s3 cp "+s3_url_of_backup+" /root/OTawsbackup --recursive"
      console.log('\x1b[35m',"Downloading backup from AWS s3, this could take a while...");
      console.log('\x1b[35m'," ");
      await exec(dl_s3,{maxBuffer: 1024 * 900000000});

      dl_check = "sudo find /root/OTawsbackup -type f | wc -l"
      dl = await exec(dl_check);
      dl_count = Number(dl.stdout);

      var zip_check = "sudo find /root/OTawsbackup -name *.zip | wc -l"
      var zip = await exec(zip_check);
      var zip_count = Number(zip.stdout);

      if(dl_count == 0){
        console.log('\x1b[31m',"Nothing was downloaded from aws s3.")
        const overlay = require('../../start_overlay.js');
        overlay.menu();
      }else{
        if(zip_count == 1){
          zip_path = 'sudo find /root/OTawsbackup -name *.zip'
          zip_path = await exec(zip_path);
          zip_path = zip_path.stdout;
          fldr_zip = /[^/]*$/.exec(zip_path)[0];
          fldr = fldr_zip.split('.').slice(0, -1).join('.')

          console.log('\x1b[35m',"Decompressing backup...")
          unzip ='sudo unzip -d /root/OTawsbackup/ -o '+zip_path
          unzip = await exec(unzip);

          console.log('\x1b[32m',"Backup decompressed!")
          console.log(" ")
          console.log('\x1b[35m',"Removing zip file...")
          console.log(" ")
          var rm_zip ='sudo rm -rf '+zip_path
          await exec(rm_zip);

          find_dir = "sudo ls /root/OTawsbackup/ot-node/backup/"
          find_dir = await exec(find_dir);
          ip_dir = find_dir.stdout;
          ip_dir = ip_dir.slice(0, -1);

          mv_files = 'sudo mv /root/OTawsbackup/ot-node/backup/'+ip_dir+'/'+fldr+'/* /root/OTawsbackup'
          await exec(mv_files);

          rm_fluff = 'sudo rm -rf /root/OTawsbackup/ot-node'
          await exec(rm_fluff);

        }
        get_bu_size = "sudo ls -l /root/OTawsbackup"
        size = await exec(get_bu_size);
        console.log('\x1b[35m',"Downloaded backup is: "+size.stdout);
      }

    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
  },

  awscli : async function aws() {
    //check for aws cliversion
    try{
      var dir = "/root/aws"
      if(fs.existsSync(dir)){
        console.log('\x1b[35mAWS folder already exists in root, assumng aws cli v2 is  installed and configured.')
      }else{
        console.log('\x1b[33m',"AWS cli v2 is required to restore a node directly from AWS.");
        console.log('\x1b[35m',"Please fill out the appropriate information in the overlay_config.json and the overlay will do the rest!");
        console.log(" ");
        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWould you like to install aws cli and proceed?(y/n)'
        });

        if(response.response == 'y' || response.response == 'yes'){
          //download aws cli
          console.log('\x1b[35m',"Downloading aws cli v2...");
          awsdl = 'sudo curl --silent "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /root/awscliv2.zip > /dev/null 2>&1'
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
          installaws = '/root/aws/install --update'
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
        }else{
				  console.log('\x1b[31m',"Exited Install Menu.");
          overlay.menu();
        }
      }
    }catch(e){
      console.log('\x1b[31m',e);
      return;
    }
  },

  awsbackup: async function createawsbackup(){
    try{
      console.log('\x1b[35m',"Preparing to upload a backup...");
      node_name = config.scripts.node_name;
      awsbucket = config.scripts.aws_bucket_name;
      awsaccesskeyid = config.scripts.aws_access_key_id;
      awssecretaccesskey = config.scripts.aws_secret_access_key;

      console.log('\x1b[35m',"Backing up node and sending it to AWS bucket "+awsbucket+"...");
      console.log('\x1b[35m',"This could take several minutes depending on the amount of data stored on your node.");
      var upload = 'sudo docker exec otnode node /ot-node/current/scripts/backup-upload-aws.js --config=/ot-node/.origintrail_noderc --configDir=/ot-node/data --backupDirectory=/ot-node/backup --AWSAccessKeyId='+awsaccesskeyid +' --AWSSecretAccessKey='+awssecretaccesskey+' --AWSBucketName='+awsbucket
      await exec(upload);
      console.log('\x1b[32m',"AWS backup triggered, if your configuration was correct, you can check AWS S3 to find your backup.");

      var overlay = require('../../start_overlay.js');
      await overlay.menu();

    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
  }
}
