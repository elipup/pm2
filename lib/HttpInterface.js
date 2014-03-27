//
// PM2 Monit and Server web interface
// Disserve JSON in light way
// by Strzelewicz Alexandre
//

var http  = require('http');
var os    = require('os');
var Satan = require('./Satan');
var urlT  = require('url');
var cst   = require('../constants.js');
var p     = require('path');

// Start daemon
//
// Usually it would be is started in the parent process already,
// but if I run "node HttpInterface" directly, I would probably
// like it to be not daemonized
Satan.start(true);

http.createServer(function (req, res) {
  // Add CORS headers to allow browsers to fetch data directly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // We always send json
  res.setHeader('Content-Type','application/json');

  var path = urlT.parse(req.url).pathname;

  console.log('Access on PM2 monit point %s', path);


  if (path == '/') {
    // Main monit route
    Satan.executeRemote('getMonitorData', {}, function(err, data_proc) {
      var data = {
        system_info: { hostname: os.hostname(),
                       uptime: os.uptime()
                     },
        monit: { loadavg: os.loadavg(),
                 total_mem: os.totalmem(),
                 free_mem: os.freemem(),
                 cpu: os.cpus(),
                 interfaces: os.networkInterfaces()
               },
        processes: data_proc.map(function (p) {
          return {
            pid: p.pid,
            name: p.name,
            exec_mode: p.exec_mode,
            exec_interpreter: p.exec_interpreter,
            restart_time: p.restart_time,
            unstable_restarts: p.unstable_restarts,
            created_at: p.created_at,
            pm_uptime: p.pm_uptime,
            pm_id: p.pm_id,
            status: p.status,
            env: {
              XT_PROCESS: p.env.XT_PROCESS,
              XT_NAME: p.env.XT_NAME,
              XT_VERSION: p.env.XT_VERSION,
              XT_DOMAIN: p.env.XT_DOMAIN,
              XT_URL: p.env.XT_URL,
              XT_PG_PORT: p.env.XT_PG_PORT,
              XT_SCHEDULE: p.env.XT_SCHEDULE,
              SUDO_COMMAND: p.env.SUDO_COMMAND
            }
          };
        })
      };

      res.statusCode = 200;
      res.write(JSON.stringify(data));
      return res.end();
    });
  }
  else {
    // 404
    res.statusCode = 404;
    res.write(JSON.stringify({err : '404'}));
    return res.end();
  };
}).listen(cst.WEB_INTERFACE);


// var MicroDB = require("nodejs-microdb");

// var fdb = new MicroDB({
//   "file" : p.join(cst.DEFAULT_FILE_PATH, "monit.db")
// });

// setInterval(function() {
//   Satan.executeRemote("list", {}, function(err, data_proc) {
//     console.log('adding');
//     fdb.add(data_proc);
//   });
// }, 1000);
