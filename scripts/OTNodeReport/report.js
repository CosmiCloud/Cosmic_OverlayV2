const { TelegramClient } = require('messaging-api-telegram');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../../configurations/overlay_config.json');

const node_name = config.scripts.node_name;
const token = config.scripts.heartbeat.telegram_bot_token;
const chatId = config.scripts.telegram_chat_id
const os = require('os');
const fs = require('fs');
const dateFormat = require('dateformat');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");

const client = new TelegramClient({
  accessToken: token,
});

client.getWebhookInfo().catch((error) => {
  console.log(error); // formatted error message
  console.log(error.stack); // error stack trace
  console.log(error.config); // axios request config
  console.log(error.request); // HTTP request
  console.log(error.response); // HTTP response
});

async function report(){
  try{
    console.log(date+' - scripts/ping.js: Creating report... this may take a minute...');

    console.log(date+' - scripts/report.js: Checking CPU usage...');
    var checkcpu = "echo $(vmstat 1 2|tail -1|awk '{print $15}')"
    var checkcpu = await exec(checkcpu);
    var cpuusage = checkcpu.stdout
    var cpuusage = Number(cpuusage);
    var cpuusage = 100 - cpuusage
    var cpuusage = cpuusage+'%'

    console.log(date+' - scripts/report.js: Checking storage usage...');
    var checkstorage = "sudo df --output=pcent / | tr -dc '0-9'"
    var checkstorage = await exec(checkstorage);
    var storageusage = checkstorage.stdout
    var storageusage = storageusage+'%'

    var logpath = "sudo docker inspect -f '{{.LogPath}}' otnode 2>/dev/null"
    var logpath = await exec(logpath);
    var logpath = logpath.stdout

    console.log(date+' - scripts/report.js: Checking log size...');
    var checklog = "sudo du -m "+logpath+" 2>/dev/null|awk '{print $1}'"
    var checklog = await exec(checklog);
    var logsize = checklog.stdout
    var logsize = logsize.substr(0, logsize.indexOf('/'));
    var logsize = logsize+'M'

    console.log(date+' - scripts/report.js: Querying node for info...');
    var info = "sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/info?humanReadable=true"
    var info = await exec(info);
    var info = info.stdout
    var info = JSON.parse(info);

    console.log(date+' - scripts/report.js: Partially building report...');
    var report =  os.EOL+date+
                  os.EOL+
                 'Daily Status Report for '+node_name+os.EOL+
                  os.EOL+
                 'CPU Usage: '+cpuusage+os.EOL+
                  os.EOL+
                 'Storage Usage: '+storageusage+os.EOL+
                  os.EOL+
                 'Log Size: '+logsize+os.EOL+
                  os.EOL+
                 'Graph Size:'+os.EOL+
                  'Edges:'+info.graph_size.number_of_edges+os.EOL+
                  'Vertices:'+info.graph_size.number_of_vertices+os.EOL+
                  os.EOL+
                 'Active Staking IDs for Node: '+info.network.identity+os.EOL

    console.log(date+' - scripts/report.js: Querying node for balance...');
    var balance = "sudo docker exec otnode curl -s -X GET http://localhost:8900/api/latest/balance?humanReadable=true"
    var balance = await exec(balance);
    var balance = balance.stdout
    var balance = JSON.parse(balance);
    var chain_count  = Object.keys(balance).length;

    for(var i = 0; i < chain_count; i++) {
      var obj = Object.entries(balance)[i];
      var obj = obj[1];

      report = report+os.EOL+
              '-------------------------------------------------------------------------------------------'+os.EOL+
              'Blockchain: '+obj.blockchain_id+os.EOL+
              os.EOL+
              'Identity: '+obj.profile.address+os.EOL+
              os.EOL+
              'Staked: '+obj.profile.staked+os.EOL+
              os.EOL+
              'Locked in Jobs: '+obj.profile.reserved+
              os.EOL
    }

    await client.sendMessage(chatId,report, {
      disableWebPagePreview: true,
      disableNotification: false,
    });

  }catch(e){
    console.log(date+e);
    return;
  }
}
report()
