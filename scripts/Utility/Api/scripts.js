const util = require('util');
const exec = util.promisify(require('child_process').exec);
const prompts = require('prompts');
const overlay_config = require('../../../configurations/overlay_config.json');
const node_config = require('../../../configurations/node_config.json');

module.exports={
    //prechecks for docker and jq
    stakes: async function stakes(){
      try {
        var balance = "sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/balance?humanReadable=true"
        var balance = await exec(balance);
        var balance = balance.stdout
        var balance = JSON.parse(balance);

        var info = "sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/info?humanReadable=true"
        var info = await exec(info);
        var info = info.stdout
        var info = JSON.parse(info);

        var chain_count  = Object.keys(balance).length;
        var chain_count = Number(chain_count);
        console.log(" ")
        console.log("\x1b[35m  Graph Size:     \x1b[35mNumber of Edges: \x1b[32m"+info.graph_size.number_of_edges+"      \x1b[35mNumber of Vertices: \x1b[32m"+info.graph_size.number_of_vertices)
        // console.log("\x1b[35mNumber of Edges: \x1b[32m"+info.graph_size.number_of_edges+"      \x1b[35mNumber of Vertices: \x1b[32m"+info.graph_size.number_of_vertices)
        // console.log("\x1b[35mNumber of Vertices: \x1b[32m"+info.graph_size.number_of_vertices)
        console.log("_________________________________________________________________________")
        console.log(" ")
        console.log("\x1b[34m  Active Staking IDs for Node "+info.network.identity)
        console.log(" ")

        for(var i = 0; i < chain_count; i++) {
          var obj = Object.entries(balance)[i];
          var obj = obj[1];

          console.log("\x1b[35m  Blockchain:      \x1b[32m"+obj.blockchain_id)
          console.log("\x1b[35m  Identity:        \x1b[32m"+obj.profile.address)
          console.log("\x1b[35m  Staked:          \x1b[32m"+obj.profile.staked)
          console.log("\x1b[35m  Locked in Jobs:  \x1b[32m"+obj.profile.reserved)
          console.log(" ")
        }

    }catch(e){
      console.log(e);
    }
  }
}
