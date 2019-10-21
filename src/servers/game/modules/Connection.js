class Connection {

    /**
     * @param {import("../server")} server
     * @param {ClientUser} user
     * @param {import("@clusterws/cws").WebSocket} socket
     */
    constructor(server, user, socket) {
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

                let method = `on${Connection.EVENTS_KEYS[index].toLowerCase()}`; 
                
                if (this[method]) {
                    
                    try {
                        this[method](view);
                    } catch (e) {
                        this.logger.onError(`Error while running ${method} ` +
                                             this.toString(), e);
                    }

                } else {
                    this.logger.warn(`Handler function ${method} not found`);
                }

            } else {
                this.logger.warn(`Unknown event from client`);
            }
        });
    }

    onping() {
        let view = new DataView(new ArrayBuffer(1));
        view.setUint8(0, Connection.EVENTS.PONG);
        this.socket.send(view);
    }

    onpong() {
        this.logger.warn("Server shouldn't receive pong packet");
        this.disconnect();
    }

    /** @param {DataView} view */
    onchat(view) {
        let message = this.readUTF8(view, 1);
    }

    disconnect() {
        this.connected && this.socket.close();
    }

    send(data) {
        this.connected && this.socket.send(data);
    }

    get connected() {
        return this.socket.readyState == this.socket.OPEN;
    }

    get username() {
        if (!this.user || !this.user.type) return;

        switch (this.user.type) {

            case "discord":
                return `Discord: ${this.user.username}#${this.user.discriminator}`;
            
            case "facebook":
                return "Facebook: " + this.user.name;

            case "google":
                return "Google: " + this.user.given_name;

            default:
                return "Unknown"
        }
    }

    toString() {
        return `[${this.socket.remoteAddress}] ` +
                `${this.username}(${this.user.uid})`;
    }
    
    /**
     * @param {DataView} view 
     * @param {string} string
     * @param {number} startOffset 
     */
    writeUTF8(view, string, startOffset) {
        startOffset = startOffset || 0;

        for (let i = 0; i < string.length; i++)
            view.setUint8(i + startOffset, string.charCodeAt(i));
        return view;
    }

    /**
     * @param {DataView} view 
     * @param {string} string
     * @param {number} startOffset 
     */
    writeUTF16(view, string, startOffset) {
        startOffset = startOffset || 0;

        for (let i = 0; i < string.length; i += 2)
            view.setUint16(i + startOffset, string.charCodeAt(i));
        return view;
    }

    /**
     * @param {DataView} view 
     * @param {number} offset 
     */
    readUTF8(view, offset) {
        let str = "";
        for (let i = offset; i < view.byteLength; i++) {
            str += String.fromCharCode(view.getUint8(offset));
        }
        return str;
    }

    /**
     * @param {DataView} view 
     * @param {number} offset
     */
    readUTF16(view, offset) {
        let str = "";
        for (let i = offset; i < view.byteLength; i += 2) {
            str += String.fromCharCode(view.getUint16(offset));
        }
        return str;
    }

    
}

Connection.id = 0;
Connection.EVENTS = {
    PING: 0,
    PONG: 1,
    CHAT: 2,
}

Connection.EVENTS_KEYS  = Object.keys(Connection.EVENTS);
Connection.EVENT_VALUES = Object.values(Connection.EVENTS);

module.exports = Connection;