const util = require('util');
const exec = util.promisify(require('child_process').exec);
const prompts = require('prompts');
const config = require('../../configurations/overlay_config.json');

const s3_url_of_backup = config.scripts.s3_url_of_backup;

module.exports = {
  s3download: async function s3dl(){
    //build the node config file mainnet
    try{
      var aws_dir = "sudo rm -rf /root/OTawsbackup && sudo mkdir -p /root/OTawsbackup"
      await exec(aws_dir);

      var dl_s3 = "sudo aws s3 cp "+s3_url_of_backup+" /root/OTawsbackup --recursive"
      console.log('\x1b[35m',"Downloading backup from AWS s3...");
      console.log('\x1b[35m',"This could take a while...");
      console.log('\x1b[35m'," ");
      await exec(dl_s3,{maxBuffer: 1024 * 100000000});

      var dl_check = "sudo find /root/OTawsbackup -type f | wc -l"
      var dl = await exec(dl_check);
      var dl_count = Number(dl.stdout);

      var zip_check = "sudo find /root/OTawsbackup -name *.zip | wc -l"
      var zip = await exec(zip_check);
      var zip_count = Number(zip.stdout);

      if(dl_count == 0){
        console.log('\x1b[31m',"Nothing was downloaded from aws s3.")
        return'fail';
      }else{
        if(zip_count == 1){
          var zip_path = 'sudo find /root/OTawsbackup -name *.zip'
          var zip_path = await exec(zip_path);
          var zip_path = zip_path.stdout;
          var fldr_zip = /[^/]*$/.exec(zip_path)[0];
          var fldr = fldr_zip.split('.').slice(0, -1).join('.')

          console.log('\x1b[35m',"Decompressing backup...")
          //var unzip ='sudo su -c "unzip -o '+zip_path+' -d /root/OTawsbackup" root'
          var unzip ='sudo unzip -d /root/OTawsbackup/ -o '+zip_path
          var unzip = await exec(unzip);

          console.log('\x1b[32m',"Backup decompressed!")
          console.log(" ")
          console.log('\x1b[35m',"Removing zip file...")
          console.log(" ")
          var rm_zip ='sudo rm -rf '+zip_path
          await exec(rm_zip);

          var find_dir = "sudo ls /root/OTawsbackup/ot-node/backup/"
          var find_dir = await exec(find_dir);
          var ip_dir = find_dir.stdout;
          var ip_dir = ip_dir.slice(0, -1);

          var mv_files = 'sudo mv /root/OTawsbackup/ot-node/backup/'+ip_dir+'/'+fldr+'/* /root/OTawsbackup'
          await exec(mv_files);

          var rm_fluff = 'sudo rm -rf /root/OTawsbackup/ot-node'
          await exec(rm_fluff);

        }
        var get_bu_size = "sudo ls -l /root/OTawsbackup"
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
          var awsdl = 'sudo curl --silent "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /root/awscliv2.zip > /dev/null 2>&1'
          await exec(awsdl);
          console.log('\x1b[32m',"Aws cli downloaded.",'\n');

          var rmaws = 'sudo rm -rf /root/aws'
          await exec(rmaws);
          //unzip download
          console.log('\x1b[35m',"Extracting files...");
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
          return;
        }
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  awsbackup: async function createawsbackup(){
    try{
      console.log('\x1b[35m',"Preparing to upload a backup...");
      var node_name = config.scripts.node_name;

      var awsbucket = config.scripts.aws_bucket_name;
      var awsaccesskeyid = config.scripts.aws_access_key_id;
      var awssecretaccesskey = config.scripts.aws_secret_access_key;

      // var find_init = 'sudo find /var/lib/docker/overlay2/ -maxdepth 1 -name "*-init"'
      // var find_init = await exec(find_init)
      // var find_init = find_init.stdout
      // var overlay_id = find_init.slice(25,-6);
      //
      // var move_script = 'sudo cp '+ __dirname+'/backup-upload-aws2.js /var/lib/docker/overlay2/'+overlay_id+'/merged/ot-node/init/scripts/'
      // await exec(move_script);

      console.log('\x1b[35m',"Backing up node and sending it to AWS bucket "+awsbucket+"...");
      console.log('\x1b[35m',"This could take several minutes depending on the amount of data stored on your node.");
      var upload = 'sudo docker exec otnode node /ot-node/init/scripts/backup-upload-aws.js --config=/ot-node/.origintrail_noderc --configDir=/ot-node/data --backupDirectory=/ot-node/backup --AWSAccessKeyId='+awsaccesskeyid +' --AWSSecretAccessKey='+awssecretaccesskey+' --AWSBucketName='+awsbucket
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
