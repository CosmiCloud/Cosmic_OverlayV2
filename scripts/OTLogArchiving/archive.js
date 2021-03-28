const { TelegramClient } = require('messaging-api-telegram');
const fs = require('fs');
const dateFormat = require('dateformat');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const config = require('../../configurations/overlay_config.json');
var date = dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");

const node_name = config.scripts.node_name;
const token = config.scripts.log_archiving.telegram_bot_token;
const chatId = config.scripts.telegram_chat_id

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

async function logarchiving(){
  try{
        console.log(date+' - scripts/archive.js: Finding log path...');
        var logpath ="sudo docker inspect -f '{{.LogPath}}' otnode"
        var { stdout, stderr } = await exec(logpath);
        var logpath = stdout;

        console.log(date+' - scripts/archive.js: Copying logs...');
        var copyLogs = 'sudo mkdir -p /root/OTLogArchives/nodeLogs && sudo docker cp otnode:/ot-node/current/logs /root/OTLogArchives/nodeLogs';
        await exec(copyLogs);
        console.log(date+' - scripts/archive.js: Logs copied.');

        console.log(date+' - scripts/archive.js: Archiving logs...');
        var archiveCopy = 'sudo tar -czf /root/OTLogArchives/nodeLogs_'+date+'.tar --absolute-names /root/OTLogArchives/nodeLogs';
        await exec(archiveCopy);
        console.log(date+' - scripts/archive.js: Logs archived.');

        var trimCopy = 'sudo rm -rf /root/OTLogArchives/nodeLogs';
        await exec(trimCopy);

        console.log(date+' - scripts/archive.js: Deleting unarchived logs...');
        var del_logs = 'sudo truncate -s0 '+ logpath
        await exec(del_logs);
        console.log(date+' - scripts/archive.js: Logs have been archived.');

        await client.sendMessage(chatId, node_name+ ' logs have been archived.', {
          disableWebPagePreview: true,
          disableNotification: false,
        });

        return;
  }catch(e){
    console.log(date+e);
    await client.sendMessage(chatId, node_name+ ' logs failed to archived.', {
      disableWebPagePreview: true,
      disableNotification: false,
    });
    return;
  }
}

logarchiving()
