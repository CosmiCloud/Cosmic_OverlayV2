const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports ={

  startscripts: async function start(){
    try{
      var start = 'cd ./cron-jobs-node && sudo forever start notification.js && sudo forever start archive.js && sudo forever start awsbackup.js && sudo forever start ping.js && sudo forever start report.js'
      console.log('\x1b[35m',"Starting scripts...");
      await exec(start);
      console.log('\x1b[32m',"Scripts have started!");

      var overlay = require('../../../start_overlay.js');
      await overlay.menu();
      
    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  stopscripts: async function stop(){
    try{
      var stop = 'cd ./cron-jobs-node && sudo forever stop notification.js && sudo forever stop archive.js && sudo forever stop awsbackup.js && sudo forever stop ping.js && sudo forever stop report.js && sudo rm -rf /root/.forever/'
      console.log('\x1b[35m',"Stopping scripts...");
      await exec(stop);
      console.log('\x1b[32m',"Scripts have stopped!");

      var overlay = require('../../../start_overlay.js');
      await overlay.menu();

    }catch(e){
      //console.log('\x1b[31m',e);
    }
  },

  restartscripts: async function restart(){
    try{
      var restart = 'cd ./cron-jobs-node && sudo forever restart notification.js && sudo forever restart archive.js && sudo forever restart awsbackup.js && sudo forever restart ping.js && sudo forever restart report.js'
      console.log('\x1b[35m',"Restarting scripts...");
      await exec(restart);
      console.log('\x1b[32m',"Scripts have restarted!");

      var overlay = require('../../../start_overlay.js');
      await overlay.menu();

    }catch(e){
      //console.log('\x1b[31m',e);
    }
  }
}
