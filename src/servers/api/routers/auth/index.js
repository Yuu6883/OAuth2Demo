const Router = require("express").Router;

/** @param {AuthEntry} entry */
const checkEntries = entry => entry.ID && entry.Secret && entry.Redirect;

/** @type {(app: APIServer, apiRouter: APIRouter) => void} */
const useRouter = (app, apiRouter) => {
    return Router()
        .get("/login",    apiRouter.getLogin.bind(app))
        .get("/logout",   apiRouter.getLogout.bind(app))
        .post("/login",   apiRouter.postLogin.bind(app))
        .post("/logout",  apiRouter.postLogout.bind(app))
        .get("/callback", apiRouter.callback.bind(app));
}

const DiscordRouter = require("./endpoints/discord");
const GoogleRouter = require("./endpoints/google");
const FacebookRouter = require("./endpoints/facebook");
const BadGateway = require("./endpoints/502");

const AuthRouter = Router();

/** @type {(this: APIServer) => import("express").Router} */
module.exports = function() {
    
    // Discord route
    if (checkEntries(this.config.Auth.Discord)) {

        AuthRouter.use("/discord",  useRouter(this, DiscordRouter));
        this.logger.info("Discord  OAuth2 router loaded");
    } else {

        AuthRouter.use("/discord",  useRouter(this, BadGateway));
        this.logger.warn("Discord  OAuth2 is NOT loaded");
    }
        
    // Google route
    if (checkEntries(this.config.Auth.Google)) {

        AuthRouter.use("/google",  useRouter(this, GoogleRouter));
        this.logger.info("Google   OAuth2 router loaded");
    } else {

        AuthRouter.use("/google",  useRouter(this, BadGateway));
        this.logger.warn("Google   OAuth2 is NOT loaded");
    }

    // Facebook route
    if (checkEntries(this.config.Auth.Facebook)) {

        AuthRouter.use("/facebook",  useRouter(this, FacebookRouter));
        this.logger.info("Facebook OAuth2 router loaded");
    } else {

        AuthRouter.use("/facebook",  useRouter(this, BadGateway));
        this.logger.warn("Facebook OAuth2 is NOT loaded");
    }
    
    return AuthRouter;
};