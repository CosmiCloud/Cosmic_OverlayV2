# Cosmic Overlay - An OriginTrail DKG Node GUI
------------------------------------------------------------------------------------------------------------------------------------------------------------------
The Cosmic Overlay provides a streamlined interface to lower the knowledge barrier when running an Origintrail DKG Node: https://github.com/OriginTrail/ot-node.
<br><br>
Out of the box the overlay offers a staking dashboard, install/restore shortcuts, automated restic backups to AWS, telegram log alerts, job creation shortcuts, and more. The overlay assumes your container and node configuration names are the defaults established by Trace Labs.  <b>Supports V5 Testnet and Mainnet</b>
<br><br>
Before starting the overlay, please read and follow the requirements and configuration sections located below.
<br><br>
This project is independently maintained and is not affiliated with TraceLabs or OriginTrail.
<br><br>
<a href="https://ibb.co/pZP2Hff"><img src="https://i.ibb.co/pZP2Hff/mainmenu.png" alt="mainmenu" border="0"></a>
<br><br>

<b>--------------------------------------------------------------Requirements:--------------------------------------------------------------------</b>
Install nodejs, npm, jq, curl, docker, zip, and restic if they are not already installed.
<ul>
<li>Run: sudo apt update -y && sudo apt upgrade -y</li>
<li>Run: sudo apt install nodejs -y</li>
<li>Run: sudo apt install npm -y</li>
<li>Run: sudo apt install jq -y</li>
<li>Run: sudo apt install curl -y</li>
<li>Run: sudo apt install docker.io -y</li>
<li>Run: sudo apt-get install zip unzip -y</li>
<li>Run: sudo apt-get install git -y</li>
<li>Run: sudo npm install dotenv -y</li>
</ul><br>

<b>Required for automated scripts:</b><br>
Telegram bot token : add @botfather on telegram. Follow the instructions to create your own chat bot.<br>
Telegram chat ID: add @myidbot to telegram. Type /start. It will tell you your chat ID.<br>

<b>Required for installing a new node:</b><br>
Operational wallet must have the following funds for EACH blockchain they are utilizing on their node:
  <ul>
  <li>Ethereum Blockchain: 3k TRAC and enough ETH to pay for 2 blockchain transactions</li>
  <li>Polygon Blockchain: 3k polygon TRAC and enough polygon to pay for 2 blockchain transactions</li>
  <li>xDai Blockchain: 3k xTRAC and enough xDai to pay for 2 blockchain transactions</li>
  <li>Rinkeby Blockchain: 3k aTRAC and enough rinkeby ETH to pay for 2 blockchain transactions on <b>2</b> different operational wallets</li>
  </ul>
<br>
<br>
<b>Required for aws s3 features:</b><br>
Create an https://aws.amazon.com/s3/ account and create a new api access key and secret if you want to configure the overlay to interact with aws s3 storage.
<br><br>
<b>Always</b> check your arangodb and compare the arangodb size of a new backup to an old backup before deleting the old backup.<br><br>
<b>Never</b> delete your backups on aws until you have successfully uploaded a back up from your migrated node AND the arandoDB sizes match.<br><br>
<b>Never</b> destroy/wipe your old server before testing that the migrated node is working properly.

<b>-----------------------------------------------------------Configuration:------------------------------------------------------------</b>

<ol>
<li>Run: sudo git clone https://github.com/CosmiCloud/Cosmic_OverlayV2.git</li>
<li>Run: sudo cd Cosmic_OverlayV2/cron-jobs-node</li>
<li>Run: sudo npm i shelljs</li>
<li>Run: sudo npm i express</li>
<li>Run: sudo npm i node-cron</li>
<li>Run: sudo npm i forever -g</li>
<li>Run: cd</li>
</ol>
<br>

<b>Configuring your node</b>
<ol>
<li>Run: cd Cosmic_OverlayV2/configurations</li>
<li>If you are running testnet, Run: sudo cp tstexample-node_config.json node_config.json</li>
<li>If you are running mainnet, Run: sudo cp example-node_config.json node_config.json</li>
<li>Run: sudo nano node_config.json</li>
<li>Replace the ** content with your information. <b> MAKE SURE TO REMOVE ANY BLOCKCHAIN IMPLEMENTATION YOU ARENT STAKING ON. FOR EXAMPLE, REMOVE ETHEREUM IF YOU ARE ONLY RUNNING ON XDAI. Don't mess up the formatting.</b><br>
  Note: This configuration should match the .origintrail_noderc file of your actual node if you already have an existing node. It is required to fill this configuration out for the start and restart overlay options to function. You cannot change the default directories at this time.
</li>
<li>Run: cd</li>
</ol>

<b>Configuring your overlay</b>
<ol>
<li>Run: cd Cosmic_OverlayV2/configurations</li>
<li>Run: sudo cp example-overlay_config.json overlay_config.json</li>
<li>Replace the ** content with your information. Make sure to change the environment to mainnet if you want to run on mainnet.<br>
  Note: It is required to fill this configuration out for the overlay to function. Misconfiguration could cause some features to fail. You can add custom log notifications by adding an additional json block to the notifications object. You can use a different or the same bot token for each different notification.
</li>
<li>Run: cd</li>
</ol>

<a href="https://ibb.co/zF7KrFN"><img src="https://i.ibb.co/zF7KrFN/installmenu.png" alt="installmenu" border="0"></a><br>
<ul>
<li>Install a brand new node based off of the configuration in the overlay config</li>
<li>Restore directly from configured aws directory</li>
<li>Restore directly from a local backup</li><br>
</ul><br>

<a href="https://ibb.co/SvJzrf3"><img src="https://i.ibb.co/SvJzrf3/backupmenu.png" alt="backupmenu" border="0"></a><br>
<ul>
<li>Creates a local back up file on the directory</li>
<li>Creates complete back up file and pushes it to configured aws bucket. Not a restic upload</li>
<li>Removes local backups</li>
</ul><br>

<a href="https://ibb.co/MpP0zR5"><img src="https://i.ibb.co/MpP0zR5/scriptsmenu.png" alt="scriptsmenu" border="0"></a>
<ul>
<li>Start scripts. <br>
Note: This will activate your enabled scripts</li>
<li>Stop scripts. <br>
Note: This will deactivate your enabled scripts</li>
<li>Stop scripts<br>
Note: This will restart your scripts so any config changes will be picked up.</li>
</ul><br>
You can run sudo forever list to view the running porcess that automate the scripts. Sudo nano into the respective log file to find time stamped logs of script processes or errors if your scripts are not working.<br>

<a href="https://ibb.co/C7QxtB9"><img src="https://i.ibb.co/C7QxtB9/utilitymenu.png" alt="utilitymenu" border="0"></a>
<ol>
<li>Display logs.</li>
<li>Archive logs. <br>
Note: This will archive (compress) your node logs and store them and then truncate your node logs to 0MB.</li>
<li>Display log file info. <br>
Note: This will display log file location and size.</li>
<li>Display log archives.</li>
<li>Delete log archives.</li>
</ol><br>

<a href="https://ibb.co/6H2p8Ht"><img src="https://i.ibb.co/6H2p8Ht/creatorsmenu.png" alt="creatorsmenu" border="0"></a>
<ol>
<li>Create a Job<br>
Note: This feature pushes data from a local directory onto the ODN in the form of an offer/job. A dummy data file is provided and used if you create a job only using the defaults.<br>
This is for more advanced users. DO NOT use this feature if you do not want to permanently spend your aTRAC/TRAC tokens.
</li>
<li>View Created Jobs<br>
Note: This opens a sub menu that allows you to return All, Active, Completed, and Not Started offer statuses.
</li>
</ol><br>

<a href="https://ibb.co/Yk7r0mX"><img src="https://i.ibb.co/Yk7r0mX/controlsmenu.png" alt="controlsmenu" border="0"></a>
<ol>
<li>Start node.</li>
<li>Stop node</li>
<li>Restart node</li>
<li>Display node credentials <br>
Note: If they exist, this will display rinkeby identity, polkadot identity, xDai identity, erc725 id, your node identity, and your houston password.
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
