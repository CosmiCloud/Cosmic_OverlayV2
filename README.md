# Cosmic_Overlay V2 BETA  -- Warp testnet Supported
------------------------------------------------------------------------------------------------------------------------------------------------------------------
The Cosmic Overlay is a general purpose tool used to streamline the interaction between an OriginTrail node. The overlay is compatible with both V4 single chain and V5 multichain nodes.  <b>Only development environment available for BETA</b>
<br><br>
Before running the overlay, please read and follow the requirements and configration sections.
<br>
<br>
<b>To Start Run:</b> sudo node start_overlay.js
<br><br>
Donations are always welcome. Thank you! <br>
Ethereum: 0x514a264512EB9297aAB63e79b000E0bd26EE0734<br>

<b>--------------------------------------------------------------Requirements:--------------------------------------------------------------------</b>

Install nodejs, npm, jq, curl, docker, and zip
<ul>
<li>Run: sudo apt install nodejs -y</li>
<li>Run: sudo apt install npm -y</li>
<li>Run: sudo apt install jq -y</li>
<li>Run: sudo apt install curl -y</li>
<li>Run: sudo apt install docker.io -y</li>
<li>Run: sudo apt-get install zip unzip -y</li>
</ul><br>

<b>Required for automated scripts:</b><br>
Telegram bot token : https://www.siteguarding.com/en/how-to-get-telegram-bot-api-token <br>
Telegram chat ID: add @getidsbot to telegram. Type /start. It will tell you your chat ID.<br>

<b>Required for installing a new node:</b><br>
Operational wallet must have the following funds for EACH blockchain they are utilizing on their node:
  <ul>
  <li>Ethereum Backchain: 3k TRAC and enough ETH to pay for 2 blockchain transactions</li>
  <li>Starfleet Backchain: 3k sTRAC and enough sTRAC to pay for 2 blockchain transactions</li>
  <li>xDai Backchain: 3k xTRAC and enough xDai to pay for 2 blockchain transactions</li>
  <li>Rinkeby Backchain: 3k aTRAC and enough rinkeby ETH to pay for 2 blockchain transactions</li>
  <li>Kovan Backchain: 3k tTRAC and enough kovan ETH to pay for 2 blockchain transactions</li>
  </ul>
<br>
<b>Required for aws s3 features:</b><br>
Create an https://aws.amazon.com/s3/ account and create a new api access key and secret if you want to configure the overlay to interact with aws s3 storage. 
<br><br>
<b>Always</b> check your arangodb and compare the arangodb size of a new backup to an old backup before deleting the old backup.<br><br>
<b>Never</b> delete your backups on aws until you have successfully uploaded a back up from your migrated node AND the arandoDB sizes match.<br><br>
<b>Never</b> destroy/wipe your old server before testing that the migrated node is working properly.

<b>-----------------------------------------------------------Configuration:------------------------------------------------------------</b>

<ol>
<li>Open terminal</li>
<li>Run: sudo apt update -y && sudo apt upgrade -y</li>
<li>Run: sudo git clone https://github.com/CosmiCloud/Cosmic_OverlayV2.git</li>
</ol>
<br>

<b>Configuring your node</b>
<ol>
<li>Run: cd Cosmic_OverlayV2/configurations</li>
<li>Rename the example-node_config.json file in this directory to node_config.json. Replace the ** content with your information<br>
  Note: This configuration should match the .origintrail_noderc file of your actual node. It is required to fill this configuration out for the overlay to function. You cannot change the default directories at this time.
</li>
</ol>

<b>Configuring your wallets</b>
<ol>
<li>Run: cd Cosmic_OverlayV2/configurations/wallets</li>
<li>For each blockchain you want to use, rename the respective .json file in this directory to exclude "example-". Replace the empty content with your information.<br>
  Note: If you are running on a V4 node then do nothing here. It is required to fill this configuration out for the overlay to function for V5 node. You cannot change the default directories at this time.
</li>
</ol>

<b>Configuring your overlay</b>
<ol>
<li>Run: cd Cosmic_OverlayV2/configurations</li>
<li>Rename the example-overlay_config.json file in this directory to overlay_config.json. Replace the ** content with your information<br>
  Note: It is required to fill this configuration out for the overlay to function. Misconfiguration could cause some features to fail.
</li>
</ol>

<b>Optional: If don't want to set up cronjobs on your crontab</b>
<ol>
<li>Run: cd Cosmic_OverlayV2/cron-jobs-node</li>
<li>Run: sudo npm i shelljs</li>
<li>Run: sudo npm i express</li>
<li>Run: sudo npm i node-cron</li>
<li>Run: sudo npm i forever -g</li>
<li>Run: cd ..</li>
</ol>

<b>----------------------------------------------------------------Features:------------------------------------------------------------------</b><br>
<b>Install Menu:</b>
<ol>
<li>Install a brand new node based off of the configuration in the overlay config. <br>
Note: This will not let start a node if otnode already exists.</li>
<li>Restore directly from configured aws directory.<br>
Note: This will not let start a node if otnode already exists or if nothing was downloaded from aws (incorrect config)</li>
<li>Restore directly from a local backup.<br>
Note: This will not let start a node if otnode already exists.</li>
</ol><br>

<b>Backup Menu:</b>
<ol>
<li>Creates a local back up file on the directory.</li>
<li>Creates back up file and pushes it to configured aws bucket.</li>
<li>Removes local backups.</li>
</ol><br>

<b>Scripts Menu:</b><br>
The menu will display current enabled automations scripts and give you the below commands
<ol>
<li>Start scripts. <br>
Note: This will activate your enabled scripts.</li>
<li>Stop scripts. <br>
Note: This will deactivate your enabled scripts.</li>
<li>Stop scripts. <br>
Note: This will restart your scripts so any config changes will be picked up.</li>
</ol><br>

<b>Log Menu:</b>
<ol>
<li>Display logs.</li>
<li>Archive logs. <br>
Note: This will archive (compress) your node logs and store them and then truncate your node logs to 0MB.</li>
<li>Display log file info. <br>
Note: This will display log file location and size.</li>
<li>Display log archives.</li>
<li>Delete log archives.</li>
</ol><br>

<b>Node Controls:</b>
<ol>
<li>Start node.</li>
<li>Stop node.</li>
<li>Restart node.</li>
<li>Display node credentials. <br>
Note: If they exist, this will display rinkeby identity, kovan identity, starfleet identity, xDai identity, erc725 id, your node identity, and your houston password.</li>
</ol><br>

<b>----------------------------------------------------------------Optional:------------------------------------------------------------------</b><br>
The overlay uses forever to continuously run an script that triggers the automated scripts based on your configuration. If you would prefer not to run an script with forever, you can create cronjobs in your cron tab that point directly to where the scripts are installed.<br>
The overlay config will still be used for notifications if you decide to go with this option.<br>

Place the following in your crontab and make sure the path to the scripts are correct:<br>

*/5 * * * * root cd /path/to/Cosmic_Overlay2/scripts/OTLogNotifications && sudo node Notification.js<br>
0 0 1 * * root cd /path/to/Cosmic_Overlay2/scripts/OTLogArchiving && sudo node archive.js<br>
0 0 * * 0 root cd /path/to/Cosmic_Overlay2/scripts/OTUpload && sudo node upload.js<br>
***** root cd /path/to/Cosmic_Overlay2/scripts/OTHeartbeat && sudo node ping.js


