const util = require('util');
const exec = util.promisify(require('child_process').exec);
const prompts = require('prompts');
const config = require('../../configurations/overlay_config.json');

const aws_bucket_filepath = config.scripts.aws_bucket_filepath;

module.exports = {
  s3download: async function s3dl(callback){
    //build the node config file mainnet
    try{
      var aws_dir = "sudo mkdir /root/OTawsbackup -p && sudo rm -rf /root/OTawsbackup/*"
      await exec(aws_dir);

      var dl_s3 = "sudo aws s3 cp s3://"+aws_bucket_filepath+" /root/OTawsbackup --recursive"
      console.log('\x1b[35m',"Downloading backup from AWS s3...");
      console.log('\x1b[35m',"This could take a while...");
      await exec(dl_s3,{maxBuffer: 1024 * 100000000});

      var dl_check = "sudo find /root/OTawsbackup  -type f | wc -l"
      var dl = await exec(dl_check);
      if(dl.stdout == '0'){
        console.log('\x1b[31m',"Nothing was downloaded from aws s3.")
        return'fail';
      }else{
        var get_bu_size = "sudo ls -l --block-size=G /root/OTawsbackup"
        var size = await exec(get_bu_size);
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
        console.log('\x1b[33m',"AWS cli v2 is required to restore a node directly from AWS.");
        console.log('\x1b[35m',"Feel free to manually move the back up onto your server and use the local restore or manually install aws cli 2 yourself.");

        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWould you like to install aws cli and proceed?(y/n)'
        });

        if(response.response == 'y' || response.response == 'yes'){
          //download aws cli
          console.log('\x1b[35m',"Downloading aws cli v2...");
          var awsdl = 'sudo curl --silent "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /root/awscliv2.zip > /dev/null 2>&1'
          await exec(awsdl);
          console.log('\x1b[32m',"Aws cli downloaded.",'\n');

          var rmaws = 'sudo rm -rf /root/aws'
          await exec(rmaws);
          //unzip download
          console.log('\x1b[35m',"Extracting files...");
          console.log('\x1b[35m',"This may take a while...");
          var unzipaws = 'sudo unzip /root/awscliv2.zip -d /root/'
          await exec(unzipaws,{maxBuffer: 1024 * 2000});

          console.log('\x1b[32m',"aws cli v2 files extracted.",'\n');
          //remove zip
          var rmawsz = 'sudo rm -rf /root/awscliv2.zip'
          await exec(rmawsz);

          //install aws cli
          console.log('\x1b[35m',"Installing aws cli v2...");
          var installaws = '/root/aws/install --update'
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
        }
    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
  },

  awsbackup: async function createawsbackup(){
    try{
      var node_name = config.scripts.node_name;
      var notify_api_key = config.scripts.aws_backup.notify_api_key;

      var awsbucket = config.scripts.aws_bucket_name;
      var awsaccesskeyid = config.scripts.aws_access_key_id;
      var awssecretaccesskey = config.scripts.aws_secret_access_key;

      console.log('\x1b[35m',"Backing up node and sending it to AWS bucket "+awsbucket+"...");
      console.log('\x1b[35m',"This could take several minutes depending on the amount of data stored on your node.");
      var upload = 'sudo docker exec otnode node scripts/backup-upload-aws.js --config=/ot-node/.origintrail_noderc --configDir=/ot-node/data --backupDirectory=/ot-node/backup --AWSAccessKeyId='+awsaccesskeyid +' --AWSSecretAccessKey='+awssecretaccesskey+' --AWSBucketName=' + awsbucket
      await exec(upload);
      console.log('\x1b[32m',"AWS backup triggered, if your configuration was correct, you can check AWS S3 to find your backup.");

      return'success';

    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
  }
}
