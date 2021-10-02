const overlay = require('../start_overlay.js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('../configurations/overlay_config.json');
const node_config = require('../configurations/node_config.json');
const dateFormat = require('dateformat');
const prompts = require('prompts');

module.exports={
    //prechecks for docker and jq
    log_menu: async function menu(){
      try {
        console.log('\x1b[35m', "[1] - Display node logs");
        console.log('\x1b[35m', "[2] - Archive node logs to ~/OTLogArchives");
        console.log('\x1b[35m', "[3] - Display Log file info");
        console.log('\x1b[35m', "[4] - Display Archives");
        console.log('\x1b[35m', "[5] - Delete Archives");
        console.log('\x1b[35m', "[0] - Return to main menu");

        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWhat would you like to do?'
        });

        if(response.response == '1'){
          module.exports.display_logs();

        }else if(response.response == '2'){
          module.exports.archive_logs();

        }else if(response.response == '3'){
          module.exports.log_info();

        }else if(response.response == '4'){
          module.exports.display_archives();

        }else if(response.response == '5'){
          module.exports.delete_archives();

        }else if(response.response == '0'){
          const overlay = require('../start_overlay.js');
          overlay.menu();

        }else{
          console.log('\x1b[31m',"Exited Log Menu.");
          const overlay = require('../start_overlay.js');
          overlay.menu();
        }
    }catch(e){
      console.log('\x1b[31m Something broke in the log menu: '+ e,'\n');
    }
  },

  display_logs: async function option_1(){
    try {
      var logs = "sudo docker logs otnode --since 24h"
      var { stdout, stderr } = await exec(logs,{maxBuffer: 1024 * 2000});
      console.log(stdout)

      module.exports.log_menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  archive_logs: async function option_2(){
    try{
      var logpath ="sudo docker inspect -f '{{.LogPath}}' otnode"
      var { stdout, stderr } = await exec(logpath);
      var logpath = stdout;

      var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");

      console.log('\x1b[35m','Copying Logs...');
      var copyLogs = 'sudo mkdir -p /root/OTLogArchives/nodeLogs && sudo docker cp otnode:/ot-node/current/logs /root/OTLogArchives/nodeLogs';
      await exec(copyLogs);
      console.log('\x1b[32m','Logs copied.','\n');

      console.log('\x1b[35m','Archiving Logs...');
      var archiveCopy = 'sudo tar -czf /root/OTLogArchives/nodeLogs_'+date+'.tar --absolute-names /root/OTLogArchives/nodeLogs';
      await exec(archiveCopy);
      console.log('\x1b[32m','Logs Archived.','\n');

      var trimCopy = 'sudo rm -rf /root/OTLogArchives/nodeLogs';
      await exec(trimCopy);

      console.log('\x1b[35m','Deleting unarchived logs...');
      var del_logs = 'sudo truncate -s0 '+ logpath
      await exec(del_logs);
      console.log('\x1b[32m','Logs have been archived!','\n');

      var displayarchives = "sudo ls /root/OTLogArchives"
      var { stdout, stderr } = await exec(displayarchives);
      console.log('\x1b[35m',"----------------Log Archives----------------");
      console.log(stdout);

      module.exports.log_menu();
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  log_info: async function option_3(){
    try{
      var logpath ="sudo docker inspect -f '{{.LogPath}}' otnode"
      var { stdout, stderr } = await exec(logpath);
      var logpath = stdout;

      var get_log_size = "sudo ls -l --block-size=M " +logpath
      var { stdout, stderr } = await exec(get_log_size);
      console.log('\x1b[35m',stdout);

      module.exports.log_menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  display_archives: async function option_4(){
    try{
      var displayarchives = "sudo ls /root/OTLogArchives"
      var { stdout, stderr } = await exec(displayarchives);
      console.log('\x1b[35m',"----------------Log Archives----------------");
      console.log(stdout);

      module.exports.log_menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  delete_archives: async function option_5(){
    try{
      var delete_archives = 'sudo rm -rf /root/OTLogArchives/*'
      await exec(delete_archives);

      var displayarchives = "sudo ls /root/OTLogArchives"
      var { stdout, stderr } = await exec(displayarchives);
      console.log('\x1b[35m',"----------------Log Archives----------------");
      console.log(stdout);

      module.exports.log_menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  }
}
