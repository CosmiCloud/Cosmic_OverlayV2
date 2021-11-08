const overlay = require('../start_overlay.js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('../configurations/overlay_config.json');
const node_config = require('../configurations/node_config.json');
const prompts = require('prompts');
const heartbeat = overlay_config.scripts.heartbeat.enabled;
const log_not = overlay_config.scripts.log_notifications.enabled;
const log_arch = overlay_config.scripts.log_archiving.enabled;
const aws_backup = overlay_config.scripts.aws_backup.enabled;
const report = overlay_config.scripts.report.enabled;
const create_aws_job = overlay_config.scripts.create_aws_job.enabled;

module.exports={
    //prechecks for docker and jq
    scripts_menu: async function menu(){
      try {
        var script_check = "sudo forever list"
        var scripts_status = await exec(script_check);
        var scripts_status = scripts_status.stdout

        var n = scripts_status.includes("notification")
        var n = n.toString();

        if (n == 'true'){
          var status = "\x1b[32mActive";
        }else{
          var status = "\x1b[31mDeactivated";;
        }

        console.log("\x1b[35m-----------------------[Scripts Status:"+status+"\x1b[35m]-----------------------",'\n');
        if(heartbeat == 'true'){
          console.log('\x1b[35m', "Node Heartbeat: ",'\x1b[32m', "                    [Enabled]");
        }else{
          console.log('\x1b[35m', "Node Heartbeat: ",'\x1b[31m', "                    [Disabled]");
        }
        if(log_not == 'true'){
          console.log('\x1b[35m', "Automated Log Notifications: ",'\x1b[32m', "       [Enabled]");
        }else{
          console.log('\x1b[35m', "Automated Log Notifications: ",'\x1b[31m', "       [Disabled]");
        }
        if(log_arch == 'true'){
          console.log('\x1b[35m', "Automated Log Archiving: ",'\x1b[32m', "           [Enabled]");
        }else{
          console.log('\x1b[35m', "Automated Log Archiving: ",'\x1b[31m', "           [Disabled]");
        }
        if(aws_backup == 'true'){
          console.log('\x1b[35m', "Automated AWS Restic Backups: ",'\x1b[32m', "      [Enabled]");
        }else{
          console.log('\x1b[35m', "Automated AWS Restic Backups: ",'\x1b[31m', "      [Disabled]");
        }
        if(report == 'true'){
          console.log('\x1b[35m', "Daily Reports: ",'\x1b[32m', "                     [Enabled]");
        }else{
          console.log('\x1b[35m', "Daily Reports: ",'\x1b[31m', "                     [Disabled]");
        }
        if(create_aws_job == 'true'){
          console.log('\x1b[35m', "Scheduled AWS to ODN Uploads: ",'\x1b[32m', "      [Enabled]");
        }else{
          console.log('\x1b[35m', "Scheduled AWS to ODN Uploads: ",'\x1b[31m', "      [Disabled]");
        }
        console.log(" ");
        console.log('\x1b[35m', "[1] - Start maintenance scripts");
        console.log('\x1b[35m', "[2] - Stop maintenance scripts");
        console.log('\x1b[35m', "[3] - Restart maintenance scripts");
        console.log('\x1b[35m', "[0] - Return to main menu",'\n');

        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWhat would you like to do?'
        });

        if(response.response == '1'){
          module.exports.start_scripts();

        }else if(response.response == '2'){
          module.exports.stop_scripts();

        }else if(response.response == '3'){
          module.exports.restart_scripts();

        }else if(response.response == '0'){
          const overlay = require('../start_overlay.js');
          overlay.menu();

        }else{
          console.log('\x1b[31m',"Exited Scripts Menu.");
          const overlay = require('../start_overlay.js');
          overlay.menu();
        }
    }catch(e){
      console.log('\x1b[31m Something broke in the scripts menu: '+ e,'\n');
    }
  },

  start_scripts: async function option_1(){
    try {
      var start = 'cd ./cron-jobs-node && sudo forever start notification.js && sudo forever start archive.js && sudo forever start awsbackup.js && sudo forever start ping.js && sudo forever start report.js && sudo forever start awsjob.js'
      console.log('\x1b[35m',"Starting scripts...");
      await exec(start);
      console.log('\x1b[32m',"Scripts have started!");

      const overlay = require('../start_overlay.js');
      overlay.menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  stop_scripts: async function option_2(){
    try{
      var script_check = "sudo forever list"
      var scripts_status = await exec(script_check);
      var scripts_status = scripts_status.stdout

      var n = scripts_status.includes("notification")
      var n = n.toString();

      if (n == 'true'){
        var stop = 'cd ./cron-jobs-node && sudo forever stop notification.js && sudo forever stop archive.js && sudo forever stop awsbackup.js && sudo forever stop ping.js && sudo forever stop report.js && sudo forever stop awsjob.js && sudo rm -rf /root/.forever/'
        console.log('\x1b[35m',"Stopping scripts...");
        await exec(stop);
        console.log('\x1b[32m',"Scripts have stopped!");
        module.exports.scripts_menu();
      }else{
        console.log("\x1b[33mScripts are already deacivated!");
        module.exports.scripts_menu();
      }
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  restart_scripts: async function option_3(){
    try{
      var script_check = "sudo forever list"
      var scripts_status = await exec(script_check);
      var scripts_status = scripts_status.stdout

      var n = scripts_status.includes("notification")
      var n = n.toString();

      if (n == 'true'){
        var restart = 'cd ./cron-jobs-node && sudo forever restart notification.js && sudo forever restart archive.js && sudo forever restart awsbackup.js && sudo forever restart ping.js && sudo forever restart report.js'
        console.log('\x1b[35m',"Restarting scripts...");
        await exec(restart);
        console.log('\x1b[32m',"Scripts have restarted!");

        module.exports.scripts_menu();
      }else{
        console.log("\x1b[33mThere are no activated scripts to restart!");
        module.exports.scripts_menu();
      }
    }catch(e){
      console.log('\x1b[31m',e);
    }
  }
}
