const fs = require("fs");
const configPath = __dirname + "/ws-config.json";

let DefaultSettings = {
    port:       4001,
    timeout:    20000,
};

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(DefaultSettings, null, 4));
} else {
    let existingConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    DefaultSettings = Object.assign(DefaultSettings, existingConfig);
}

module.exports = DefaultSettings;
