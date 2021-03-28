const { TelegramClient } = require('messaging-api-telegram');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../../configurations/overlay_config.json');

const node_name = config.scripts.node_name;
const token = config.scripts.heartbeat.telegram_bot_token;
const chatId = config.scripts.telegram_chat_id

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

async function ping(){
  try{
    console.log(date+' - scripts/ping.js: Pinging...');
    var runStateq = "sudo docker inspect -f {{.State.Running}} otnode"
    var running = await exec(runStateq);
    var running = running.stdout
    var running = running.trim().replace(/\r?\n|\r/g, "");

    if(running == 'true'){
      console.log(date+' - scripts/ping.js: otnode is running.');
        return;
    }else if(running == 'false'){
        console.log(date+' - scripts/ping.js: otnode is NOT running.');
        await client.sendMessage(chatId, '!!URGENT!! - '+node_name+ ' is not running!', {
          disableWebPagePreview: true,
          disableNotification: false,
        });
    }

    console.log(date+' - scripts/ping.js: Checking CPU usage...');
    var checkcpu = "echo $(vmstat 1 2|tail -1|awk '{print $15}')"
    var checkcpu = await exec(checkcpu);
    var cpuusage = checkcpu.stdout
    var cpuusage = Number(cpuusage);
    var cpuusage = 100 - cpuusage

    if(cpuusage > 80){
      console.log(date+' - scripts/ping.js: CPU usage is high:'+usage+'%');
      await client.sendMessage(chatId, '!!WARNING!! - '+node_name+ ' CPU usage is '+ usage+'%.', {
        disableWebPagePreview: true,
        disableNotification: false,
      });
    }

  }catch(e){
    console.log(date+e);
    return;
  }
}
ping()
