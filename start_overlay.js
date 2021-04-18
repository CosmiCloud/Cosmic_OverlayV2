const prompts = require('prompts');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const overlay_config = require('./configurations/overlay_config.json');
const node_config = require('./configurations/node_config.json');
const prechecks = require('./scripts/Utility/Pre/checks.js');
const install = require('./scripts/Utility/Node/install.js');
const node_configure = require('./configurations/configure.js');
const machine = require('./scripts/Utility/Node/machine.js');
const restore = require('./scripts/Utility/Node/restore.js');
const controls_util = require('./scripts/Utility/Post/controls.js');
const dashboard = require('./scripts/Utility/Api/dashboard.js');
const createJob = require('./scripts/Utility/Api/createJob.js');
const createdJobs = require('./scripts/Utility/Api/createdjobs.js');
const export_data = require('./scripts/Utility/Api/export.js');
const logs_util = require('./scripts/Utility/Post/logs.js');
const scripts_util = require('./scripts/Utility/Post/scripts.js');
const aws = require('./scripts/AWS/aws.js');


var awsbucket = overlay_config.scripts.aws_bucket_name;
var network = overlay_config.scripts.network;
var s3_url_of_backup = overlay_config.scripts.s3_url_of_backup;
var backup_filepath = overlay_config.scripts.backup_filepath;
var heartbeat = overlay_config.scripts.heartbeat.enabled;
var log_not = overlay_config.scripts.log_notifications.enabled;
var log_arch = overlay_config.scripts.log_archiving.enabled;
var aws_backup = overlay_config.scripts.aws_backup.enabled;
var report = overlay_config.scripts.report.enabled;
var create_aws_job = overlay_config.scripts.create_aws_job.enabled;

module.exports ={
menu: async function menu(){
try{
  (async () => {
    const otexist = await prechecks.otexist();

    if(otexist){
      var otexists = 'yes';
      const nodestat = await prechecks.nodestatus();
      if(nodestat == 'online'){
        var nodestatus = "\x1b[32mOnline";

        await dashboard.stakes();
      }else{
        var nodestatus = "\x1b[31mOffline";
      }

    }else{
      var otexists = 'no';
      var nodestatus = "\x1b[31mOffline";
    }

    console.log('\x1b[35m',"--------------------------[Node Status:"+nodestatus+"\x1b[35m]--------------------------");
		console.log('\x1b[35m',"[1] - Install Menu");
		console.log('\x1b[35m',"[2] - Back Up Menu");
		console.log('\x1b[35m',"[3] - Scripts Menu");
		console.log('\x1b[35m',"[4] - Log Menu");
		console.log('\x1b[35m',"[5] - Node Controls");
    console.log('\x1b[35m',"[6] - Data Creator Menu");
    console.log('\x1b[35m',"[0] - Exit",'\n');

        const response = await prompts({
          type: 'text',
          name: 'response',
          message: '\x1b[35mPlease select a menu item:'
        });

        if(response.response == '1'){
            (async () => {
              console.log('\x1b[35m',"[1] - Install a new node");
              console.log('\x1b[35m',"[2] - Restore a node directly from AWS bucket: ");
              console.log('\x1b[32m',"      "+s3_url_of_backup);
              console.log('\x1b[35m',"[3] - Restore a node from local backup from /root/OTawsbackup");
              console.log('\x1b[35m',"[0] - Return to main menu",'\n');

                  const response = await prompts({
                    type: 'text',
                    name: 'response',
                    message: '\x1b[35mWhat would you like to do?'
                  });

                  if(response.response == '1'){
                    if(otexists == 'yes'){
                       console.log('\x1b[33m',"otnode already exists!");
                     }else{
                       if(await machine.firewall() == 'fail'){
                         return;
                       }

                       if(await node_configure.createconfigs() == 'fail'){
                         return;
                       }

                       (async () => {
                         console.log('\x1b[33m',"You are about to install a new node.");
                         const response = await prompts({
                           type: 'text',
                           name: 'response',
                           message: '\x1b[35mAre you ready? (y/n)?'
                         });

                         if(response.response == 'y' || response.response == 'yes'){
                           await install.newnode();

                         }else{
                           console.log('\x1b[31m',"Exited Install Menu.");
                         }
                       })();
                     }
                    }else if(response.response == '2'){
                     if(otexists == 'yes'){
                        console.log('\x1b[33m',"otnode already exists!");
                      }else{
                        if(await aws.awscli() == 'fail'){
                          return;
                        }

                        if(await aws.s3download() == 'fail'){
                          return;
                        }

                        if(await machine.firewall() == 'fail'){
                          return;
                        }

                        if(await node_configure.createconfigs() == 'fail'){
                          return;
                        }

                        (async () => {
                          console.log('\x1b[33m',"You are about to restore a node directly from your aws bucket: "+ s3_url_of_backup+' on '+overlay_config.environment,'\n');
                          const response = await prompts({
                            type: 'text',
                            name: 'response',
                            message: '\x1b[35mAre you ready? (y/n)?'
                          });

                          if(response.response == 'y' || response.response == 'yes'){
                            await restore.restore();

                          }else{
                            console.log('\x1b[31m',"Exited Install Menu.");
                          }
                        })();
                      }
                  }else if(response.response == '3'){
                    if(otexists == 'yes'){
                       console.log('\x1b[33m',"otnode already exists!");
                     }else{
                       if(await machine.firewall() == 'fail'){
                         return;
                       }

                       if(await node_configure.createconfigs() == 'fail'){
                         return;
                       }

                       (async () => {
                         console.log('\x1b[33m',"You are about to restore a node directly from /root/OTawsbackup");
                         const response = await prompts({
                           type: 'text',
                           name: 'response',
                           message: '\x1b[35mAre you ready? (y/n)?'
                         });

                         if(response.response == 'y' || response.response == 'yes'){
                           await restore.restore();

                         }else{
                           console.log('\x1b[31m',"Exited Install Menu.");
                         }
                       })();
                     }
                  }else if(response.response == '0'){
                    module.exports.menu();
                  }else{
                    console.log('\x1b[31m',"Exited Install Menu.");
                  }
                })();

        }else if(response.response == '2'){
          (async () => {
            console.log('\n','\x1b[35m',"What would you like to do?");
            console.log('\x1b[35m',"[1] - Create a local backup file");
            console.log('\x1b[35m',"[2] - Create a backup file and upload it to AWS bucket: "+awsbucket);
            console.log('\x1b[35m',"[3] - Delete local backups in /root/OTBackups/backup");
            console.log('\x1b[35m',"[0] - Return to main menu");

            const response = await prompts({
              type: 'text',
              name: 'response',
              message: '\x1b[35mWhat would you like to do?'
            });

            if(response.response == '1'){
              if(await controls_util.createbackup() == 'fail'){
                return;
              }
            }else if(response.response == '2'){
              if(await aws.awsbackup() == 'fail'){
                return;
              }
            }else if(response.response == '3'){
              if(await controls_util.cleanbackups() == 'fail'){
                return;
              }
            }else if(response.response == '0'){
              module.exports.menu();
            }else{
              console.log('\x1b[31m',"Exited Back up Menu.");
            }
          })();
        }else if(response.response == '3'){
          (async () => {
            var script_check = "sudo forever list"
            var scripts_status = await exec(script_check);
            var scripts_status = scripts_status.stdout

            var n = scripts_status.includes("notification")
            var n = n.toString();

            if (n == 'true'){
              var status = "\x1b[32mActive";
            }else{
              var status = "\x1b[31mDeactivated";;
            }

            console.log("\x1b[35m-----------------------[Scripts Status:"+status+"\x1b[35m]-----------------------",'\n');
            if(heartbeat == 'true'){
              console.log('\x1b[35m', "Node Heartbeat: ",'\x1b[32m', "                    [Enabled]");
            }else{
              console.log('\x1b[35m', "Node Heartbeat: ",'\x1b[31m', "                    [Disabled]");
            }
            if(log_not == 'true'){
              console.log('\x1b[35m', "Automated Log Notifications: ",'\x1b[32m', "       [Enabled]");
            }else{
              console.log('\x1b[35m', "Automated Log Notifications: ",'\x1b[31m', "       [Disabled]");
            }
            if(log_arch == 'true'){
              console.log('\x1b[35m', "Automated Log Archiving: ",'\x1b[32m', "           [Enabled]");
            }else{
              console.log('\x1b[35m', "Automated Log Archiving: ",'\x1b[31m', "           [Disabled]");
            }
            if(aws_backup == 'true'){
              console.log('\x1b[35m', "Automated AWS Backups: ",'\x1b[32m', "             [Enabled]");
            }else{
              console.log('\x1b[35m', "Automated AWS Backups: ",'\x1b[31m', "             [Disabled]");
            }
            if(report == 'true'){
              console.log('\x1b[35m', "Daily Reports: ",'\x1b[32m', "                     [Enabled]");
            }else{
              console.log('\x1b[35m', "Daily Reports: ",'\x1b[31m', "                     [Disabled]");
            }
            if(create_aws_job == 'true'){
              console.log('\x1b[35m', "Scheduled AWS Jobs: ",'\x1b[32m', "                [Enabled]");
            }else{
              console.log('\x1b[35m', "Scheduled AWS Jobs: ",'\x1b[31m', "                [Disabled]");
            }
            console.log(" ");
            console.log('\x1b[35m', "[1] - Start maintenance scripts");
            console.log('\x1b[35m', "[2] - Stop maintenance scripts");
            console.log('\x1b[35m', "[3] - Restart maintenance scripts");
            console.log('\x1b[35m', "[0] - Return to main menu",'\n');

            const response = await prompts({
              type: 'text',
              name: 'response',
              message: '\x1b[35mWhat would you like to do?'
            });

            if(response.response == '1'){
              scripts_util.startscripts(function(response){
                //console.log(response);
              });
            }else if(response.response == '2'){
              scripts_util.stopscripts(function(response){
                //console.log(response);
              });
            }else if(response.response == '3'){
              scripts_util.restartscripts(function(response){
                //console.log(response);
              });
            }else if(response.response == '0'){
              module.exports.menu();
            }else{
              console.log('\x1b[31m',"Exited Scripts Menu.");
            }
          })();
        }else if(response.response == '4'){
          (async () => {
            console.log('\x1b[35m', "[1] - Display node logs");
            console.log('\x1b[35m', "[2] - Archive node logs to ~/OTLogArchives");
            console.log('\x1b[35m', "[3] - Display Log file info");
            console.log('\x1b[35m', "[4] - Display Archives");
            console.log('\x1b[35m', "[5] - Delete Archives");
            console.log('\x1b[35m', "[0] - Return to main menu");

            const response = await prompts({
              type: 'text',
              name: 'response',
              message: '\x1b[35mWhat would you like to do?'
            });

            if(response.response == '1'){
              if(await logs_util.logs() == 'fail'){
                return;
              }
            }else if(response.response == '2'){
              if(await logs_util.logarchiving() == 'fail'){
                return;
              }
            }else if(response.response == '3'){
              if(await logs_util.logsize() == 'fail'){
                return;
              }
            }else if(response.response == '4'){
              if(await logs_util.displayarchives() == 'fail'){
                return;
              }
            }else if(response.response == '5'){
              if(await logs_util.deletearchives() == 'fail'){
                return;
              }
            }else if(response.response == '0'){
              module.exports.menu();
            }else{
              console.log('\x1b[31m',"Exited Log Menu.");
            }
          })();
        }else if(response.response == '5'){
          (async () => {
            console.log('\x1b[35m', "[1] - Start node");
            console.log('\x1b[35m', "[2] - Stop node");
            console.log('\x1b[35m', "[3] - Restart node");
            console.log('\x1b[35m', "[4] - Display node credentials");
            console.log('\x1b[35m',"[0] - Return to main menu",'\n');

            const response = await prompts({
              type: 'text',
              name: 'response',
              message: '\x1b[35mWhat would you like to do?'
            });

            if(response.response == '1'){
              controls_util.start(function(response){
                //console.log(response);
              });
            }else if(response.response == '2'){
              controls_util.stop(function(response){
                //console.log(response);
              });
            }else if(response.response == '3'){
              controls_util.restart(function(response){
                //console.log(response);
              });
            }else if(response.response == '4'){
              controls_util.credits(function(response){
                //console.log(response);
              });
            }else if(response.response == '0'){
              module.exports.menu();
            }else{
              console.log('\x1b[31m',"Exited Control Menu.");
            }
          })();
        }else if(response.response == '6'){
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
            await createJob.createJob();
          }else if(response.response == '2'){
            await createdJobs.myJobs();
          }else if(response.response == '3'){
            await export_data.export_data();
          }else if(response.response == '0'){
            module.exports.menu();
          }
        }else if(response.response == '0'){
          console.log('\x1b[31m',"Exited Main Menu.");
        }else{
          console.log('\x1b[31m',"Exited Main Menu.");
        }
      })();
    }catch(e){
      console.log('\x1b[31m',e);
      return'fail';
    }
}
}
module.exports.menu();
