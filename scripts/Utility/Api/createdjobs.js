const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('../../../configurations/overlay_config.json');
const prompts = require('prompts');

module.exports={
  myJobs: async function myJobs() {
    //set firewall
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
        var overlay = require('../../../start_overlay.js');
        await overlay.menu();
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
          //console.log('No offers were found with that status.')
        }
      }


    }catch(e){
      console.error('\x1b[31m',e);
      return 'fail';
    }
  }
}
