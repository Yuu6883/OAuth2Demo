const { WebSocketServer } = require("@clusterws/cws");
const Cookie = require("cookie");
const JWT = require("jsonwebtoken");

const Logger = require("../api/modules/Logger");
const Connection = require("./modules/Connection");

module.exports = class GameServer {
    /**
     * @param {Config} config
     */
    constructor(config) {
        this.config = config;
        this.logger = new Logger();

        /** @type {Connection[]} */
        this.connections = [];

        this.startServer(config.WS.port);
    }

    /** @param {number} port */
    startServer(port) {
        this.server = new WebSocketServer({
            port,
            verifyClient: this.verifyClient.bind(this)
        });
        this.initEvents();
    }

    /**
     * @param {import("@clusterws/cws").ConnectionInfo} info 
     * @param {import("@clusterws/cws").Listener} next 
     */
    verifyClient(info, next) {
        this.logger.debug(`Incoming connection from ` +
                          info.req.socket.remoteAddress);

        let cookie = Cookie.parse(info.req.headers.cookie);
        let jwtCookie = cookie[this.config.API.JWTCookieName];

        try {
            info.req.user = JWT.verify(jwtCookie, this.config.API.JWTSecret);
            next(true);
        } catch (_) {
            next(false);
        }
    }

    initEvents() {
        this.server.on("connection", 
        /** @param {import("@clusterws/cws").WebSocket} socket */
        (socket, req) => {

            /** @type {ClientUser} */
            let user = req.user;
            let conn = new Connection(this, user, socket);
            this.connections.push(conn);

            this.logger.info(`Connected${conn.toString()}(${this.connections.length})`);

            socket.on("error", err => {
                this.logger.warn(`${conn.toString()} Error`);
                this.logger.onError(err);
                
                conn.disconnect();
            });

            socket.on("close", (code, reason) => {

                this.connections.splice(this.connections.indexOf(conn), 1);

                this.logger.info(`${conn.toString()} disconnected(${this.connections.length})`);
                this.logger.debug(`Close code: ${code}, reason: ${reason}`);
            });
        });

        this.server.on("error", (err, socket) => {
            this.logger.onError(`Socket error from ${socket.remoteAddress}`);
            this.logger.onError(err);
        });
    }
}
