const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('../../../configurations/overlay_config.json');
const prompts = require('prompts');

module.exports={
  export_data: async function export_data() {
    //set firewall
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

    }catch(e){
      console.error('\x1b[31m',e);
    }
  }
}
