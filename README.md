# webgame2

### Setup
```
git clone https://github.com/Yuu6883/webgame2.git
cd webgame2
npm i
```

### Notes
* You need [MongoDB community edition](https://www.mongodb.com/download-center/community) running on your local machine for this application to run. There's no fallback database.
* A simple entry point is at `test/WebServer.js`
* Go to localhost and enter API in console; current available functions are: `API.redirectLogin("discord")` and `API.login("discord")`
* Call `API.redirectLogin("discord")` first then after you login call `API.login("discord")`
* Loggedin userInfo will be available at `API.userInfo`
* Ask me on discord about the credientials for or make your own app `config/auth/auth-config.json`
