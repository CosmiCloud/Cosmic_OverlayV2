# Cosmic_Overlay V2 - OriginTrail v5 Multichain Supported!
------------------------------------------------------------------------------------------------------------------------------------------------------------------
The Cosmic Overlay provides a streamlined interface to lower the knoweldge barrier when running on Origintrail Node including automated maintenance tasks, node and staking reports, log notifications, and aws back ups and more. The overlay assumes your container and node configuration names are the defaults established by Trace Labs.  <b>Supports V5 Testnet and Mainnet</b>
<br><br>
Before running the overlay, please read and follow the requirements and configuration sections.
<br>
<br>
<b>To Start Run:</b>
<ol>
<li>cd Cosmic_OverlayV2</li>
<li>sudo node start_overlay.js</li>
</ol>
This project is independently maintained and is not affiliated with TraceLabs or OriginTrail.<br>
Donations are always welcome. Thank you! <br>
Ethereum/xDAi: 0x514a264512EB9297aAB63e79b000E0bd26EE0734<br>

<b>--------------------------------------------------------------Requirements:--------------------------------------------------------------------</b>

Install nodejs, npm, jq, curl, docker, and zip
<ul>
<li>Run: sudo apt install nodejs -y</li>
<li>Run: sudo apt install npm -y</li>
<li>Run: sudo apt install jq -y</li>
<li>Run: sudo apt install curl -y</li>
<li>Run: sudo apt install docker.io -y</li>
<li>Run: sudo apt-get install zip unzip -y</li>
<li>Run: sudo apt-get install git -y</li>
</ul><br>

<b>Required for automated scripts:</b><br>
Telegram bot token : add @botfather on telegram. Follow the instructions to create your own chat bot.<br>
Telegram chat ID: add @myidbot to telegram. Type /start. It will tell you your chat ID.<br>

<b>Required for installing a new node:</b><br>
Operational wallet must have the following funds for EACH blockchain they are utilizing on their node:
  <ul>
  <li>Ethereum Blockchain: 3k TRAC and enough ETH to pay for 2 blockchain transactions</li>
  <li>Starfleet Blockchain: 3k sTRAC and enough sTRAC to pay for 2 blockchain transactions</li>
  <li>xDai Blockchain: 3k xTRAC and enough xDai to pay for 2 blockchain transactions</li>
  <li>Rinkeby Blockchain: 3k aTRAC and enough rinkeby ETH to pay for 2 blockchain transactions on <b>2</b> different operational wallets</li>
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
<li>Rename the example-node_config.json (or tstexample-node_config.json for testnet) file in this directory to node_config.json. Replace the ** content with your information. <b> MAKE SURE TO REMOVE ANY BLOCKCHAIN IMPLEMENTATION YOU ARENT STAKING ON. FOR EXAMPLE, REMOVE ETHEREUM IF YOU ARE ONLY RUNNING ON XDAI.</b><br>
  Note: This configuration should match the .origintrail_noderc file of your actual node. It is required to fill this configuration out for the overlay to function. You cannot change the default directories at this time.
</li>
</ol>

<b>Configuring your overlay</b>
<ol>
<li>Run: cd Cosmic_OverlayV2/configurations</li>
<li>Rename the example-overlay_config.json file in this directory to overlay_config.json. Replace the ** content with your information. Make sure to change the environment to mainnet if you want to run on mainnet.<br>
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
<br>
You can run sudo forever list to view the running porcess that automate the scripts. Sudo nano into the respective log file to find time stamped logs of script processes or errors if your scripts are not working.<br>
<b>----------------------------------------------------------------Features:------------------------------------------------------------------</b><br><br>
<a href="https://ibb.co/p29syCD"><img src="https://i.ibb.co/rk1LsnP/IMG-20210325-090642-421.jpg" alt="IMG-20210325-090642-421" border="0"/></a><br><br>
<br>
At any point you can hit any key NOT listed as a menu item to exit the overlay.
<br>
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
Note: If they exist, this will display rinkeby identity, starfleet identity, xDai identity, erc725 id, your node identity, and your houston password.
</li>
</ol><br>

<b>Data Creator Menu:</b>
<ol>
<li>Create a Job<br>
Note: This feature pushes data from a local directory onto the ODN in the form of an offer/job. A dummy data file is provided and used if you create a job only using the defaults.<br>
This is for more advanced users. DO NOT use this feature if you do not want to permanently spend your aTRAC/TRAC tokens.
</li>
<li>View Created Jobs<br>
Note: This opens a sub menu that allows you to return All, Active, Completed, and Not Started offer statuses.
</li>
</ol><br>

<b>----------------------------------------------------------------Optional:------------------------------------------------------------------</b><br>
The overlay uses forever to continuously run an script that triggers the automated scripts based on your configuration. If you would prefer not to run an script with forever, you can create cronjobs in your cron tab that point directly to where the scripts are installed.<br>
The overlay config will still be used for notifications if you decide to go with this option.<br>

Place the following in your crontab and make sure the path to the scripts are correct:<br>

*/5 * * * * root cd /path/to/Cosmic_OverlayV2/scripts/OTLogNotifications && sudo node Notification.js<br>
0 0 1 * * root cd /path/to/Cosmic_OverlayV2/scripts/OTLogArchiving && sudo node archive.js<br>
0 0 * * 0 root cd /path/to/Cosmic_OverlayV2/scripts/OTUpload && sudo node upload.js<br>
***** root cd /path/to/Cosmic_OverlayV2/scripts/OTHeartbeat && sudo node ping.js<br>
0 8 * * * root cd /path/to/Cosmic_OverlayV2/scripts/OTNodeReport && sudo node report.js
