const enigma = require('enigma.js');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const schema = require('enigma.js/schemas/12.20.0.json');

// The WebSocket URL to your Sense Enterprise installation:
const serverName = "ismailby";
const prefix = "jwt";

const engineUrl = 'wss://' + serverName + '/' + prefix +'/app/engineData';

// The Sense Enterprise-configured user directory for the user you want to identify
// as:
const userDirectory = 'BISTRATEJIK';
const userId = 'ismailbaygin';

var request = require('request');
var host = serverName;
var r = request.defaults({
    rejectUnauthorized: false,
    host: host
});


// bu kısım güvenli değil. geçerli root sertifasını bulma işlemini bypass ediyor. kesin çözüm root sertifikası bulundurmak.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; 

// The Sense Enterprise-configured JWT structure. Change the attributes to match
// your configuration:
const token = {
  directory: userDirectory,
  user: userId,
};

// Path to the private key used for JWT signing:
const privateKeyPath = './keys/private.key';
const key = fs.readFileSync(path.resolve(__dirname, privateKeyPath));

// Sign the token using the RS256 algorithm:
const signedToken = jwt.sign(token, key, { algorithm: 'RS256' });


const config = {
  schema,
  url: engineUrl,
  // Notice how the signed JWT is passed in the 'Authorization' header using the
  // 'Bearer' schema:
  createSocket: url => new WebSocket(url, {
    headers: { Authorization: `Bearer ${signedToken}` },
  }),
};




const session = enigma.create(config);
session.open().then((global) => {
  console.log('Session was opened successfully');
 // console.log(global);


//global.getDocList().then((applist) => {
  //const apps = applist.map(app => {
    //console.log("app: " + app.qDocId);



    global.openDoc("4a910637-0cac-44a2-8394-2598bea4acb5").then((doc) =>  {
      doc.getObjects({"qTypes": ["barchart"]}).then((objectlist) =>  {
        //console.log(objects);
        const objects = objectlist.map(object => {
          //console.log(object.qInfo.qId);
          doc.getObject(object.qInfo.qId).then(api => { 

              api.getLayout().then(layout => {

                console.log(layout.title + " : " + layout.qInfo.qId);

         //      console.log(layout);
                  /*
                  api.getHyperCubeData('/qHyperCubeDef', [
                            {
                              qTop: 0,
                              qLeft: 0,
                              qHeight: 100, //layout.qHyperCube.qSize.qcy,
                              qWidth: layout.qHyperCube.qSize.qcx
                            }
                  ]).then(cube => {
                                  console.log(cube[0].qArea);
                  }).catch(error => console.log("cube : " + error));
                  */

              }).catch(error => console.log("layout : " + error));
          }).catch(error => console.log("object : " + error));
        })
      }).catch(error => console.log("objects : " + error));
  }).catch(error => console.log("doc : " + error));



//  });
//  });

})

.then(function () {
            session.close()
                .then(function () {
                    console.log("session closed.")
                })
})

.catch(error => console.log('Failed to open session and/or retrieve the app list:', error));


/*
async function openApp(global, appid) {


    global.openDoc(app.qDocId).then((doc) =>  {
      doc.getObjects({"qTypes": ["barchart"]}).then((objectlist) =>  {
        //console.log(objects);
        const objects = objectlist.map(object => {
          //console.log(object.qInfo.qId);
          doc.getObject(object.qInfo.qId).then(api => { 

              api.getLayout().then(layout => {

                console.log(layout.title + " : " + layout.qInfo.qId);
         //      console.log(layout);
               
                  api.getHyperCubeData('/qHyperCubeDef', [
                            {
                              qTop: 0,
                              qLeft: 0,
                              qHeight: 100, //layout.qHyperCube.qSize.qcy,
                              qWidth: layout.qHyperCube.qSize.qcx
                            }
                  ]).then(cube => {
                                  console.log(cube[0].qArea);
                  }).catch(error => console.log("cube : " + error));
            
              }).catch(error => console.log("layout : " + error));
          }).catch(error => console.log("object : " + error));
        })
      }).catch(error => console.log("objects : " + error));
  }).catch(error => console.log("doc : " + error));

}

*/