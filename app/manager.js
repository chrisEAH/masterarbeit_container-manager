'use strict';
const Docker = require('node-docker-api').Docker;
const request = require('request');
var mac= require('getmac');
const os=require('os');
var config = require("./config.json");
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

var config = {
	"containerManagerServer":"http://127.0.0.1:8085",
  "nodeIdServer":"http://127.0.0.1:8090",
  "restMachineIdUrl":"/api/getContainersByMachineID?machineID=",
	"restNodeIdByMacUrl":"/api/getNodeIdByMac?mac="
}

if(process.env.rest_mongo_container_manager!=undefined){config.containerManagerServer=process.env.rest_mongo_container_manager};
if(process.env.rest_mongo_standort!=undefined){config.nodeIdServer=process.env.rest_mongo_standort};
if(process.env.rest_machine_id_url!=undefined){config.restMachineIdUrl=process.env.rest_machine_id_url};
if(process.env.rest_node_id_url!=undefined){config.restNodeIdByMacUrl=process.env.rest_node_id_url};

var standort="";


console.log("containerManagerServer: " + config.containerManagerServer);
console.log("nodeIdServer: " + config.nodeIdServer);
console.log("restMachineIdUrl: " + config.restMachineIdUrl);
console.log("restNodeIdByMacUrl: " + config.restNodeIdByMacUrl);
console.log("----------------------------------")

setInterval(getStandort, 6000);

//getNodeIdByMac();
function getStandort()
{
  mac.getMac(function(err, macAddress){
    if (err)  throw err
    console.log("MAC: "+macAddress);
    let nodeIdMacUrl=config.nodeIdServer+config.restNodeIdByMacUrl+macAddress;
    console.log("NodeIdByMAC URL: "+ nodeIdMacUrl);
    request(nodeIdMacUrl, { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      standort=body[0].standort;
      console.log("Standort: "+ standort);
      startContainers();
    });
  })
}

function startContainers()
{
  docker.container.list()
  .then((runningContainers)=>{
    //console.log(runningContainers[2].data.Names);
    getContainerFromDB(runningContainers);
  });
}

function getContainerFromDB(runningContainers)
  {
    let machieIdURL=config.containerManagerServer+config.restMachineIdUrl+standort;
    console.log("machieId URL: "+ machieIdURL);
    request(machieIdURL, { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      //console.log(body);
      //console.log(res.body[0].containerName);
      
      let sollContainers=res.body;

      runningContainers.forEach(function (runningContainer){
        beendeContainer(sollContainers, runningContainer)
      });

      sollContainers.forEach(sollContainer=>{
        starteContainer(runningContainers, sollContainer);
      })
    });
  }

  function starteContainer(runningContainers, sollContainer)
  {
    let starten=true;

    runningContainers.forEach(runningContainer => {
      if(runningContainer.data.Names[0]=="/"+sollContainer._id)
      {
        starten=false;
      }
    });
    if(starten==true)
    {
      //zieht sich das image aus der registry
      docker.image.create({}, { fromImage: sollContainer.fromImage, tag:sollContainer.tag})
      .then(function()
      {
        //startet das Image
        console.log("starte Container: "+ sollContainer.name);

        let docker1 = new Docker({ socketPath: '/var/run/docker.sock' });
        sollContainer.name=sollContainer._id;
        
        //add MQTT Topic#

        docker1.container.create(sollContainer)
          .then(container => container.start())
          .catch(error => console.log(error));
      });
      
    }
  }

  function beendeContainer(sollContainers, runningContainer)
  {
    let beenden=true;

   
    sollContainers.forEach(sollContainer => {
      
      if(runningContainer.data.Names[0]=="/"+sollContainer._id)
      {
        beenden=false;
      }
    });
    if(beenden==true && runningContainer.data.Names[0]!="/containermanager_container_manager_1")
    {
      console.log("beende Container: "+ runningContainer.data.Names[0]);
      runningContainer.delete({force:true});
    }
  }