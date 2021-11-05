const overlay = require('../start_overlay.js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('../configurations/overlay_config.json');
const node_config = require('../configurations/node_config.json');
const dateFormat = require('dateformat');
const prompts = require('prompts');
const fs = require('fs');

module.exports={
    //prechecks for docker and jq
    utility_menu: async function menu(){
      try {
        console.log('\x1b[35m', "[1] - Display node logs");
        console.log('\x1b[35m', "[2] - Clean up node");
        console.log('\x1b[35m', "[3] - Payout a specific job");
        console.log('\x1b[35m', "[4] - Partially payout all jobs on a specific chain");
        console.log('\x1b[35m', "[0] - Return to main menu",'\n');

        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWhat would you like to do?'
        });

        if(response.response == '1'){
          module.exports.display_logs();

        }else if(response.response == '2'){
          module.exports.clean();

        }else if(response.response == '3'){
          module.exports.job_payout();

        }else if(response.response == '4'){
          module.exports.payout();

        }else if(response.response == '0'){
          const overlay = require('../start_overlay.js');
          overlay.menu();

        }else{
          console.log('\x1b[31m',"Exited Log Menu.");
          const overlay = require('../start_overlay.js');
          overlay.menu();
        }
    }catch(e){
      console.log('\x1b[31m Something broke in the log menu: '+ e,'\n');
    }
  },

  display_logs: async function option_1(){
    try {
      var logs = "sudo docker logs otnode --since 24h"
      var { stdout, stderr } = await exec(logs,{maxBuffer: 1024 * 2000});
      console.log(stdout)

      module.exports.utility_menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  clean: async function option_2(){
    try{
      var before_space = 'df -h | grep "sda1\s" | tr -s " " " " | cut -d" " -f3 | tr -d "G"'
      var before_space = await exec(before_space);
      var before_space = before_space.stdout

      console.log('\x1b[35mCurrent used disk space is:'+before_space+' Gb.')

      var clear_cache = 'sudo rm -rf /root/.cache'
      var clear_cache = await exec(clear_cache);

      var clean_journal = 'journalctl --vacuum-time=1h 2>&1'
      var clean_journal = await exec(clean_journal);

      var set_limit = "sed -i 's|#SystemMaxUse=|SystemMaxUse=50M|' /etc/systemd/journald.conf"
      var set_limit = await exec(set_limit);

      var dir = "/ot-node"
      if(fs.existsSync(dir)){
        var del_backup = 'sudo docker exec otnode sh -c "rm -rf ../backup/* ../init"'
        var del_backup = await exec(del_backup);

        var del_logs = "truncate -s 0 $(sudo docker inspect -f '{{.LogPath}}' otnode)"
        var del_logs = await exec(del_logs);

        var max_size = 'sudo docker create -i --log-driver json-file --log-opt max-size=50m'
        var max_size = await exec(max_size);

      }else{
        var del_backup = 'sudo rm -rf /ot-node/backup/*'
        var del_backup = await exec(del_backup);

        var del_backup = 'sudo rm -rf /root/backup/*'
        var del_backup = await exec(del_backup);
      }

      var del_arch = 'sudo find /var/log -type f -regex ".*\.gz$"'
      var del_arch = await exec(del_arch);
      var del_arch = 'sudo find /var/log -type f -regex ".*\.[0-9]$"'
      var del_arch = await exec(del_arch);

      var apt_clean = 'sudo apt clean -y 2>&1'
      var apt_clean = await exec(apt_clean);

      var apt_rm = 'sudo apt autoremove -y 2>&1'
      var apt_rm = await exec(apt_rm);

      var after_space = 'sudo df -h | grep "sda1\s" | tr -s " " " " | cut -d" " -f3 | tr -d "G"'
      var after_space = await exec(after_space);
      var after_space = after_space.stdout

      console.log('\x1b[35mDisk space after cleaning is '+after_space+' Gb.')
      var total = before_space - after_space
      console.log('\x1b[35mTotal space cleaned is '+total+' Gb.','\n')

      await module.exports.utility_menu();

    }catch(e){
      console.log('\x1b[31m',e);
    }
  },

  job_payout: async function option_3(){
    try{
      if(overlay_config.environment == 'mainnet'){
        var response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWhat is the offer id of the job you want to payout?'
        });

        var offer = "sudo curl -X GET https://v5api.othub.info/api/Job/detail/"+response.response
        var offer = await exec(offer);

        if(offer.stdout){
          var offer = JSON.parse(offer.stdout);
          var response = await prompts({
            type: 'text',
            name: 'response',
            message: '\x1b[35mAre you sure you want to payout offer '+offer.OfferId+' on '+offer.BlockchainDisplayName+'? The job is complete on '+offer.EndTimestamp+'. \x1b[31mThis will cost gas to payout!(y/n)'
          });

          if(response.response == 'y' || response.response == 'yes'){
            var offer_id = offer.OfferId
            var payout_com = "sudo docker exec otnode curl -s -X GET http://127.0.0.1:8900/api/latest/payout?offer_id="+offer_id
            var result = await exec(payout_com);
            console.log('\x1b[32m','Triggered payout for offer '+offer_id);
            console.log('\x1b[33m',result.stdout);
            await module.exports.utility_menu();
          }else{
            console.log('\x1b[33m','Aborted payout.','\n')
            await module.exports.utility_menu();
          }
        }else{
          console.log('\x1b[33m','Please enter a valid offer id.','\n')
          await module.exports.utility_menu();
        }
      }else{
        console.log('\x1b[33m','Job payouts are only offered on mainnet. Sorry!','\n')
        await module.exports.utility_menu();
      }
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

        var jerbs = "sudo curl -X GET https://v5api.othub.info/api/nodes/DataHolder/"+info.network.contact.identity+"/jobs"
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
              var payout_com = "sudo docker exec otnode curl -s -X GET http://127.0.0.1:8900/api/latest/payout?offer_id="+offer_id
              var result = await exec(payout_com);
              console.log('\x1b[32m','Triggered eth payout for offer '+jerbs[i].OfferId);
              console.log('\x1b[33m',result.stdout);

            }else if(jerbs[i].BlockchainID == "2" && blockchain == 'xDai' && jerbs[i].Paidout == false){
              var offer_id = jerbs[i].OfferId
              var payout_com = "sudo docker exec otnode curl -s -X GET http://127.0.0.1:8900/api/latest/payout?offer_id="+offer_id
              var result = await exec(payout_com);
              console.log('\x1b[32m','Triggered xdai payout for offer '+jerbs[i].OfferId);
              console.log('\x1b[33m',result.stdout);

            }else if(jerbs[i].BlockchainID == "3" && blockchain == 'Polygon' && jerbs[i].Paidout == false){
              var offer_id = jerbs[i].OfferId
              var payout_com = "sudo docker exec otnode curl -s -X GET http://127.0.0.1:8900/api/latest/payout?offer_id="+offer_id
              var result = await exec(payout_com);
              console.log('\x1b[32m','Triggered polygon payout for offer '+jerbs[i].OfferId);
              console.log('\x1b[33m',result.stdout);

            }else{
              //console.log('\x1b[35m','Skipped payout for offer '+jerbs[i].OfferId+' on '+blockchain+'.')
            }
          }
          await module.exports.utility_menu();
        }else{
          console.log('\x1b[31m',"Exited Payout Menu.");
          await module.exports.utility_menu();
        }
      }else{
        console.log('\x1b[33m','Partial payouts are only offered on mainnet. Sorry!')
        await module.exports.utility_menu();
      }
    }catch(e){
      console.log('\x1b[31m',e);
    }
  }
}
