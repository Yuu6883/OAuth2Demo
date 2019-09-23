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

        this.on("loginSuccess" , () => localStorage.autoLogin = "ha")
            .on("loginFail"    , () => delete localStorage.autoLogin)
            .on("logoutSuccess", () => delete localStorage.autoLogin)
            .on("logoutFail"   , () => delete localStorage.autoLogin);

        if (localStorage.autoLogin) this.login();
        else this.emit("needToLogin");
    }

    redirectLogin(platform) {
        if (!this.supportedPlatform.includes(platform)) 
            throw Error(`${platform} login is not supported yet`);

        localStorage.autoLogin = "ha";
        window.location.replace(`${window.location.href.match(/^https?:\/\/.+\//)[0]}api/${platform}/login`);
    }

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
                return "";
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
