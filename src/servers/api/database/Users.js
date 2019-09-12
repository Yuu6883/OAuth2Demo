const mongoose = require("mongoose");

/** @type {mongoose.Schema<UserEntry>} */
const UserSchema = new mongoose.Schema({
    UserID:        { type: String, required: true  },
    OAuth2ID:      { type: String, required: true  },
    OAuth2Type:     { type: String, required: true, enum: [ "discord", "google", "facebook" ] },
    OAuth2Token:   { type: String, required: false },
    OAuth2Refresh: { type: String, required: false },
    CookieToken:   { type: String, required: false },
    bannedUntil:   { type: Date,   required: false },
    permission:    { type: Number, required: false },
});

UserSchema.index({ UserID:      1 }, { unique: true });
UserSchema.index({ OAuth2ID:    1 }, { unique: true });
UserSchema.index({ CookieToken: 1 }, { unique: true, sparse: true });

/** @type {mongoose.Model<UserDocument, {}>} */
const UserModel = mongoose.model("users", UserSchema);

module.exports = class UserCollection {

    /** @param {APIServer} app */
    constructor(app) {
        this.app = app;
    }

    /**
     * @param {string} OAuth2ID
     */
    async findByOAuth2ID(OAuth2ID) {
        return await UserModel.findOne({ OAuth2ID });
    }

    /**
     * @param {string} UserID
     */
    async findByUserID(UserID) {
        return await UserModel.findOne({ UserID });
    }
    
    /**
     * @param {string} CookieToken
     */
    async findByAuthedCookie(CookieToken) {
        return await UserModel.findOne({ CookieToken });
    }

    /**
     * @param {string} UserID
     * @param {string} OAuth2Token
     * @param {string} OAuth2Refresh
     */
    async authorize(UserID, OAuth2Token, OAuth2Refresh) {

        const user = await this.findByOAuth2ID(UserID);
        if (user == null) return null;

        user.OAuth2Token = OAuth2Token;
        user.OAuth2Refresh = OAuth2Refresh;

        // TODO: Generate token
        // user.CookieToken = 
        
        await user.save();

        return token;
    }
}
