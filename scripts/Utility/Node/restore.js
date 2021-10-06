const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const prompts = require('prompts');
const overlay_config = require('../../../configurations/overlay_config.json');
const node_config = require('../../../configurations/node_config.json');

module.exports ={
  aws_restore: async function restore(){
    try{
      console.log('\x1b[35m','Node Configuration:');
      var nodecfg = 'sudo cat /root/.origintrail_noderc'
      var nodecfg = await exec(nodecfg);
      console.log('\x1b[32m',nodecfg.stdout);

      var ethereum_warn = ''
      var polkadot_warn = ''
      var xDai_warn = ''
      var polygon_warn = ''
      var rinkeby_warn = ''
      var rinkeby2_warn = ''

      const implementations = node_config.blockchain.implementations;
      var chain_count  = Object.keys(implementations).length;
      var chain_count = Number(chain_count);

      for(var i = 0; i < chain_count; i++) {
        var obj = Object.entries(implementations)[i];
        var obj = obj[1];
        var blockchain = obj.network_id

        if (blockchain == 'ethr:mainnet'){
          var ethereum_warn = 'You are restoring to the Ethereum blockchain.'
        }

        if (blockchain == 'polkadot:mainnet'){
          var polkadot_warn = 'You are restoring to the Polkadot parachain.'
        }

        if (blockchain == 'xdai:mainnet'){
          var xDai_warn = 'You are restoring to the xDai blockchain.'
        }

        if (blockchain == 'polygon:mainnet'){
          var poly_warn = 'You are restoring to the Polygon blockchain.'
        }

        if (blockchain == 'ethr:rinkeby:1'){
          var rinkeby_warn = 'You are restoring to the Rinkeby testnet blockchain.'
        }

        if (blockchain == 'ethr:rinkeby:2'){
          var rinkeby2_warn = 'You are restoring a 2nd profile to the Rinkeby testnet blockchain.'
        }
      }

      if(overlay_config.environment == 'development'){
        var restore =  "sudo /root/OTRestore/restore.sh --environment=development --backupDir=/root/OTawsbackup"
        var image =  'sudo docker create --log-driver json-file --log-opt max-size=50m --name=otnode --hostname='+node_config.network.hostname+' -p 8900:8900 -p 5278:5278 -p 3000:3000 -e LOGS_LEVEL_DEBUG=1 -e SEND_LOGS=1 -v ~/certs/:/ot-node/certs/ -v ~/.origintrail_noderc:/ot-node/.origintrail_noderc quay.io/origintrail/otnode-test:feature_blockchain-service'
      }else if(overlay_config.environment == 'testnet'){
        var restore =  "sudo /root/OTRestore/restore.sh --backupDir=/root/OTawsbackup"
        var image =  'sudo docker create --log-driver json-file --log-opt max-size=50m --name=otnode -p 8900:8900 -p 5278:5278 -p 3000:3000 -v ~/.origintrail_noderc:/ot-node/.origintrail_noderc origintrail/ot-node:release_testnet'
      }else if(overlay_config.environment == 'mainnet'){
        var restore =  "sudo /root/OTRestore/restore.sh --backupDir=/root/OTawsbackup"
        var image =  'sudo docker create --log-driver json-file --log-opt max-size=50m --name=otnode -p 8900:8900 -p 5278:5278 -p 3000:3000 -v ~/.origintrail_noderc:/ot-node/.origintrail_noderc origintrail/ot-node:release_mainnet'
      }

      console.log('\x1b[33m',"#################################### WARNING ################################");
      console.log('\x1b[33m',"You are about to restore your OriginTrail node onto the "+overlay_config.environment+" environment.");
      console.log('\x1b[33m',"Please confirm the above information before confirming the restore.");
      if(ethereum_warn){
        console.log('\x1b[33m',ethereum_warn);
      }
      if(polkadot_warn){
        console.log('\x1b[33m',polkadot_warn);
      }
      if(xDai_warn){
        console.log('\x1b[33m',xDai_warn);
      }
      if(polygon_warn){
        console.log('\x1b[33m',polygon_warn);
      }
      if(rinkeby_warn){
        console.log('\x1b[33m',rinkeby_warn);
      }
      if(rinkeby2_warn){
        console.log('\x1b[33m',rinkeby2_warn);
      }
      console.log('\x1b[33m',"Restore cannot be stopped once setting are confirmed.");
      console.log('\x1b[33m',"#################################### WARNING ################################",'\n');

      (async () => {
        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mIs the above information correct? (y/n)'
        });

        if(response.response == 'y' || response.response == 'yes'){
          //download image
          console.log('\x1b[35m',"Downloading otnode image...");
          console.log('\x1b[35m',"This may take awhile...");
          await exec(image);

          console.log('\x1b[32m',"Otnode image has been installed.",'\n');
          var copyscript = "sudo mkdir -p /root/OTRestore && sudo docker cp otnode:/ot-node/current/scripts/restore.sh /root/OTRestore"
          await exec(copyscript);

          //run restore script
          console.log('\x1b[32m',"Node restore started!",'\n');
          await exec(restore);

          var rm_backup = 'sudo rm -rf /root/OTawsbackup'
          await exec(rm_backup);

          //move arango db text file
          console.log('\x1b[35m',"Moving an arango.txt file that can sometimes interfer with node backups to /root/OTarango_backup ...",'\n');
          console.log('\x1b[35m',"Locating init directory for the container...");
          var find_init = 'sudo find /var/lib/docker/overlay2/ -maxdepth 1 -name "*-init"'
          const { stdout, stderr } = await exec(find_init);
          console.log('\x1b[32m',"Container init directory has been located.",'\n');

          var container = stdout.slice(0,-6);
          var container = stdout.slice(25,-6);
          var move = 'sudo mkdir -p /root/OTarango_backup && sudo mv /var/lib/docker/overlay2/' +container+ '/merged/ot-node/data/arango.txt /root/OTarango_backup'
          await exec(move);

          console.log('\x1b[32m',"Arango.txt moved from /var/lib/docker/overlay2/"+container+"/merged/ot-node/data/ to /root/OTarango_backup",'\n');
          var query = "sudo docker logs --since 2s otnode"
          var time = 1;
          //display logs
          console.log('\x1b[32m',"--------------------------------DISPLAYING LOGS------------------------------",'\n');
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
			console.log('\x1b[31m',"Exited Restore Menu.");
        }
      })();
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },
  local_restore: async function restore(){
    try{
      console.log('\x1b[35m','Node Configuration:');
      var nodecfg = 'sudo cat /root/.origintrail_noderc'
      var nodecfg = await exec(nodecfg);
      console.log('\x1b[32m',nodecfg.stdout);

      var ethereum_warn = ''
      var polkadot_warn = ''
      var xDai_warn = ''
      var polygon_warn = ''
      var rinkeby_warn = ''
      var rinkeby2_warn = ''

      const implementations = node_config.blockchain.implementations;
      var chain_count  = Object.keys(implementations).length;
      var chain_count = Number(chain_count);

      for(var i = 0; i < chain_count; i++) {
        var obj = Object.entries(implementations)[i];
        var obj = obj[1];
        var blockchain = obj.network_id

        if (blockchain == 'ethr:mainnet'){
          var ethereum_warn = 'You are restoring to the Ethereum blockchain.'
        }

        if (blockchain == 'polkadot:mainnet'){
          var polkadot_warn = 'You are restoring to the Polkadot parachain.'
        }

        if (blockchain == 'xdai:mainnet'){
          var xDai_warn = 'You are restoring to the xDai blockchain.'
        }

        if (blockchain == 'polygon:mainnet'){
          var poly_warn = 'You are restoring to the Polygon blockchain.'
        }

        if (blockchain == 'ethr:rinkeby:1'){
          var rinkeby_warn = 'You are restoring to the Rinkeby testnet blockchain.'
        }

        if (blockchain == 'ethr:rinkeby:2'){
          var rinkeby2_warn = 'You are restoring a 2nd profile to the Rinkeby testnet blockchain.'
        }
      }

      if(overlay_config.environment == 'development'){
        var restore =  "sudo /root/OTRestore/restore.sh --environment=development --backupDir=/root/OTBackup"
        var image =  'sudo docker create --log-driver json-file --log-opt max-size=1g --name=otnode --hostname='+node_config.network.hostname+' -p 8900:8900 -p 5278:5278 -p 3000:3000 -e LOGS_LEVEL_DEBUG=1 -e SEND_LOGS=1 -v ~/certs/:/ot-node/certs/ -v ~/.origintrail_noderc:/ot-node/.origintrail_noderc quay.io/origintrail/otnode-test:feature_blockchain-service'
      }else if(overlay_config.environment == 'testnet'){
        var restore =  "sudo /root/OTRestore/restore.sh --backupDir=/root/OTBackup"
        var image =  'sudo docker create --log-driver json-file --log-opt max-size=1g --name=otnode -p 8900:8900 -p 5278:5278 -p 3000:3000 -v ~/.origintrail_noderc:/ot-node/.origintrail_noderc origintrail/ot-node:release_testnet'
      }else if(overlay_config.environment == 'mainnet'){
        var restore =  "sudo /root/OTRestore/restore.sh --backupDir=/root/OTBackup"
        var image =  'sudo docker create --log-driver json-file --log-opt max-size=1g --name=otnode -p 8900:8900 -p 5278:5278 -p 3000:3000 -v ~/.origintrail_noderc:/ot-node/.origintrail_noderc origintrail/ot-node:release_mainnet'
      }

      console.log('\x1b[33m',"#################################### WARNING ################################");
      console.log('\x1b[33m',"You are about to restore your OriginTrail node onto the "+overlay_config.environment+" environment.");
      console.log('\x1b[33m',"Please confirm the above information before confirming the restore.");
      if(ethereum_warn){
        console.log('\x1b[33m',ethereum_warn);
      }
      if(polkadot_warn){
        console.log('\x1b[33m',polkadot_warn);
      }
      if(xDai_warn){
        console.log('\x1b[33m',xDai_warn);
      }
      if(polygon_warn){
        console.log('\x1b[33m',polygon_warn);
      }
      if(rinkeby_warn){
        console.log('\x1b[33m',rinkeby_warn);
      }
      if(rinkeby2_warn){
        console.log('\x1b[33m',rinkeby2_warn);
      }
      console.log('\x1b[33m',"Restore cannot be stopped once setting are confirmed.");
      console.log('\x1b[33m',"#################################### WARNING ################################",'\n');

      (async () => {
        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mIs the above information correct? (y/n)'
        });

        if(response.response == 'y' || response.response == 'yes'){
          //download image
          console.log('\x1b[35m',"Downloading otnode image...");
          console.log('\x1b[35m',"This may take awhile...");
          await exec(image);

          console.log('\x1b[32m',"Otnode image has been installed.",'\n');
          var copyscript = "sudo mkdir -p /root/OTRestore && sudo docker cp otnode:/ot-node/current/scripts/restore.sh /root/OTRestore"
          await exec(copyscript);

          //run restore script
          console.log('\x1b[32m',"Node restore started!",'\n');
          await exec(restore);

          var rm_backup = 'sudo rm -rf /root/OTBackup/*'
          //await exec(rm_backup);

          //move arango db text file
          console.log('\x1b[35m',"Moving an arango.txt file that can sometimes interfer with node backups to /root/OTarango_backup ...",'\n');
          console.log('\x1b[35m',"Locating init directory for the container...");
          var find_init = 'sudo find /var/lib/docker/overlay2/ -maxdepth 1 -name "*-init"'
          const { stdout, stderr } = await exec(find_init);
          console.log('\x1b[32m',"Container init directory has been located.",'\n');

          var container = stdout.slice(0,-6);
          var container = stdout.slice(25,-6);
          var move = 'sudo mkdir -p /root/OTarango_backup && sudo mv /var/lib/docker/overlay2/' +container+ '/merged/ot-node/data/arango.txt /root/OTarango_backup'
          await exec(move);

          console.log('\x1b[32m',"Arango.txt moved from /var/lib/docker/overlay2/"+container+"/merged/ot-node/data/ to /root/OTarango_backup",'\n');
          var query = "sudo docker logs --since 2s otnode"
          var time = 1;
          //display logs
          console.log('\x1b[32m',"--------------------------------DISPLAYING LOGS------------------------------",'\n');
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
			console.log('\x1b[31m',"Exited Restore Menu.");
        }
      })();
    }catch(e){
      console.log('\x1b[31m',e);
    }
  }
}
