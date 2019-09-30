const { EventEmitter } = require("events");

module.exports = new class API extends EventEmitter {

    constructor() {
        super();
        /** @type {ClientUser} */
        this.userInfo = null;
        /** @type {OAuth2Type[]} */
        this.supportedPlatform = ["discord", "facebook", "google"];
    }

    init() {

        this.on("logoutSuccess", this.clearLogin)
            .on("loginFail"    , this.clearLogin)
            .on("logoutFail"   , this.clearLogin);

        if (localStorage.platform) 
            this.login(localStorage.platform);
        else
            this.emit("needToLogin");
    }

    clearLogin() {
        delete localStorage.platform;
        window.location.reload();
    }

    /** @param {OAuth2Type} platform */
    redirectLogin(platform) {
        if (!this.supportedPlatform.includes(platform)) 
            throw Error(`${platform} login is not supported yet`);

        localStorage.platform = platform;
        window.location.replace(`${window.location.href.match(/^https?:\/\/.+\//)[0]}api/${platform}/login`);
    }

    /** @param {OAuth2Type} platform */
    login(platform) {
        if (!this.supportedPlatform.includes(platform)) 
            throw Error(`${platform} login is not supported yet`);

        $.post({
            url: `/api/${platform}/login`,
            dataType: "json",
            success: res => {
                this.userInfo = res;
                this.emit("loginSuccess");
            },
            error: () => {
                this.emit("loginFail");
            }
        });
    }

    get avatarURL() {
        if (!this.userInfo || !this.userInfo.type) return;

        switch (this.userInfo.type) {

            case "discord":
                return `https://cdn.discordapp.com/avatars/` + 
                       `${this.userInfo.id}/${this.userInfo.avatar}`;

            case "facebook":
                return `http://graph.facebook.com/${this.userInfo.id}/picture?type=large`;

            case "google":
                return this.userInfo.picture;

            default:
                throw new Error("Invalid User Type");
        }
    }

    get name() {
        if (!this.userInfo || !this.userInfo.type) return;

        switch (this.userInfo.type) {

            case "discord":
                return `${this.userInfo.username}#${this.userInfo.discriminator}`;
            
            case "facebook":
                return this.userInfo.name;

            case "google":
                return this.userInfo.given_name;

            default:
                throw new Error("Invalid User Type");
        }
    }

    logout() {
        if (!this.userInfo) return;
        $.post({
            url: `/api/${this.userInfo.type}/logout`,
            dataType: "json",
            success: res => {
                if (res.success)
                    this.emit("logoutSuccess");
            },
            error: () => {
                this.emit("logoutFail");
            }
        });
    }
}
