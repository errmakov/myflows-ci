import { execSync } from "child_process";
import express from "express";
import config from "./config/config.js";
let confKey = (process.env.SETTING || "development") as TConfigKey;

const cfg = config[confKey];

const deploy = async () => {
	const ansible = execSync(
        `ANSIBLE_LOG_PATH=/tmp/ansible.log ansible-playbook -i /opt/projects/platform/front/dev2.myflows.ru/inventory.ini /opt/projects/platform/front/dev2.myflows.ru/stage.pb.yaml -e "target_host=stage_local"`,
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024}
).toString();
      console.log('Ansiblee output:', ansible)

}

//setTimeout(async ()=>{
//	console.log('Timout passed. Going deploy routine');
//	await deploy()
//      console.log("Deploy finished.")	
//	
//},1000)

console.log('Deploy activated')
const app = express();

app.get('/', async (req, res)=>{
	console.log('GET CALL received')
	res.status(200).send("Deployment started!");
	await deploy()
	console.log('finishing app.get')
})

app.listen(cfg.port, () => {
  console.log(
    `Deploy service started listening at ${new Date().toISOString()} on port ${
      cfg.port
    }`
  );
});

export default {}
