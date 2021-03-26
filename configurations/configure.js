const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

module.exports ={
  createconfigs: async function createconfigs() {
    //set firewall
    try{

      var removeconfig = 'sudo rm -rf /root/.origintrail_noderc'
      await exec(removeconfig);

      //build the node config file mainnet
      console.log('\x1b[35m',"Writing node configuration file...");
      var node = 'sudo cp '+ __dirname+'/node_config.json /root/.origintrail_noderc'
      await exec(node);

      console.log('\x1b[35m',"Checking configuration for syntax errors...");
      var jqcheck = 'jq "." /root/.origintrail_noderc'
      await exec(jqcheck);

      console.log('\x1b[32m',"Node configuration has been created.",'\n');
      return 'success';

    }catch(e){
      console.error('\x1b[31m',e,'Failed to create configurations.');
      return 'fail';
    }
  }
}
