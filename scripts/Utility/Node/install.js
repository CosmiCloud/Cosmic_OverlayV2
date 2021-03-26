const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const prompts = require('prompts');
const overlay_config = require('../../../configurations/overlay_config.json');
const node_config = require('../../../configurations/node_config.json');

module.exports ={
  newnode: async function install(){
    try{
      console.log('\x1b[35m','Node Configuration:');
      var nodecfg = 'sudo cat /root/.origintrail_noderc'
      var nodecfg = await exec(nodecfg);
      console.log('\x1b[32m',nodecfg.stdout);

      if(overlay_config.environment == 'development'){
        var install = 'sudo docker run --log-driver json-file --log-opt max-size=1g --name=otnode --hostname='+node_config.network.hostname+' -p 8900:8900 -p 5278:5278 -p 3000:3000 -e LOGS_LEVEL_DEBUG=1 -e SEND_LOGS=1 -v ~/certs/:/ot-node/certs/ -v ~/.origintrail_noderc:/ot-node/.origintrail_noderc quay.io/origintrail/otnode-test:feature_blockchain-service'
      }else if(overlay_config.environment == 'testnet'){
        var install = 'sudo docker run -i --log-driver json-file --log-opt max-size=1g --name=otnode -p 8900:8900 -p 5278:5278 -p 3000:3000 -v ~/.origintrail_noderc:/ot-node/.origintrail_noderc quay.io/origintrail/otnode:release_testnet'
      }else if(overlay_config.environment == 'mainnet'){
        var install = 'sudo docker run -i --log-driver json-file --log-opt max-size=1g --name=otnode -p 8900:8900 -p 5278:5278 -p 3000:3000 -v ~/.origintrail_noderc:/ot-node/.origintrail_noderc quay.io/origintrail/otnode:release_mainnet'
      }

      console.log('\x1b[33m',"You are about to install your OriginTrail node onto the "+overlay_config.environment+" environment.");
      console.log('\x1b[33m',"Please confirm the above information before confirming the install.");

      const implementations = node_config.blockchain.implementations;
      var chain_count  = Object.keys(implementations).length;
      var chain_count = Number(chain_count);
      
      for(var i = 0; i < chain_count; i++) {
        var obj = Object.entries(implementations)[i];
        var obj = obj[1];
        var blockchain = obj.network_id

        console.log('You are installing to '+blockchain+'.')

      }

      console.log('\x1b[33m',"Install cannot be stopped once setting are confirmed.");
      console.log('\x1b[33m',"#################################### WARNING ################################",'\n');

      (async () => {
        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mIs the above information correct? (y/n)'
        });

        if(response.response == 'y' || response.response == 'yes'){
                console.log('\x1b[35m', "Installing node to "+overlay_config.environment+"...");
                console.log('\x1b[35m', "This may take awhile...");

                exec(install);

                console.log('\x1b[32m',"--------------------------------DISPLAYING LOGS------------------------------",'\n');
                var query = "sudo docker logs --since 2s otnode"
                var time = 1;
                //display logs
                var interval = setInterval(function() {
                   if (time <= 600) {
                     exec(query, (error, success, stderr) => {
                       if(stderr){

                       }else if (success == ""){
                         var autostart = 'sudo docker update --restart=always otnode'
                         exec(autostart);
                       }else{
                         console.log(success);
                         time++;
                       }
                      });
                   }else{
                     clearInterval(interval);
                   }
                }, 2000);
                return'success';

			}else{
			console.log('\x1b[31m',"Exited Install Menu.");
        }
      })();
    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
  }
}
