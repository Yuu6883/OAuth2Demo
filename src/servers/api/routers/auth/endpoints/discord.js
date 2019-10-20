const JWT = require("jsonwebtoken");

/** @type {APIRouter} */
module.exports = {
    getLogin: async function(req, res) {

        let state = await this.state.create(req.ip, req.origin || "/");
        let redirect = `${this.OAuth2.Discord.redirect}&state=${state.id}`;

        // this.logger.info(`Redirecting user to ${redirect}`);
        res.redirect(redirect);
    },
    postLogin: async function(req, res) {
        
        let cookieName = this.config.API.CookieName;
        let cookieToken = req.cookies[cookieName];

        if (!this.users.confirmToken(cookieToken))
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .status(400)
                           .send("Bad Cookie");

        let user = await this.users.findByAuthedToken(cookieToken, "discord");

        if (!user)
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .status(404)
                           .send("User not found");

        /** @type {DiscordUser} */
        let userInfo;
        /** @type {string} */
        let token;

        if (user.UserInfoCache >= new Date()) {
            this.logger.debug(`Loading user info from cache`);

            userInfo = user.UserInfo;
            token = await this.users.renewToken(user);
        }

        if (!userInfo || !userInfo.id) {
            let result = await this.OAuth2.Discord.fetchUserInfo(user.OAuth2Token);

            if (result.error) {
                let refresh = await this.OAuth2.Discord.exchange(user.OAuth2Refresh, true);

                if (refresh.error) {
                    this.logger.onError(`Discord refused to exchange refresh token, description: ${refresh.error_description}`);
                    return void res.clearCookie(cookieName).status(500).send("Discord Error (1)");
                }

                result = await this.OAuth2.Discord.fetchUserInfo(refresh.access_token);

                if (result.error) {
                    this.logger.onError(`Discord refused to exchange access token,` + 
                                        ` description: ${refresh.error_description}`);
                    return void res.clearCookie(cookieName).status(500).send("Discord Error (2)");
                }

                token = await this.users.authorize(user, refresh.access_token, refresh.refresh_token, result);
            } else {
                token = await this.users.authorize(user, user.OAuth2Token, user.OAuth2Refresh, result);
            }
            
            userInfo = result;
        }

        // Definitely something wrong
        if (!userInfo || !userInfo.id) {
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .sendStatus(500);
        }

        userInfo.type = "discord";
        userInfo.uid  = user.UserID;

        let jwt = JWT.sign(userInfo, this.config.API.JWTSecret, {
            expiresIn: this.config.API.JWTExpire
        });

        res.cookie(this.config.API.JWTCookieName, jwt, { maxAge: this.config.API.JWTExpire });
        res.cookie(cookieName, token, { maxAge: this.config.API.CookieAge });
        res.json(userInfo);

    },
    getLogout: async function(req, res) {
        let cookieName = this.config.API.CookieName;
        let cookieToken = req.cookies[cookieName];

        if (!this.users.confirmToken(cookieToken))
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .redirect("/");

        let user = await this.users.findByAuthedToken(cookieToken, "discord");

        if (!user)
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .redirect("/");

        await this.OAuth2.Discord.revoke(user.OAuth2Token);
        await this.users.deauthorize(user);

        res.clearCookie(this.config.API.JWTCookieName)
           .clearCookie(cookieName)
           .redirect("/");
    },
    postLogout: async function(req, res) {

        let cookieName = this.config.API.CookieName;
        let cookieToken = req.cookies[cookieName];

        if (!this.users.confirmToken(cookieToken))
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .status(400).send("Bad Cookie");

        let user = await this.users.findByAuthedToken(cookieToken, "discord");

        if (!user)
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .status(404).send("User not found");

        let success = await this.OAuth2.Discord.revoke(user.OAuth2Token);

        await this.users.deauthorize(user);

        res.clearCookie(this.config.API.JWTCookieName)
           .clearCookie(cookieName)
           .send({ success });
            
    },
    callback: async function(req, res) {

        if (!this.state.confirmID(req.query.state)) {
            this.logger.warn("Invalid State", req.query.state);
            return void res.redirect("/400");
        }

        let state = await this.state.retrieve(req.query.state);

        if (!state) {
            this.logger.warn("Can't find state");
            return void res.redirect("/400");
        }

        if (this.config.API.CheckIP && req.ip !== state.ip) {
            this.logger.warn("Invalid Ip", req.ip, state.ip);
            return void res.redirect("/400");
        }

        if (Date.now() > state.validTill) 
            return void res.redirect("/400");

        if (req.query.code) {
            let result = await this.OAuth2.Discord.exchange(req.query.code, false);

            if (result.error) {
                this.logger.onError(`Discord refused callback code: ${req.query.code}`);
                return void res.redirect("/502");
            }

            let userInfo = await this.OAuth2.Discord.fetchUserInfo(result.access_token);

            if (userInfo.error) {
                this.logger.onError(`Discord refused access code at callback ${req.query.code} ${result.error_description}`);
                return void res.redirect("/502");
            }

            let user = await this.users.findByOAuth2ID(userInfo.id);

            if (!user)
                user = await this.users.create(userInfo.id, "discord");

            let token = await this.users.authorize(user, result.access_token, result.refresh_token, userInfo);

            res.cookie(this.config.API.CookieName, token, { maxAge: this.config.API.CookieAge });
        }

        res.redirect(state.redirect);
    }
}