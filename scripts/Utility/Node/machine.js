const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports={
  firewall: async function firewall() {
    //set firewall
    try{
      console.log('\x1b[35m','Configuring firewall..');
      var allow1 = 'sudo ufw allow 8900'
      await exec(allow1,{});

      var allow2 = 'sudo ufw allow 5278'
      await exec(allow2,{});

      var allow3 = 'sudo ufw allow 3000'
      await exec(allow3,{});

      var allow4 = 'sudo ufw allow 22/tcp'
      await exec(allow4,{});

      console.log('\x1b[32m',"Firewall configured.",'\n');

      //enable firewall
      console.log('\x1b[35m',"Enabling firewall...");
      var enable_firewall = 'sudo ufw --force enable'
      await exec(enable_firewall);
      console.log('\x1b[32m',"Firewall enabled.",'\n');

      //display firewall
      console.log('\x1b[32m',"Displaying firewall setting...");
      var fwStatus = 'sudo ufw status'
      const fwstatus = await exec(fwStatus);
      console.log(fwstatus.stdout);

    }catch(e){
      console.error('\x1b[31m',e);
      return 'fail';
    }
  }
}
