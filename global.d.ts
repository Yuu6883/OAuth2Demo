interface Config {
    API:  APIConfig;
    Auth: AuthConfig;
}

interface APIConfig {
    DBPath:        string;
    DBName:        string;
    AllowedOrigin: string;
    InfoCache:     number;
    UserIDLength:  number;
    CookieName:    string;
    CookieLength:  number;
    CookieAge:     number;
    Port:          number;
    CheckIP:       boolean;
}

interface AuthConfig {
    StateLength: number;
    StateExpire: number;
    Discord:     AuthEntry;
    Facebook:    AuthEntry;
    Google:      AuthEntry;
}

interface AuthEntry {
    ID:       string;
    Secret:   string;
    Redirect: string;
}

declare type OAuth2Type = "discord" | "google" | "facebook";

interface UserEntry {
    UserID:        string,
    UserInfo:      Map<string, string>,
    UserInfoCache: Date,
    OAuth2ID:      string,
    OAuth2Type:    OAuth2Type,
    OAuth2Token:   string,
    OAuth2Refresh: string,
    CookieToken:   string,
    bannedUntil:   Date,
    permission:    number;
}
declare type UserDocument = import("mongoose").Document & UserEntry;

interface StateEntry {
    id:        string;
    ip:        string;
    redirect:  string;
    validTill: Date;
}
declare type StateDocument = import("mongoose").Document & StateEntry;

declare type LogEventLevel = "DEBUG" | "ACCESS" | "INFO" | "WARN" | "ERROR" | "FATAL" | "TEST";
declare type LogEvent = (date: Date, level: LogEventLevel, message: string) => void;
declare type LogMessageData = any[];

declare type APIRequest = import("express").Request & { origin: string };
declare type APIResponse = import("express").Response;

declare type APIServer = import("./src/servers/api/modules/APIServer");

declare type APIEndpoint = (this: APIServer, req: APIRequest, res: APIResponse, 
                            next: import("express").NextFunction) => void;

interface APIRouter {
    getLogin:   APIEndpoint;
    postLogin:  APIEndpoint;
    getLogout:  APIEndpoint;
    postLogout: APIEndpoint;
    callback:   APIEndpoint;
}

interface DiscordResponse {
    error?:             string;
    error_description?: string;
}

interface DiscordAuthorization {
    access_token:  string;
    refresh_token: string;
}

interface DiscordUser {
    id:            string;
    username:      string;
    discriminator: string;
    avatar:        string;
    locale:        string;
}

declare type $ = import("jquery");