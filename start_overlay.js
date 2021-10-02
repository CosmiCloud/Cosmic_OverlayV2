const prompts = require('prompts');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('./configurations/overlay_config.json');
const node_config = require('./configurations/node_config.json');
const prechecks = require('./scripts/Utility/Pre/checks.js');
const dashboard = require('./scripts/Utility/Pre/dashboard.js');
const installMenu = require('./scripts/installMenu.js');
const backupMenu = require('./scripts/backupMenu.js');
const scriptsMenu = require('./scripts/scriptsMenu.js');
const logMenu = require('./scripts/logMenu.js');
const controlsMenu = require('./scripts/controlsMenu.js');
const creatorsMenu = require('./scripts/creatorsMenu.js');



module.exports ={
  menu: async function menu(){
  try{
    (async () => {
      const otexist = await prechecks.otexist();

      if(otexist){
        otexists = 'yes';
        const nodestat = await prechecks.nodestatus();
        if(nodestat == 'online'){
          nodestatus = "\x1b[32mOnline";

          await dashboard.stakes();
        }else{
          nodestatus = "\x1b[31mOffline";
        }

      }else{
        otexists = 'no';
        nodestatus = "\x1b[31mOffline";
      }

      console.log('\x1b[35m',"--------------------------[Node Status:"+nodestatus+"\x1b[35m]--------------------------");
  		console.log('\x1b[35m',"[1] - Install Menu");
  		console.log('\x1b[35m',"[2] - Back Up Menu");
  		console.log('\x1b[35m',"[3] - Scripts Menu");
  		console.log('\x1b[35m',"[4] - Log Menu");
  		console.log('\x1b[35m',"[5] - Node Controls");
      console.log('\x1b[35m',"[6] - Creators Menu");
      console.log('\x1b[35m',"[0] - Exit",'\n');
      console.log('\x1b[35m',"[R] - Refresh Dashboard");

          const response = await prompts({
            type: 'text',
            name: 'response',
            message: '\x1b[35mPlease select a menu item:'
          });

          if(response.response == '1'){
            await installMenu.install_menu();

          }else if(response.response == '2'){
            await backupMenu.backup_menu();

          }else if(response.response == '3'){
            await scriptsMenu.scripts_menu();

          }else if(response.response == '4'){
            await logMenu.log_menu();

          }else if(response.response == '5'){
            await controlsMenu.controls_menu();

          }else if(response.response == '6'){
            await creatorsMenu.creators_menu();

          }else if(response.response == '0'){
            console.log('\x1b[31m',"Exited Main Menu.");

          }else if(response.response == 'R' || response.response == 'r'){
            module.exports.menu();

          }else{
            console.log('\x1b[31m',"Exited Main Menu.");
          }
        })();
      }catch(e){
        console.log('\x1b[31m',e);
      }
  }
}
module.exports.menu();
