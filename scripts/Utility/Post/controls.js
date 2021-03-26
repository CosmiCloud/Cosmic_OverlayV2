const util = require('util');
const exec = util.promisify(require('child_process').exec);
const node_configure = require('../../../configurations/configure.js');

module.exports ={

  restart: async function restart(){
    try{
      if(await node_configure.createconfigs() == 'fail'){
        return;
      }

      console.log('\x1b[35m',"Restarting node...");
      var restart = 'sudo docker restart otnode'
      await exec(restart);

      console.log('\x1b[32m',"Node has restarted.",'\n');
    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
},

  start: async function start(){
    console.log('\x1b[35m',"Starting node...");
      try{
        if(await node_configure.createconfigs() == 'fail'){
          return;
        }

        var start = 'sudo docker start otnode'
        await exec(start);

        console.log('\x1b[32m',"Node has started.",'\n');
      }catch(e){
        console.log('\x1b[31m',e);
        return'fail';
    }
  },

  stop: function stop(){
      console.log('\x1b[35m',"Stopping node...");
      var stop = 'sudo docker stop otnode'

      exec(stop, (error, success, stderr) => {
          if (error){
              console.log('\x1b[31m',"Node stop failed: " + error);
              return'fail';
          }else{
              console.log('\x1b[32m',"Node has stopped.",'\n');
          }
      });
  },

  credits: async function credits(){
      console.log('\x1b[35m',"Presenting node credentials...",'\n');
      var rinkeby_id = 'echo $(sudo docker exec otnode cat /ot-node/data/rinkeby_identity.json)'
      var rinkeby_id2 = 'echo $(sudo docker exec otnode cat /ot-node/data/rinkeby_2_erc725_identity.json)'
      var erc725_id = 'echo $(sudo docker exec otnode cat /ot-node/data/erc725_identity.json)'
      var starfleet_id = 'echo $(sudo docker exec otnode cat /ot-node/data/sfc_erc725_identity.json)'
      var xDai_id = 'echo $(sudo docker exec otnode cat /ot-node/data/xdai_erc725_identity.json)'
      var log_identity = 'echo $(sudo docker exec otnode cat /ot-node/data/identity.json)'
      var log_houstonpw = 'echo $(sudo docker exec otnode cat /ot-node/data/houston.txt)'

      exec(rinkeby_id, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"Rinkeby Identity: ",'\x1b[32m', success);
        }
      });

      exec(rinkeby_id2, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"Rinkeby Identity 2: ",'\x1b[32m', success);
        }
      });

      exec(erc725_id, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"ERC725 Identity: ",'\x1b[32m', success);
        }
      });

      exec(starfleet_id, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"Starfleet Identity: ",'\x1b[32m', success);
        }
      });

      exec(xDai_id, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"xDai Identity: ",'\x1b[32m', success);
        }
      });

      exec(log_identity, (error, success, stderr) => {
        if (stderr){
          console.log('\x1b[31m',"Failed to return node identity: " + error);
          callback('fail');
        }else{
          console.log('\x1b[35m',"Node Identity Key: ",'\x1b[32m', success);
        }
      });

      exec(log_houstonpw, (error, success, stderr) => {
        if (stderr){
          console.log('\x1b[31m',"Failed to return houston password: " + error);
          callback('fail');
        }else{
          console.log('\x1b[35m',"Houston Password: ",'\x1b[32m', success);
        }
      });
  },
  cleanbackups: async function cleanbackups(){
    try{
      console.log('\x1b[35m',"Deleting node backups in /root/OTBackups/backup/* ...");
      var cleanbackups = 'sudo rm -rf /root/OTBackups/backup/*'
      await exec(cleanbackups);

      var displaybackups = 'sudo ls /root/OTBackups/backup'
      const { stdout, stderr } = await exec(displaybackups);

      console.log('\x1b[35m',"-------Back up files-------");
      console.log(stdout);

      return'success';

    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
  },
  createbackup: async function backup(){
    try {
      console.log('\n','\x1b[35m',"Creating a back up file...");
      var createbackup = 'sudo docker exec otnode node /ot-node/current/scripts/backup.js --configDir=/ot-node/data'
      await exec(createbackup);

      console.log('\x1b[32m',"Back up file successfully created.",'\n');
      console.log('\x1b[35m',"Back up file path: /root/OTBackups/backup",'\n');

      var copybackup = 'sudo mkdir -p /root/OTBackups && sudo docker cp otnode:/ot-node/backup /root/OTBackups'
      await exec(copybackup);

      var displaybackups = 'sudo ls /root/OTBackups/backup'
      const { stdout, stderr } = await exec(displaybackups);

      console.log('\x1b[35m',"-------Back up files-------");
      console.log(stdout);

      var cleannode = 'sudo docker exec otnode rm -rf /ot-node/backup'
      await exec(cleannode);
      console.log('\x1b[33m',"The back up on the node has been removed to preserve space.");

      return'success';

    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
  }
}
