const enigma = require('enigma.js');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const clear = require('clear');
const schema = require('enigma.js/schemas/12.20.0.json');
var charm = require('charm')();
var settings = require('./config');

charm.pipe(process.stdout);
charm.reset();
// The WebSocket URL to your Sense Enterprise installation:
const serverName = settings.hostName;
const prefix = settings.prefix;
const userDirectory = settings.userDirectory;
const userId = settings.userId;
const protocolWs = settings.isSecure ? 'wss' : 'ws';
const protocolHttp = settings.isSecure ? 'https' : 'http';
//const engineUrl = protocolWs + '://' + serverName + '/' + prefix + '/app/engineData';
const engineUrl =  'wss://' + serverName + '/' + prefix + '/app/engineData';
const hostname = serverName;
const port = settings.port;

const senseUtilities = require('enigma.js/sense-utilities');
const timeOutSecond = settings.timeOutSecond;

var second = 0;
const intervalObj = setInterval(() => {
  tickTimer();
}, 1000);

var request = require('request');
var r = request.defaults({
    rejectUnauthorized: false,
    host: serverName
});


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

prepareTerminal();
writeDimAtPosition(66, 6, "Initializing...");

//r.get(protocolHttp + '://' + serverName + '/'+prefix+'/hub/', function(error, response, body) {
r.get('https://' + serverName + '/'+prefix+'/hub/', function(error, response, body) {
    r.post({
            url: response.request.uri.href,
            form: {
                "username": userDirectory + "\\" + userId,
                "pwd": settings.password
            }
        },
        function(err, res, body) {
            r.get(res.headers.location, function(err, response, body) {
                var cookies = response.headers['set-cookie'];
                var sessioncookieheader = cookies[0].split(';')[0].split('=')[0],
                    sessioncookie = cookies[0].split(';')[0]; 
                ;

                const config = {
                    schema,
                    url: engineUrl,
                    createSocket: url => new WebSocket(url, {
                        headers: {
                            'Cookie': sessioncookie,
                            'Content-Type': 'application/json'
                        }
                    }),
                };

                var appcounter = [], objectcounter = 0, rowcounter = 0, colcounter = 0, cellcounter = 0;
                var docListSession = enigma.create(config);
                docListSession.open().then(function(global) {
                    charm.foreground('yellow');
                    writeDimAtPosition(66, 6, "Caching...       ");
                        return global.getDocList().then((applist) => {
                            var applistused = settings.singleAppId.length != 0 ? [{qDocId: settings.singleAppId, qDocName: "SingleApp"}] : applist;
                            return Promise.all(applistused.map(function(doc) {
                                var session = enigma.create(enigmaInstance(config, doc.qDocId, sessioncookie));

                                return session.open()
                                    .then(function(global) {
                                        var a = global.openDoc(doc.qDocId, '', '', '', false);
                                        var b = a.then(function(app) {
                                            return app.getObjects({
                                                "qTypes": ["barchart", "linechart", "table", "map", "scatterplot", "combochart"]
                                            });
                                        });
                                     

                                        return Promise.all([a, b]).then(function(result) {
                                            var app = result[0],
                                                objectlist = result[1];
                                            return Promise.all(objectlist.map(function(object) {         
                                                return app.getObject(object.qInfo.qId);
                                            })).then(function(objects) {
                                                return Promise.all(objects.map(function(qlikObject) {
                                                    var c = qlikObject.getLayout();
                                                    var d = c.then(function(layout) {
                                                        var h = (layout.qHyperCube.qSize.qcx * layout.qHyperCube.qSize.qcy) <= 10000 ? layout.qHyperCube.qSize.qcy : Math.floor(10000 / layout.qHyperCube.qSize.qcx);
                                                        
                                                        return qlikObject.getHyperCubeData('/qHyperCubeDef', [{
                                                            qTop: 0,
                                                            qLeft: 0,
                                                            qHeight: h,
                                                            qWidth: layout.qHyperCube.qSize.qcx
                                                        }]);
                                                    });
                                                    return Promise.all([c, d]).then(function(cuberesult) {
                                                        objectcounter++;
                                                        if (appcounter.indexOf(doc.qDocName) === -1) appcounter.push(doc.qDocName);
                                                        rowcounter = rowcounter + cuberesult[1][0].qArea.qHeight;
                                                        colcounter = colcounter + cuberesult[1][0].qArea.qWidth;
                                                        cellcounter = cellcounter + (cuberesult[1][0].qArea.qWidth * cuberesult[1][0].qArea.qHeight);
                                                        var lastMatrix = (cuberesult[1][0].qArea.qWidth+'x'+cuberesult[1][0].qArea.qHeight).substr(0, 20);
                                                        var lastObject = (cuberesult[0].qInfo.qType + " (" + cuberesult[0].qInfo.qId + ")").substr(0, 20);
                                                        var lastApp = doc.qDocName.substr(0, 20);
                                                        charm.foreground('white');
                                                        writeDimAtPosition(66, 10, appcounter.length.toString());  // total apps
                                                        writeDimAtPosition(66, 11, objectcounter.toString()); // total objects
                                                        writeDimAtPosition(66, 12, cellcounter.toString()); // total cells
                                                        writeDimAtPosition(66, 15, lastApp + generateSpaces(lastApp.length));  // last app
                                                        writeDimAtPosition(66, 16, lastObject + generateSpaces(lastObject.length)); // last object
                                                        writeDimAtPosition(66, 17, lastMatrix + generateSpaces(lastMatrix.length));  // last hypercube
                                                        charm.foreground('green');
                                                        highlightRandomDot();
                                                        return true;
                                                    });
                                                }));
                                            });
                                        });
                                    })
                                    .then(function() {
                                        session.close()
                                            .then(function() {
                                                //console.log("app session closed.")
                                                
                                            })
                                    })
                                    .catch(function(error) {
                                    });

                              //      return Promise.resolve();

                            })).then(function() {
                                        highlightAllDots();
                                        charm.display("reverse");
                                        writeBrightAtPosition(66, 6, "Finished.        ");
                                        charm.position(1,25);
                                        charm.display("reset");
                                        clearInterval(intervalObj);
                                         process.exit();
                                         return;
                        })
                        })
                        .catch(function(error) {
                           writeBrightAtPosition(66, 6, "Error : " + error.message);
                           charm.position(1,25);
                           process.exit();
                        return;
                        });



                    }).then(function() {
                        docListSession.close()
                            .then(function() {
                               // console.log("doc list session closed.")
                            })
                    })  
                    .catch(function(error) {
                        charm.foreground("red");
                        writeBrightAtPosition(66, 6, "ErrorExt.        ");
                        return true;
                        process.exit();
                    });



            });

        });
});


function enigmaInstance(config, identity, cookie) {
    var enigmaInstance = {
        schema: schema,
        url: buildConfig(config, identity),
        createSocket: url => new WebSocket(url, {
            headers: {
                'Cookie': cookie,
                'Content-Type': 'application/json'
            }
        })
    };
    return enigmaInstance;
}

function buildConfig(config, identity) {
    var newConfig = {
        host: serverName,
        appid: identity,
        prefix: prefix,
        port: port,
        identity: identity
    }
    return senseUtilities.buildUrl(newConfig);
}


function prepareTerminal() {

    // https://www.alt-codes.net/plus-sign-symbols

    charm.reset();
    charm.cursor(false);
    charm.background("black");
    charm.foreground("green");

    dimAllDots();

    writeDimAtPosition(45, 2, "========================================");
    charm.foreground("white");
    writeBrightAtPosition(50, 3, "Qlik Sense Cache Warmer Script");
    charm.foreground("green");
    writeDimAtPosition(45, 4, "========================================");

    writeDimAtPosition(45, 6, "Status:");
    writeDimAtPosition(45, 7, "Elapsed Time:");

    writeDimAtPosition(45, 9, "=========== Cached Resources ===========");
    writeBrightAtPosition(56, 9, " Cached Resources ");
    writeDimAtPosition(45, 10, "Apps:");
    writeDimAtPosition(45, 11, "Objects:");
    writeDimAtPosition(45, 12, "Hypercube Cells:");

    writeDimAtPosition(45, 14, "============ Last Activity =============");
    writeBrightAtPosition(57, 14, " Last Activity ");
    writeDimAtPosition(45, 15, "App:");
    writeDimAtPosition(45, 16, "Object:");
    writeDimAtPosition(45, 17, "Hypercube size:");

    writeDimAtPosition(66, 6, "");  // status
    writeDimAtPosition(66, 7, "");  // status
    writeDimAtPosition(66, 10, "");  // total apps
    writeDimAtPosition(66, 11, ""); // total objects
    writeDimAtPosition(66, 12, ""); // total cells
    writeDimAtPosition(66, 15, "");  // last app
    writeDimAtPosition(66, 16, ""); // last object
    writeDimAtPosition(66, 17, "");  // last hypercube

    charm.position(1, 25);

}

function writeRandom(x, y, text) {
    charm.position(x, y);
    for (var i = 0; i < text.length; i++) {
        var type =  Math.round(Math.random()) == 0 ? "dim" : "bright";
        charm.display(type);
        charm.write(type == "dim" ? "˖" : text[i]);
    }
}

function writeDimAtPosition(x, y, text) {
        charm.display("dim");
        charm.position(x, y).write(text);
     //   charm.position(1,1);
}


function writeBrightAtPosition(x, y, text) {
        charm.display("bright");
        charm.position(x, y).write(text);
      //  charm.position(1,1);
}


function highlightRandomDot() {
    var rx = Math.floor(Math.random()*40 + 3);
    var ry = Math.floor(Math.random()*17 + 2);
    writeBrightAtPosition(rx,ry,'+');
}


function dimAllDots() {
    charm.foreground('white');
    for (var r = 2; r <= 18; r++) {
        writeDimAtPosition(3, r, "˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖˖");
    }
    charm.foreground('green');
}

function highlightAllDots() {
    charm.foreground('green');
     for (var r = 2; r <= 18; r++) {
        writeBrightAtPosition(3, r, "++++++++++++++++++++++++++++++++++++++++");
    }
}

function tickTimer() {
    if (second >= timeOutSecond) process.exit();
    second++;
    charm.foreground('white');
    writeDimAtPosition(66, 7, fancyTimeFormat(second));  // status

}


function generateSpaces(length) {
    var spaceToProduce = 20-length, str = "";
    if (spaceToProduce>0) {
        for (var i = 0; i < spaceToProduce; i++) {
            str += " ";
        }
    }
    return str;
}



function fancyTimeFormat(time)
{   
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}
