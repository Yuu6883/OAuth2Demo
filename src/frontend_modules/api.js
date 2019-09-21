const { EventEmitter } = require("events");

module.exports = new class API extends EventEmitter {

    constructor() {
        super();
        /** @type {DiscordUser} */
        this.userInfo = null;
        this.supportedPlatform = ["discord"];
    }

    init() {

        this.on("loginSuccess", () => localStorage.autoLogin = "ha")
            .on("loginFail", () => delete localStorage.autoLogin)
            .on("logoutSuccess", () => delete localStorage.autoLogin)
            .on("logoutFail", () => delete localStorage.autoLogin);

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
        if (!this.userInfo) return;
        if (this.userInfo.type === "discord")
            return `https://cdn.discordapp.com/avatars/` + 
                   `${this.userInfo.id}/${this.userInfo.avatar}`;
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
