"use strict";
const http = require('http');
const url = require('url');
const request = require('request');

let PORT = process.env.PORT || 443;

process.argv.forEach(function (arg) {
  if(arg.indexOf('--port=') === 0) {
    PORT = parseInt(arg.replace('--port=', ''), 10);
  }
});

http.createServer((req, response) => {
  if (!req.url.substring(1)) {
    return loadWebpage(req, response);
  }

  let remoteURL = url.parse(req.url.substring(1));
  if(!remoteURL.hostname || remoteURL.hostname === 'localhost') return response.end();

  if(req.method === 'OPTIONS') {
    response.writeHead(200, {
      'access-control-allow-origin': req.headers.origin || '*',
      'access-control-allow-headers': 'Origin, X-Requested-With, Content-Type, Accept, authorization'
    });
    return response.end();
  }

  for(let key in req.headers) {
    if(key.match(/host|cookie/ig)){
      delete req.headers[key];
    }
  }

  let config = {
    url: remoteURL,
    followAllRedirects: true,
    method: req.method,
    headers: req.headers,
    gzip: true
  };

  if(req.method !== 'HEAD') {
    config.body = req;
  }

  request(config)
    .on('response', res => {
      // Check if the response is the manifest file
      if (remoteURL.pathname.endsWith('.mpd')) {
        // Instead of echoing the redirected URL, redirect the response directly
        response.writeHead(302, { 'Location': res.request.uri.href });
        response.end();
        console.log("Redirected URL:", res.request.uri.href); // Output redirected URL
      } else {
        // For other types of responses, echo the redirected URL
        response.writeHead(res.statusCode, res.headers);
        res.pipe(response);
        console.log("Redirected URL:", res.request.uri.href); // Output redirected URL
      }
    })
    .on('error', () => response.end());

}).listen(PORT);

function loadWebpage(req, res) {
  // Function to load webpage, if needed
}
