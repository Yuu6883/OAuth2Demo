const JWT = require("jsonwebtoken");

/** @type {APIRouter} */
module.exports = {
    getLogin: async function(req, res) {

        let state = await this.state.create(req.ip, req.origin || "/");
        let redirect = `${this.OAuth2.Facebook.redirect}&state=${state.id}`;

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

        let user = await this.users.findByAuthedToken(cookieToken, "facebook");

        if (!user)
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .status(404)
                           .send("User not found");

        /** @type {} */
        let userInfo;
        /** @type {string} */
        let token;

        if (user.UserInfoCache >= new Date()) {
            this.logger.debug(`Loading user info from cache`);

            userInfo = user.UserInfo;
            token = await this.users.renewToken(user);
        }

        if (!userInfo || !userInfo.id) {
            let result = await this.OAuth2.Facebook.fetchUserInfo(user.OAuth2Token);

            token = await this.users.authorize(user, user.OAuth2Token, "", result);
            
            userInfo = result;
        }

        // Definitely something wrong
        if (!userInfo || !userInfo.id) {
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .sendStatus(500);
        }

        userInfo.type = "facebook";
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
            return res.clearCookie(this.config.API.JWTCookieName)
                      .clearCookie(cookieName)
                      .redirect("/");

        let user = await this.users.findByAuthedToken(cookieToken, "facebook");

        if (!user)
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .redirect("/");

        let result = await this.OAuth2.Facebook.revoke(user.OAuth2ID, user.OAuth2Token);

        if (result.error)
            this.logger.warn(`Facebook logout error`, result.error);

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
                           .status(400)
                           .send("Bad Cookie");

        let user = await this.users.findByAuthedToken(cookieToken, "facebook");

        if (!user)
            return void res.clearCookie(this.config.API.JWTCookieName)
                           .clearCookie(cookieName)
                           .status(404)
                           .send("User not found");

        let { success, error } = await this.OAuth2.Facebook.revoke(user.OAuth2ID, user.OAuth2Token);

        if (error)
            this.logger.warn(`Facebook logout error`, error);

        await this.users.deauthorize(user);

        res.clearCookie(this.config.API.JWTCookieName)
           .clearCookie(cookieName)
           .send({ success: !!success });
            
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
            let result = await this.OAuth2.Facebook.exchange(req.query.code);

            if (result.error) {
                this.logger.onError(`Facebook refused callback code: ${req.query.code}`);
                return void res.redirect("/500");
            }

            let userInfo = await this.OAuth2.Facebook.fetchUserInfo(result.access_token);

            if (userInfo.error) {
                this.logger.onError(`Facebook refused access code at callback ${req.query.code}`, userInfo);
                return void res.redirect("/500");
            }

            let user = await this.users.findByOAuth2ID(userInfo.id);

            if (!user)
                user = await this.users.create(userInfo.id, "facebook");

            let token = await this.users.authorize(user, result.access_token, "", userInfo);

            res.cookie(this.config.API.CookieName, token, { maxAge: this.config.API.CookieAge });
        }

        res.redirect(state.redirect);
    }
}