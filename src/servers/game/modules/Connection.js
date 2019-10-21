const { EventEmitter } = require("events");

class Connection extends EventEmitter {

    /**
     * @param {import("../server")} server
     * @param {ClientUser} user
     * @param {import("@clusterws/cws").WebSocket} socket
     */
    constructor(server, user, socket) {
        super();

        this.server = server;
        this.user = user;
        this.socket = socket;

        this.initSocket();
    }

    get logger() { return this.server.logger }

    initSocket() {
        
        this.socket.on("message", data => {
            let view = new DataView(data);
            let event = view.getUint8(0);

            let index = Connection.EVENT_VALUES.indexOf(event);

            if (index >= 0) {
                this.emit(Connection.EVENTS_KEYS[index]);
            } else {
                this.logger.warn(`Unknown event from client`)
            }
        });
    }

    toString() {
        return `[${this.socket.remoteAddress}]` +
                ;
    }

}

Connection.EVENTS = {
    PING: 0
}

Connection.EVENTS_KEYS  = Object.keys(Connection.EVENTS);
Connection.EVENT_VALUES = Object.values(Connection.EVENTS);

module.exports = Connection;