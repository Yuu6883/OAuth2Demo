const API = require("./api");

module.exports = new class HUD {

    constructor() {

    }

    init() {
        API.on("needToLogin",   this.showLoginPanel);
        API.on("loginSuccess",  this.showUserPanel);

        this.isAutoLogin = API.autoLogin;

        $(".facebook-login").click(() => API.redirectLogin("facebook", this.isAutoLogin));
        $(".discord-login" ).click(() => API.redirectLogin("discord",  this.isAutoLogin));
        $(".google-login"  ).click(() => API.redirectLogin("google",   this.isAutoLogin));
        $(".logout-button" ).click(() => API.logout());
    }

    get isAutoLogin() {
        return $("#remember_me").is(":checked");
    }

    set isAutoLogin(value) {
        $("#remember_me").attr("checked", !!value);
    }

    showLoginPanel() {
        $("#login-panel").show();
    }

    showUserPanel() {
        $("#user-panel").show();
        $("#username").text(API.name);
        $("#user-pfp").attr("src", API.avatarURL);
    }
}