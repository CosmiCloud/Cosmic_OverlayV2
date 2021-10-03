const overlay = require('../start_overlay.js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('../configurations/overlay_config.json');
const node_config = require('../configurations/node_config.json');
const dateFormat = require('dateformat');
const node_configure = require('../configurations/configure.js');
const prompts = require('prompts');

module.exports={
    controls_menu: async function menu(){
      try {
        console.log('\x1b[35m', "[1] - Start node");
        console.log('\x1b[35m', "[2] - Stop node");
        console.log('\x1b[35m', "[3] - Restart node");
        console.log('\x1b[35m', "[4] - Partial Pay All Jobs");
        console.log('\x1b[35m', "[5] - Display node credentials");
        console.log('\x1b[35m', "[0] - Return to main menu",'\n');

        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWhat would you like to do?'
        });

        if(response.response == '1'){
          module.exports.start_node();

        }else if(response.response == '2'){
          module.exports.stop_node();

        }else if(response.response == '3'){
          module.exports.restart_node();

        }else if(response.response == '4'){
          module.exports.payout();

        }else if(response.response == '5'){
          module.exports.credentials();

        }else if(response.response == '0'){
          const overlay = require('../start_overlay.js');
          overlay.menu();

        }else{
          console.log('\x1b[31m',"Exited Controls Menu.");
          const overlay = require('../start_overlay.js');
          overlay.menu();
        }
    }catch(e){
      console.log('\x1b[31m Something broke in the log menu: '+ e,'\n');
    }
  },

  start_node: async function option_1(){
    try {
      await node_configure.createconfigs();

      console.log('\x1b[32m',"Starting node...",'\n');
      var start = 'sudo docker start otnode'
      await exec(start);

      console.log('\x1b[32m',"Node has started.",'\n');

      const overlay = require('../start_overlay.js');
      overlay.menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  stop_node: async function option_2(){
    try{
      console.log('\x1b[35m',"Stopping node...");
      var stop = 'sudo docker stop otnode'
      await exec(stop);

      console.log('\x1b[32m',"Node has stopped.",'\n');
      await module.exports.controls_menu();
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  restart_node: async function option_3(){
    try{
      await node_configure.createconfigs();

      console.log('\x1b[35m',"Restarting node...");
      var restart = 'sudo docker restart otnode'
      await exec(restart);

      console.log('\x1b[32m',"Node has restarted.",'\n');
      await module.exports.controls_menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  payout: async function option_4(){
    try{
      if(overlay_config.environment == 'mainnet'){
        var info = "sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/info?humanReadable=true"
        var info = await exec(info);
        var info = JSON.parse(info.stdout);

        var jerbs = "sudo curl -X GET https://v5api.othub.info/api/nodes/DataHolder/"+info.network.identity+"/jobs"
        var jerbs = await exec(jerbs);
        var jerbs = JSON.parse(jerbs.stdout);

        console.log('\x1b[35m', "[1] - Ethereum");
        console.log('\x1b[35m', "[2] - xDai");
        console.log('\x1b[35m', "[3] - Polygon");
        console.log('\x1b[35m', "[0] - Return to main menu",'\n');

        var response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWhat blockchain would you like to partial pay all jobs from?'
        });

        if(response.response == '1'){
          var blockchain = 'Ethereum'

        }else if(response.response == '2'){
          var blockchain = 'xDai'

        }else if(response.response == '3'){
          var blockchain = 'Polygon'

        }else if(response.response == '0'){
          const overlay = require('../start_overlay.js');
          overlay.menu();

        }else{
          const overlay = require('../start_overlay.js');
          console.log('\x1b[31m',"Exited Install Menu.");
          overlay.menu();
        }

        var response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mAre you sure you want to partial payout all jobs on '+blockchain+'? \x1b[31mThis will cost gas FOR EACH job getting paid out.(y/n)'
        });

        if(response.response == 'y' || response.response == 'yes'){
          for(var i = 0; i < (jerbs.length); i++) {
            if(jerbs[i].BlockchainID == "1" && blockchain == 'Ethereum' && jerbs[i].Paidout == false){
              var offer_id = jerbs[i].OfferId
              var payout_com = "curl -s -X GET http://127.0.0.1:8900/api/latest/payout?offer_id="+offer_id
              var result = await exec(payout_com);
              console.log('\x1b[32m','Triggered eth payout for offer '+jerbs[i].OfferId);
              console.log('\x1b[33m',result.stdout);

            }else if(jerbs[i].BlockchainID == "2" && blockchain == 'xDai' && jerbs[i].Paidout == false){
              var offer_id = jerbs[i].OfferId
              var payout_com = "curl -s -X GET http://127.0.0.1:8900/api/latest/payout?offer_id="+offer_id
              var result = await exec(payout_com);
              console.log('\x1b[32m','Triggered xdai payout for offer '+jerbs[i].OfferId);
              console.log('\x1b[33m',result.stdout);

            }else if(jerbs[i].BlockchainID == "3" && blockchain == 'Polygon' && jerbs[i].Paidout == false){
              var offer_id = jerbs[i].OfferId
              var payout_com = "curl -s -X GET http://127.0.0.1:8900/api/latest/payout?offer_id="+offer_id
              var result = await exec(payout_com);
              console.log('\x1b[32m','Triggered polygon payout for offer '+jerbs[i].OfferId);
              console.log('\x1b[33m',result.stdout);

            }else{
              console.log('\x1b[35m','Skipped payout for offer '+jerbs[i].OfferId+' on '+blockchain+'.')
            }
          }
          await module.exports.controls_menu();
        }else{
          console.log('\x1b[31m',"Exited Payout Menu.");
          await module.exports.controls_menu();
        }
      }else{
        console.log('\x1b[33m','Partial payouts are only offered on mainnet. Sorry!')
        await module.exports.controls_menu();
      }
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  credentials: async function option_5(){
    try{
      console.log('\x1b[35m',"Presenting node credentials...",'\n');
      var rinkeby_identity = 'echo $(sudo docker exec otnode cat /ot-node/data/rinkeby_identity.json)'
      var rinkeby_2_erc725_identity = 'echo $(sudo docker exec otnode cat /ot-node/data/rinkeby_2_erc725_identity.json)'
      var erc725_identity = 'echo $(sudo docker exec otnode cat /ot-node/data/erc725_identity.json)'
      var polkadot_erc725_identity = 'echo $(sudo docker exec otnode cat /ot-node/data/polkadot_identity.json)'
      var polygon_erc725_identity = 'echo $(sudo docker exec otnode cat /ot-node/data/polkadot_identity.json)'
      var xdai_erc725_identity = 'echo $(sudo docker exec otnode cat /ot-node/data/xdai_erc725_identity.json)'
      var identity = 'echo $(sudo docker exec otnode cat /ot-node/data/identity.json)'
      var houston = 'echo $(sudo docker exec otnode cat /ot-node/data/houston.txt)'

      exec(rinkeby_identity, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"Rinkeby Identity: ",'\x1b[32m', success);
        }
      });

      exec(rinkeby_2_erc725_identity, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"Rinkeby Identity 2: ",'\x1b[32m', success);
        }
      });

      exec(erc725_identity, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"ERC725 Identity: ",'\x1b[32m', success);
        }
      });

      exec(polkadot_erc725_identity, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"Parachain Identity: ",'\x1b[32m', success);
        }
      });

      exec(polygon_erc725_identity, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"Parachain Identity: ",'\x1b[32m', success);
        }
      });

      exec(xdai_erc725_identity, (error, success, stderr) => {
        if (stderr){

        }else{
          console.log('\x1b[35m',"xDai Identity: ",'\x1b[32m', success);
        }
      });

      exec(identity, (error, success, stderr) => {
        if (stderr){
          console.log('\x1b[31m',"Failed to return node identity: " + error);
          callback('fail');
        }else{
          console.log('\x1b[35m',"Node Identity Key: ",'\x1b[32m', success);
        }
      });

      exec(houston, (error, success, stderr) => {
        if (stderr){
          console.log('\x1b[31m',"Failed to return houston password: " + error);
          callback('fail');
        }else{
          console.log('\x1b[35m',"Houston Password: ",'\x1b[32m', success);
        }
      });

      const overlay = require('../start_overlay.js');
      overlay.menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  }
}
