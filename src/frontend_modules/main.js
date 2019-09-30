const API = require("./api");
const HUD = require("./hud");

$(window).on("load", () => {
    HUD.init();
    API.init();
});