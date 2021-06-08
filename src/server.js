import App from "./App";
import React from "react";
import bodyParser from "body-parser";
import { StaticRouter } from "react-router-dom";
import express from "express";
import { renderToString } from "react-dom/server";

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

const server = express();

let subscriptions = [];

server
  .disable("x-powered-by")
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .get("/", (req, res) => {
    const context = {};
    const markup = renderToString(
      <StaticRouter context={context} location={req.url}>
        <App />
      </StaticRouter>
    );

    if (context.url) {
      res.redirect(context.url);
    } else {
      res.status(200).send(
        `<!doctype html>
    <html lang="">
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta charset="utf-8" />
        <title>SSE Events</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${
          assets.client.css
            ? `<link rel="stylesheet" href="${assets.client.css}">`
            : ""
        }
        ${
          process.env.NODE_ENV === "production"
            ? `<script src="${assets.client.js}" defer></script>`
            : `<script src="${assets.client.js}" defer crossorigin></script>`
        }
    </head>
    <body>
        <div id="root">${markup}</div>
    </body>
</html>`
      );
    }
  });

server.get("/events/messages", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });

  // If connection failed this is the time browser will wait before re-connecting
  res.write("retry: 1000\n\n");

  // To keep connection open, even if data hasn't been sent for a while
  const interval = setInterval(() => {
    res.write(":\n\n");
  }, 30000);

  // store open connection in local variable
  subscriptions.push(res);

  // notify all subscribers about new connection
  subscriptions.forEach((subscription) => {
    subscription.write("event: new-connection\n");
    subscription.write(`data: ${subscriptions.length}\n\n`);
  });

  req.on("close", () => {
    clearInterval(interval);

    // remove connection from local variable
    subscriptions = subscriptions.filter(
      (subscription) => subscription !== res
    );
    // notify all subscribers that number of connections changed
    subscriptions.forEach((subscription) => {
      subscription.write("event: new-connection\n");
      subscription.write(`data: ${subscriptions.length}\n\n`);
    });
  });
});

server.post("/events/messages", bodyParser.json(), (req, res) => {
  const messages = req.body;

  messages.forEach((message) => {
    subscriptions.forEach((subscription) => {
      subscription.write("event: new-message\n");
      subscription.write(`data: ${message}\n\n`);
    });
  });

  res.status(200).send("OK");
});

export default server;
