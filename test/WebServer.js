const express = require("express");
let APIServer = require("../src/servers/api");

APIServer.init().then(() => {
    express()
    .use("/", express.static(__dirname + "/../web"))
    .use("/api", APIServer.router)
    .listen(80, () => {
        APIServer.logger.info(`Server open`)
    });
});