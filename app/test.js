'use strict';
const Docker = require('node-docker-api').Docker;
const request = require('request');
const os=require('os');

var config = require("./config.json");
const docker = new Docker({ socketPath: '/var/run/docker.sock' });


mongoDbServer=process.env.mongo;

console.log("Parameterreinfolge: mongoDbServer");
console.log("Beispiel: http://10.17.115.37:6666");


console.log("mongoDbServer: " + mongoDbServer);

start();



function getRunningContainers()
{
  docker.container.list()
  .then((runningContainers)=>{
    getContainerFromDB(runningContainers)
  });
}

function sollContainers()
{
    request(mongoDbServer+config.restMachineID+getNodeId(), { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        return sollContainers=res.body;
      });
}

function getContainerFromDB(runningContainers)
  {
    request(mongoDbServer+config.restMachineID+getNodeId(), { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      //console.log(body);
      //console.log(res.body[0].containerName);
      
      sollContainers=res.body;

      sollContainers.forEach(sollContainer=>{
        starteContainer(runningContainers, sollContainer);
      })
    });
  }

  function starteContainer(runningContainers, sollContainer)
  {
    let starten=true;

    runningContainers.forEach(runningContainer => {
      console.log("Container is running: "+ runningContainer.data.Names[0]);
      let sollContainerName="/"+sollContainer.containerName;
      if(runningContainer.data.Names[0]==sollContainerName)
      {
        starten=false;
      }
    });
    console.log("------------------------------");
    if(starten==true)
    {
      docker.container
      .create({
        name: "watchtower",
        Image: "v2tec/watchtower",
        HostConfig: {
          Binds: ["//var/run/docker.sock://var/run/docker.sock"]
        }
      })
      .then(container=>container.start())
      .catch(error => console.log(error));
    }
  }

  function beendeContaier(runningContainers, sollContainer)
  {
    let starten=true;

    runningContainers.forEach(runningContainer => {
      console.log("Container is running: "+ runningContainer.data.Names[0]);
      let sollContainerName="/"+sollContainer.containerName;
      if(runningContainer.data.Names[0]==sollContainerName)
      {
        starten=false;
      }
    });
    console.log("------------------------------");
    if(starten==true)
    {
      docker.container
      .create({
        name: "watchtower",
        Image: "v2tec/watchtower",
        HostConfig: {
          Binds: ["//var/run/docker.sock://var/run/docker.sock"]
        }
      })
      .then(container=>container.start())
      .catch(error => console.log(error));
    }
  }

  function getNodeId()
  {
    return os.hostname().replace(/\./g, '/');
  }