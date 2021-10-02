const util = require('util');
const exec = util.promisify(require('child_process').exec);
const machine = require('./Utility/Node/machine.js');
const node_configure = require('../configurations/configure.js');
const install = require('./Utility/Node/install.js');
const restore = require('./Utility/Node/restore.js');
const aws = require('./AWS/aws.js');
const prechecks = require('./Utility/Pre/checks.js');
const overlay_config = require('../configurations/overlay_config.json');
const node_config = require('../configurations/node_config.json');
const prompts = require('prompts');
const s3_url_of_backup = overlay_config.scripts.s3_url_of_backup;

module.exports={
    install_menu: async function menu(){
      try {
        console.log('\x1b[35m',"[1] - Install a new node");
        console.log('\x1b[35m',"[2] - Restore a node directly from AWS bucket: ");
        console.log('\x1b[32m',"      "+s3_url_of_backup);
        console.log('\x1b[35m',"[3] - Restore a node from local backup from /root/OTBackup");
        console.log('\x1b[35m',"[0] - Return to main menu",'\n');

            const response = await prompts({
              type: 'text',
              name: 'response',
              message: '\x1b[35mWhat would you like to do?'
            });

            if(response.response == '1'){
              module.exports.new_node();

            }else if(response.response == '2'){
              module.exports.restore_node();

            }else if(response.response == '3'){
              module.exports.restore_local();

            }else if(response.response == '0'){
              const overlay = require('../start_overlay.js');
              overlay.menu();

            }else{
              const overlay = require('../start_overlay.js');
              console.log('\x1b[31m',"Exited Install Menu.");
              overlay.menu();
            }
    }catch(e){
      console.log('\x1b[31m Something broke in the install menu: '+ e,'\n');
    }
  },

  new_node: async function option_1(){
    try{
      const otexist = await prechecks.otexist();
      if(otexists == 'yes'){
         console.log('\x1b[33m',"otnode already exists!");
       }else{
         await machine.firewall();

         await node_configure.createconfigs();

         (async () => {
           console.log('\x1b[33m',"You are about to install a new node.");
           const response = await prompts({
             type: 'text',
             name: 'response',
             message: '\x1b[35mAre you ready? (y/n)?'
           });

           if(response.response == 'y' || response.response == 'yes'){
             await install.newnode();

           }else{
             console.log('\x1b[31m',"Exited Install Menu.");
             const overlay = require('../start_overlay.js');
             overlay.menu();
           }
         })();
       }
    }catch(e){
      console.log('\x1b[31m Something broke in the node install menu: '+ e,'\n')
    }
  },

  restore_node: async function option_2(){
    try{
      const otexist = await prechecks.otexist();
      if(otexists == 'yes'){
         console.log('\x1b[33m',"otnode already exists!");
       }else{
         await aws.awscli();
         await aws.s3download();

         (async () => {
           console.log('\x1b[33m',"You are about to restore a node directly from your aws bucket: "+s3_url_of_backup+' on '+overlay_config.environment,'\n');
           const response = await prompts({
             type: 'text',
             name: 'response',
             message: '\x1b[35mAre you ready? (y/n)?'
           });

           if(response.response == 'y' || response.response == 'yes'){
             await machine.firewall();
             await node_configure.createconfigs();
             await restore.aws_restore();

           }else{
             console.log('\x1b[31m',"Exited Install Menu.");
             const overlay = require('../start_overlay.js');
             overlay.menu();
           }
         })();
       }
    }catch(e){
      console.log('\x1b[31m Something broke in the node restore menu: '+ e,'\n');
    }
  },

  restore_local: async function option_3(){
    try{
      const otexist = await prechecks.otexist();
      if(otexists == 'yes'){
         console.log('\x1b[33m',"otnode already exists!");
       }else{
         (async () => {
           console.log('\x1b[33m',"You are about to restore a node directly from /root/OTBackups/backup");
           const response = await prompts({
             type: 'text',
             name: 'response',
             message: '\x1b[35mAre you ready? (y/n)?'
           });

           if(response.response == 'y' || response.response == 'yes'){
             await machine.firewall();
             await node_configure.createconfigs();
             await restore.local_restore();

           }else{
             console.log('\x1b[31m',"Exited Install Menu.");
             const overlay = require('../start_overlay.js');
             overlay.menu();
           }
         })();
       }
    }catch(e){
      console.log('\x1b[31m Something broke in the local node restore menu: '+ e,'\n');
    }
  }
}
