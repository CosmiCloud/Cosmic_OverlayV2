const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dateFormat = require('dateformat');

module.exports ={

  logs: async function logs(){
    try{
      var logs = "sudo docker logs otnode --since 24h"
      var { stdout, stderr } = await exec(logs,{maxBuffer: 1024 * 2000});
      console.log(stdout);
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  deletearchives: async function delete_archives(){
    try{
      var delete_archives = 'sudo rm -rf /root/OTLogArchives/*'
      await exec(delete_archives);

      var displayarchives = "sudo ls /root/OTLogArchives"
      var { stdout, stderr } = await exec(displayarchives);
      console.log('\x1b[35m',"----------------Log Archives----------------");
      console.log(stdout);

      var overlay = require('../../../start_overlay.js');
      await overlay.menu();
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  logarchiving: async function logarchiving(){
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

          var overlay = require('../../../start_overlay.js');
          await overlay.menu();
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  logsize: async function logsize(){
    try{
      var logpath ="sudo docker inspect -f '{{.LogPath}}' otnode"
      var { stdout, stderr } = await exec(logpath);
      var logpath = stdout;

      var get_log_size = "sudo ls -l --block-size=M " +logpath
      var { stdout, stderr } = await exec(get_log_size);
      console.log('\x1b[35m',stdout);

      var overlay = require('../../../start_overlay.js');
      await overlay.menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  displayarchives: async function displayarchives(){
    try{
      var displayarchives = "sudo ls /root/OTLogArchives"
      var { stdout, stderr } = await exec(displayarchives);
      console.log('\x1b[35m',"----------------Log Archives----------------");
      console.log(stdout);

      var overlay = require('../../../start_overlay.js');
      await overlay.menu();
    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
  }
}
