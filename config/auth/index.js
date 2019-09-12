const fs = require("fs");
const configPath = __dirname + "/auth-config.json";

let DefaultAuthConfig = {
    Discord: {
        ID: "",
        Secret: "",
        Redirect: ""
    },
    Google: {
        ID: "",
        Secret: "",
        Redirect: ""
    },
    Facebook: {
        ID: "",
        Secret: "",
        Redirect: ""
    },
}

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(DefaultAuthConfig, null, 4));
} else {
    let existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    DefaultAuthConfig = Object.assign(DefaultAuthConfig, existingConfig);
}

module.exports = DefaultAuthConfig;