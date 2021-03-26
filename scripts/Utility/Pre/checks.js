const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports={
    //prechecks for docker and jq
    nodestatus: async function nodestatus(){
      try {
        var runStateq = "sudo docker inspect -f {{.State.Running}} otnode"
        var running = await exec(runStateq);
        var running = running.stdout
        var running = running.trim().replace(/\r?\n|\r/g, "");

        if(running == 'true'){
            return "online";
        }else if(running == 'false'){
            return "offline";
        }

      } catch (e) {
        console.log('\x1b[31m',e); // should contain code (exit code) and signal (that caused the termination).
        return 'fail';
      }
    },

    otexist: async function otexist(){
      try {
        var node_check = 'sudo docker inspect otnode'
        const { stdout, stderr } = await exec(node_check);
          return stdout;

      } catch (e) {
        //console.error(e);
      }
    }
}
