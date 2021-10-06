const overlay = require('../start_overlay.js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('../configurations/overlay_config.json');
const node_config = require('../configurations/node_config.json');
const fs = require('fs');
const os = require('os');
const dateFormat = require('dateformat');
const prompts = require('prompts');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");
const { TelegramClient } = require('messaging-api-telegram');

const s3_url_of_data = overlay_config.scripts.create_aws_job.s3_url_of_data;
const chatId = overlay_config.scripts.telegram_chat_id;
const token = overlay_config.scripts.create_aws_job.telegram_bot_token;
const client = new TelegramClient({
  accessToken: token,
});

module.exports={
    creators_menu: async function menu(){
      try {
        console.log('\x1b[35m', "[1] - Create a Job");
        console.log('\x1b[35m', "[2] - View created jobs");
        console.log('\x1b[35m', "[3] - Export a dataset");
        console.log('\x1b[35m', "[0] - Return to main menu",'\n');

        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWhat would you like to do?'
        });

        if(response.response == '1'){
          module.exports.create_job();

        }else if(response.response == '2'){
          module.exports.created_jobs();

        }else if(response.response == '3'){
          module.exports.export_data();

        }else if(response.response == '0'){
          const overlay = require('../start_overlay.js');
          overlay.menu();
        }else{
          const overlay = require('../start_overlay.js');
          console.log('\x1b[31m',"Exited Creators Menu.");
          overlay.menu();
        }
    }catch(e){
      console.log('\x1b[31m Something broke in the log menu: '+ e,'\n');
    }
  },

  create_job: async function create_job(){
    try {
      console.log('\x1b[35m', "[1] - GS1-EPCIS");
      console.log('\x1b[35m', "[2] - OT-JSON");
      console.log('\x1b[35m', "[3] - WOT (Web of Things)");
      console.log('\x1b[35m', "[0] - Return to main menu");
      console.log('\x1b[35m', " ");
      var response = await prompts({
        type: 'text',
        name: 'response',
        message: '\x1b[35mWhat data standard do you want to upload? (Default: GS1-EPCIS)'
      });

      if(response.response == '1'){
        console.log('\x1b[35mUsing standard of GS1-EPCIS.')
        standard = 'GS1-EPCIS'
        type = 'text/xml'
      }else if(response.response == '2'){
        console.log('\x1b[35mUsing standard of OT-JSON.')
        standard = 'OT-JSON'
        type = 'application/json'
      }else if(response.response == '3'){
        console.log('\x1b[35mUsing standard of WOT.')
        standard = 'WOT'
        type = 'text/plain'
      }else if(response.response == ''){
        console.log('\x1b[35mUsing default standard of GS1-EPCIS.')
        standard = 'GS1-EPCIS'
        type = 'text/xml'
      }else if(response.response == '0'){
        module.exports.creators_menu();
        return;
      }else{
        console.log('\x1b[35mNot a valid response. Returning to main menu.')
        module.exports.creators_menu();
        return;
      }

      console.log(' ');

      var response = await prompts({
        type: 'text',
        name: 'response',
        message: '\x1b[35mPlease enter the file path to the data you wish to upload. A dummy data GS1-EPCIS standard file will be used if a path is not specifed.'
      });

      if(response.response == '0'){
        module.exports.creators_menu();

      }else if(response.response == ''){
        var mvdata = 'sudo mkdir -p /root/OTDataUpload && sudo rm -rf /root/OTDataUpload/* && sudo cp '+ __dirname+'/testdata.xml /root/OTDataUpload/data.xml'
        await exec(mvdata);

        if (fs.existsSync('/root/OTDataUpload/data.xml')) {
          console.log(" ");
          console.log("\x1b[35mSet to upload /root/OTDataUpload/data.xml");
          var path = '/root/OTDataUpload/data.xml'
          var data = /[^/]*$/.exec(path)[0];

          var file_size = 'sudo wc -c < '+path
          var file_size = await exec(file_size);
          var file_size = file_size.stdout
          var file_size = file_size.slice(0, -1);

        }else{
          console.log("\x1b[33mUnable to find file. Please make sure your file path is correct or return to the main menu by pressing 0.")
          module.exports.createJob();
        }

      }else{
        if (fs.existsSync(response.response)) {
          var path = response.response
          var data = /[^/]*$/.exec(path)[0];

          var file_size = 'sudo wc -c < '+path
          var file_size = await exec(file_size);
          var file_size = file_size.stdout
          var file_size = file_size.slice(0, -1);

        }else{
          console.log("\x1b[33mUnable to find file. Please make sure your file path is correct or return to the main menu by pressing 0.")
          module.exports.createJob();
          return;
        }
      }

      console.log("\x1b[35mUpload file approved. Locating docker overlay and moving data file to your node.")
      console.log(" ")
      var find_init = 'sudo find /var/lib/docker/overlay2/ -maxdepth 1 -name "*-init"'
      var find_init = await exec(find_init)
      var find_init = find_init.stdout
      var overlay_id = find_init.slice(25,-6);

      var move = 'sudo mv '+path+' /var/lib/docker/overlay2/'+overlay_id+'/merged/ot-node/data/'+data
      await exec(move);

      console.log('\x1b[33m'+path+" moved to /var/lib/docker/overlay2/"+overlay_id+"/merged/ot-node/data/"+data)
      console.log(" ");

      var import_cmd = 'sudo docker exec otnode curl -X POST http://localhost:8900/api/latest/import -H "accept: application/json" -H  "Content-Type: multipart/form-data" -F "standard_id='+standard+'" -F "file=@/ot-node/data/'+data+';type='+type+'"'
      var import_cmd = await exec(import_cmd);
      var import_cmd = JSON.parse(import_cmd.stdout);
      var import_handler_id = import_cmd.handler_id
      console.log('\x1b[35mYour handler id for this import is: \x1b[32m'+import_handler_id)

      var import_res = 'sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/import/result/'+import_handler_id+' -H "accept: application/json"'

      console.log('\x1b[35mWaiting on import to complete...');

      var hasDataSetID = false;
      var time = 1;
      const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

      do {
        var import_res = 'sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/import/result/'+import_handler_id+' -H "accept: application/json"'
        var import_res = await exec(import_res);
        var stdout = JSON.parse(import_res.stdout);

        if(stdout.status == "COMPLETED"){
          console.log('\x1b[32mImport completed!')
          console.log('')
          var dataset_id = stdout.data.dataset_id;
          console.log("\x1b[35mData set ID for this job is: \x1b[32m"+stdout.data.dataset_id);
          time = 21;
          hasDataSetID = true;
        }else{
          time++;
        }
        await snooze(2000);
      }
      while(!hasDataSetID && time <= 20);

      if(!hasDataSetID){
        console.log('\x1b[31mImport failed! Did you choose the right data standard?');
        return;
      }

      console.log('\x1b[35m', " ");
      var response = await prompts({
        type: 'text',
        name: 'response',
        message: '\x1b[35mHow much Trac do you want to pay per data holder?'
      });

      if(isNaN(response.response) || response.response == '0'){
        console.log('\x1b[33m', "Please provide a valid number for payment.");
        module.exports.createJob();
        return;
      }else if(response.response == ""){
        console.log('\x1b[33m', "Please provide a valid number for payment.");
        module.exports.createJob();
        return;
      }else{
        if(response.response % 1 != 0){

          var payment = response.response
          var payment = Number(payment);
          var payment = payment.toFixed(2);
          var payment_str = payment+""
          var payment = Number(payment);
          var whole = payment.toString().split(".")[0];
          var decimal = payment.toString().split(".")[1];
          if(decimal){
            var dec_dif = 18 - decimal.length

            var zeros = ""
            for (i = 0; i < dec_dif; i++) {
              var zeros = zeros + "0"
            }

            var decimal = decimal + zeros

            if(whole != '0'){
              var payment = whole + decimal
            }else{
              var payment = decimal
            }
          }else{
            console.log('\x1b[33m', "You may only use up to 2 decimal places for payment.");
            module.exports.createJob();
            return;
          }
        }else{
          var payment = response.response
          var payment_str = payment+""
          var payment = payment_str+"000000000000000000"
        }
      }

      var response = await prompts({
        type: 'text',
        name: 'response',
        message: '\x1b[35mHow long would you like the Data Holder to hold the data?(minutes)'
      });

      if(isNaN(response.response)){
        console.log('\x1b[33m', "Please provide a valid number for holding time.");
        module.exports.createJob();
        return;
      }else if(response.response == ""){
        console.log('\x1b[33m', "Please provide a valid number for holding time.");
        module.exports.createJob();
        return;
      }else{
        var hold_time = Math.trunc( response.response );
      }

      const implementations = node_config.blockchain.implementations;
      var chain_count  = Object.keys(implementations).length;
      var chain_count = Number(chain_count);

      for(var i = 0; i < chain_count; i++) {
        var obj = Object.entries(implementations)[i];
        var obj = obj[1];
        var blockchain = obj.network_id

        if (blockchain == 'ethr:rinkeby:1'){
          var network = 'ethr:rinkeby'
          var network_fncy = 'Rinkeby Testnet'
        }else if (blockchain =='ethr:mainnet'){
          console.log('\x1b[35m', "[1] - Ethereum Mainnet");
        }else if (blockchain == 'xdai:mainnet'){
          console.log('\x1b[35m', "[2] - xDai Mainnet");
        }else if (blockchain == 'xdai:mainnet'){
          console.log('\x1b[35m', "[3] - Polygon Mainnet");
        }else if (blockchain == 'sfc:mainnet'){
          //var network = 'sfc:mainnet'
        }
      }

      if (overlay_config.environment == 'mainnet'){
        var othub_home = 'sudo curl -X GET "https://v5api.othub.info/api/home/HomeV3" -H "accept: text/plain"'

        console.log('\x1b[35m', "[0] - Return to main menu");
        console.log(" ");
        var response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mWhich network do you want to deploy your job to?'
        });

        if(response.response == '1'){
          var network = 'ethr:mainnet'
          var network_fncy = 'Ethereum Mainnet'
        }else if(response.response == '2'){
          var network = 'xdai:mainnet'
          var network_fncy = 'xDai Mainnet'
        }else if(response.response == '3'){
          var network = 'polygon:mainnet'
          var network_fncy = 'Polygon Mainnet'
        }else if(response.response == '0'){
          module.exports.creators_menu();
          return;
        }else{
          module.exports.create_job();
          return;
        }

        var othub_home = await exec(othub_home);
        var othub_home = JSON.parse(othub_home.stdout)

        console.log(" ");
        console.log('\x1b[35m', "You are about to create a job on \x1b[32m"+network_fncy+"!");
        console.log('\x1b[31m', "This is going to cost real tokens and you will not be able to get them back!");
        console.log('\x1b[35m', "Here are some estimates on what it might cost you based on the most recent job.");
        console.log('\x1b[35m', " ");
        console.log('\x1b[35m', "Recent Job:                        Your Job:");
        console.log('\x1b[35m', "______________________________________________________");

        if(network == 'ethr:mainnet'){
          var token_amount = othub_home.All.JobsReward24H;
          var holding_time = othub_home.All.JobsDuration24H;
          var data_size = othub_home.All.JobsSize24H;
          var eth_create_gas = othub_home.All.Blockchains[2].Fees.JobCreationCost;
          var eth_create_gas = Number(eth_create_gas);

          var eth_final_gas = othub_home.All.Blockchains[2].Fees.JobFinalizedCost;
          var eth_final_gas = Number(eth_final_gas);

          var total_eth_gas = eth_final_gas + eth_create_gas
          var payment_str = Number(payment_str);
          var total_payment = payment_str * 3;

          console.log('\x1b[35m', "Data Size:       \x1b[32m"+data_size+"B            \x1b[35mData Size: "+file_size+"B");
          console.log('\x1b[35m', "Holding Time:    \x1b[32m"+holding_time+" min.      \x1b[35mHolding Time: "+hold_time+" minute(s)");
          console.log('\x1b[35m', "Total Trac Cost:  \x1b[32m"+token_amount+" Trac     \x1b[35mTotal Trac Cost: \x1b[32m"+total_payment+" Trac");
          console.log('\x1b[35m', "Gas Cost:         \x1b[32m"+eth_create_gas+" Eth");
          console.log(" ");
        }

        if(network == 'xdai:mainnet'){
          var token_amount = othub_home.All.JobsReward24H;
          var holding_time = othub_home.All.JobsDuration24H;
          var data_size = othub_home.All.JobsSize24H;
          var xdai_create_gas = othub_home.All.Blockchains[1].Fees.JobCreationCost;
          var xdai_create_gas = Number(xdai_create_gas);

          var xdai_final_gas = othub_home.All.Blockchains[1].Fees.JobFinalizedCost;
          var xdai_final_gas = Number(xdai_final_gas);

          var total_xdai_gas = xdai_final_gas + xdai_create_gas
          var payment_str = Number(payment_str);
          var total_payment = payment_str * 3;

          console.log('\x1b[35m', "Data Size:       \x1b[32m"+data_size+"B              \x1b[35mData Size: \x1b[32m"+file_size+"B");
          console.log('\x1b[35m', "Holding Time:    \x1b[32m"+holding_time+" min.        \x1b[35mHolding Time: \x1b[32m"+hold_time+" minute(s)");
          console.log('\x1b[35m', "Total Trac Cost: \x1b[32m"+token_amount+" xTrac       \x1b[35mTotal Trac Cost: \x1b[32m"+total_payment+" xTrac");
          console.log('\x1b[35m', "Creation Gas Cost: \x1b[32m"+xdai_create_gas+" xDai");
          console.log(" ");
        }

        if(network == 'polygon:mainnet'){
          var token_amount = othub_home.All.JobsReward24H;
          var holding_time = othub_home.All.JobsDuration24H;
          var data_size = othub_home.All.JobsSize24H;
          var poly_create_gas = othub_home.All.Blockchains[0].Fees.JobCreationCost;
          var poly_create_gas = Number(poly_create_gas);

          var poly_final_gas = othub_home.All.Blockchains[0].Fees.JobFinalizedCost;
          var poly_final_gas = Number(poly_final_gas);

          var total_poly_gas = poly_final_gas + poly_create_gas
          var payment_str = Number(payment_str);
          var total_payment = payment_str * 3;

          console.log('\x1b[35m', "Data Size:       \x1b[32m"+data_size+"B              \x1b[35mData Size: \x1b[32m"+file_size+"B");
          console.log('\x1b[35m', "Holding Time:    \x1b[32m"+holding_time+" min.        \x1b[35mHolding Time: \x1b[32m"+hold_time+" minute(s)");
          console.log('\x1b[35m', "Total Trac Cost: \x1b[32m"+token_amount+" xTrac       \x1b[35mTotal Trac Cost: \x1b[32m"+total_payment+" xTrac");
          console.log('\x1b[35m', "Creation Gas Cost: \x1b[32m"+poly_create_gas+" xDai");
          console.log(" ");
        }

        var params = '{"dataset_id": "'+dataset_id+'", "blockchain_id": "'+network+'", "holding_time_in_minutes": '+hold_time+', "token_amount_per_holder": "'+payment+'"}'
      }else{

        var othub_home = 'sudo curl -X GET "https://testnet-api.othub.info/api/home/HomeV3" -H "accept: text/plain"'
        var othub_home = await exec(othub_home);
        var othub_home = JSON.parse(othub_home.stdout);

        console.log(" ");
        console.log('\x1b[35m', "You are about to create a job on \x1b[32m"+network_fncy+"!");
        console.log('\x1b[31m', "This is going to cost real tokens and you will not be able to get them back!");
        console.log('\x1b[35m', "Here are some estimates on what it might cost you based on the most recent job.");
        console.log('\x1b[35m', " ");
        console.log('\x1b[35m', "Recent Job:                        Your Job:");
        console.log('\x1b[35m', "______________________________________________________");

        if(network == 'ethr:rinkeby'){
          var token_amount = Number(othub_home.All.JobsReward24H);
          var token_amount = Math.trunc( token_amount );

          var holding_time = othub_home.All.JobsDuration24H;
          var data_size = othub_home.All.JobsSize24H;

          var rink_create_gas = Number(othub_home.Blockchains[0].Fees.JobCreationCost);
          var rink_final_gas = Number(othub_home.Blockchains[0].Fees.JobFinalisedCost);

          var total_rink_gas = rink_final_gas + rink_create_gas

          var payment_str = Number(payment_str);
          var total_payment = payment_str * 3;

          console.log('\x1b[35m', "Data Size:       \x1b[32m"+data_size+"B                \x1b[35mData Size: \x1b[32m"+file_size+"B");
          console.log('\x1b[35m', "Holding Time:    \x1b[32m"+holding_time+" min.          \x1b[35mHolding Time: \x1b[32m"+hold_time+" minute(s)");
          console.log('\x1b[35m', "Total Trac Cost: \x1b[32m"+token_amount+" aTrac         \x1b[35mTotal Trac Cost: \x1b[32m"+total_payment+" aTrac")
          console.log('\x1b[35m', "Gas Cost:        \x1b[32m"+total_rink_gas+" rEth");
          console.log(" ");

          var params = '{"dataset_id": "'+dataset_id+'", "network_id": "'+network+'", "holding_time_in_minutes": '+hold_time+', "token_amount_per_holder": "'+payment+'"}'
        }
      }

      if(hasDataSetID){
        var response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mAre you sure you want to pay each data holder '+payment_str+' Trac to hold data for '+hold_time+' minute(s)? \x1b[31mTHIS CANNOT BE REVERSED.(y/n)'
        });

        if(response.response == 'y'){

        }else{
          module.exports.createJob();
          return;
        }

        var replicate = "sudo docker exec otnode curl -X POST http://localhost:8900/api/latest/replicate -H 'accept: application/json' -H 'Content-Type: application/json' -d '"+params+"'"
        var replicate = await exec(replicate);
        var replicate = JSON.parse(replicate.stdout);
        var rep_handler_id = replicate.handler_id;
        console.log("\x1b[35mYour replicate handler id for this offer is: \x1b[32m"+replicate.handler_id)
      }else{
        console.log("\x1b[31mNo data set was replicated.");
        return;
      }

      var isFinished = false;
      var time = 1;
      var p1d = false;
      var p2d = false;

      console.log("\x1b[35mPlease wait for the offer to begin...")
      do {
        var replicate_res = 'sudo docker exec otnode curl -X GET http://localhost:8900/api/latest/replicate/result/'+rep_handler_id+' -H "accept: application/json"'
        var replicate_res = await exec(replicate_res);
        var stdout = JSON.parse(replicate_res.stdout);

        if(stdout.status == "PENDING"){
          if(stdout.data.status == "PREPARING_OFFER" && !p1d && stdout.data.holding_time_in_minutes && stdout.data.token_amount_per_holder && stdout.data.offer_create_transaction_hash){
            console.log("\x1b[35mPreparing job offer... ");
            console.log('\x1b[35m'+stdout.data.message);
            console.log(" ");
            console.log("\x1b[35mHolding Time: \x1b[32m"+stdout.data.holding_time_in_minutes+" minutes");
            console.log("\x1b[35mTokens paid to each data holder: \x1b[32m"+stdout.data.token_amount_per_holder+" mTrac");
            console.log("\x1b[35mOffer Create Transaction Hash: \x1b[32m"+stdout.data.offer_create_transaction_hash);
            console.log(" ");
            var p1d = true;
            time++;
          }else if(stdout.data.status == "WAITING_FOR_HOLDERS" && !p2d){
            console.log('\x1b[35m'+stdout.data.message);
            console.log(" ");
            console.log("\x1b[35mOffer ID: \x1b[32m"+stdout.data.offer_id);
            console.log(" ");
            var p2d = true;
            time++;
          }
        }else if(stdout.status == "COMPLETED"){
          if(stdout.data.status == "FINALIZED"){
            console.log('\x1b[35m'+stdout.data.message);
            console.log(" ");
            console.log("\x1b[35mHolding Time: \x1b[32m"+stdout.data.holding_time_in_minutes+" minutes");
            console.log("\x1b[35mTokens paid to each data holder: \x1b[32m"+stdout.data.token_amount_per_holder+" mTrac");
            console.log("\x1b[35mOffer Create Transaction Hash: \x1b[32m"+stdout.data.offer_create_transaction_hash);
            console.log("\x1b[35mOffer Finalize Transaction Hash: \x1b[32m"+stdout.data.offer_finalize_transaction_hash);
            console.log(" ");
            console.log("\x1b[35mData Holders: \x1b[32m"+stdout.data.holders);
            var isFinished = true;
            time = 601;
          }
        }else if(stdout.status == "FAILED"){
          if(stdout.data.status == "PREPARING_OFFER"){
            console.log('\x1b[31m'+stdout.data.message);
            console.log(" ");
            console.log("\x1b[31mUpload Failed!");
            console.log("\x1b[35mYou probably didn't offer enough to the dataholders!");
            var isFinished = true;
            time = 601;
          }else if(stdout.data.status == "WAITING_FOR_HOLDERS"){
            console.log('\x1b[31m'+stdout.data.message);
            console.log(" ");
            console.log("\x1b[31mUpload Failed!");
            console.log("\x1b[35mYou probably didn't offer enough to the dataholders!");
            var isFinished = true;
            time = 601;
          }else{
            console.log("\x1b[31mUpload Failed!");
            return;
          }
        }else{
          time++;
        }
        await snooze(10000);
      }
      while(!isFinished && time <= 600);

    }catch(e){
    console.log(e);
  }
},

  created_jobs: async function option_2(){
    try{
      var info = "sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/info?humanReadable=true"
      var info = await exec(info);
      var info = JSON.parse(info.stdout);

      if (overlay_config.environment == 'mainnet'){
        var jobs = 'sudo curl -X GET "https://v5api.othub.info/api/nodes/DataCreator/'+info.network.identity+'/Jobs" -H "accept: text/plain"'
      }else{
        var jobs = 'sudo curl -X GET "https://testnet-api.othub.info/api/nodes/DataCreator/'+info.network.identity+'/Jobs" -H "accept: text/plain"'
      }

      var jobs = await exec(jobs);
      var jobs = JSON.parse(jobs.stdout);

      console.log('\x1b[35m', "[1] - Not Started");
      console.log('\x1b[35m', "[2] - Active");
      console.log('\x1b[35m', "[3] - Completed");
      console.log('\x1b[35m', "[0] - Return to main menu");
      console.log('\x1b[35m', " ");
      var response = await prompts({
        type: 'text',
        name: 'response',
        message: '\x1b[35mWhat Job status are you looking for?'
      });

      if(response.response == '1'){
        var status = 'Not Started'
      }else if(response.response == '2'){
        var status = 'Active'
      }else if(response.response == '3'){
        var status = 'Completed'
      }else if(response.response == '0'){
        module.exports.creators_menu();
        return;
      }

      var job_count  = Object.keys(jobs).length;
      var job_count = Number(job_count);

      for(var i = 0; i < job_count; i++) {
        var obj = Object.entries(jobs)[i];
        var obj = obj[1];

        if(status == 'Not Started' && obj.Status == 'Not Started'){
          console.log('\x1b[35mStatus: \x1b[32m'+obj.Status)
          console.log('\x1b[35mFinalized: \x1b[32m'+obj.IsFinalized)
          console.log('\x1b[35mOffer ID: \x1b[32m'+obj.OfferId)
          console.log('\x1b[35mCreated : \x1b[32m'+obj.CreatedTimestamp)
          console.log('\x1b[35mFinished : \x1b[32m'+obj.FinalizedTimestamp)
          console.log('\x1b[35mData Size: \x1b[32m'+obj.DataSetSizeInBytes+' B')
          console.log('\x1b[35mHolding Time: \x1b[32m'+obj.HoldingTimeInMinutes+' minutes')
          console.log('\x1b[35mTokens Paid per Holder: \x1b[32m'+obj.TokenAmountPerHolder+' Trac')
          console.log('\x1b[35m==================================================================')
          console.log(' ')
        }else if(status == 'Active' && obj.Status == 'Active'){
          console.log('\x1b[35mStatus: \x1b[32m'+obj.Status)
          console.log('\x1b[35mFinalized: \x1b[32m'+obj.IsFinalized)
          console.log('\x1b[35mOffer ID: \x1b[32m'+obj.OfferId)
          console.log('\x1b[35mCreated : \x1b[32m'+obj.CreatedTimestamp)
          console.log('\x1b[35mFinished : \x1b[32m'+obj.FinalizedTimestamp)
          console.log('\x1b[35mData Size: \x1b[32m'+obj.DataSetSizeInBytes)
          console.log('\x1b[35mHolding Time: \x1b[32m'+obj.HoldingTimeInMinutes+' minutes')
          console.log('\x1b[35mTokens Paid per Holder: \x1b[32m'+obj.TokenAmountPerHolder+' Trac')
          console.log('\x1b[35m==================================================================')
          console.log(' ')
        }else if(status == 'Completed' && obj.Status == 'Completed'){
          console.log('\x1b[35mStatus: \x1b[32m'+obj.Status)
          console.log('\x1b[35mFinalized: \x1b[32m'+obj.IsFinalized)
          console.log('\x1b[35mOffer ID: \x1b[32m'+obj.OfferId)
          console.log('\x1b[35mCreated : \x1b[32m'+obj.CreatedTimestamp)
          console.log('\x1b[35mFinished : \x1b[32m'+obj.FinalizedTimestamp)
          console.log('\x1b[35mData Size: \x1b[32m'+obj.DataSetSizeInBytes+' B')
          console.log('\x1b[35mHolding Time: \x1b[32m'+obj.HoldingTimeInMinutes+' minutes')
          console.log('\x1b[35mTokens Paid per Holder: \x1b[32m'+obj.TokenAmountPerHolder+' Trac')
          console.log('\x1b[35m==================================================================')
          console.log(' ')
        }else{
          //do nothing
        }
      }
      module.exports.created_jobs();
    }catch(e){
      console.error('\x1b[31m',e);
    }
  },

  export_data: async function export_data() {
    try{
      var response = await prompts({
        type: 'text',
        name: 'response',
        message: '\x1b[35mPlease enter a valid offer id to export the dataset.'
      });

      if(overlay_config.environment == 'mainnet'){
        var job_info = 'sudo curl -X GET "https://othub-api.origin-trail.network/api/Job/detail/'+response.response+'" -H  "accept: text/plain"'
      }else{
        var job_info = 'sudo curl -X GET "https://testnet-api.othub.info/api/Job/detail/'+response.response+'" -H  "accept: text/plain"'
      }

      var job_info = await exec(job_info);
      var job_info = JSON.parse(job_info.stdout);
      var dataset_id = job_info.DataSetId;
      console.log("\x1b[35mYour dataset id is: \x1b[32m"+dataset_id);

      var params = '{ "dataset_id": "'+job_info.DataSetId+'","standard_id": "OT-JSON"}'
      var get_handler_id = "sudo docker exec otnode curl -s -X POST http://localhost:8900/api/latest/export -H 'accept: application/json' -H 'Content-Type: application/json' -d '"+params+"'"
      var get_handler_id = await exec(get_handler_id);
      var get_handler_id = JSON.parse(get_handler_id.stdout);
      var export_handler_id = get_handler_id.handler_id;
      console.log("\x1b[35mYour export handler id is: \x1b[32m"+export_handler_id)

      var pending = true;
      var time = 1;
      const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

  	  do {
        var export_data = "sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/export/result/"+export_handler_id+" -H 'accept: application/json'"
        var export_data = await exec(export_data);
        var export_data = JSON.parse(export_data.stdout);

        if(export_data.status == "PENDING"){
          time++;
        }else if(export_data.status == "COMPLETED"){
          console.log(JSON.parse(export_data.data.formatted_dataset));
          time = 21;
          pending = false;
        }else{
          console.log("\x1b[31mOops!");
          time = 21;
          pending = false;
        }
  			await snooze(2000);
  	  }
  	  while(pending && time <= 20);

      module.exports.creators_menu();
    }catch(e){
      console.error('\x1b[31m',e);
    }
  }
}
