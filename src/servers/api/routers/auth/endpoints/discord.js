/** @type {APIRouter} */
module.exports = {
    getLogin: function(_, res) {
        res.redirect(this.OAuth2.Discord.redirect);
    },
    postLogin: function(req, res) {
        
    },
    getLogpit: function(req, res) {
        
    },
    postLogout: function(req, res) {

    },
    callback: function(req, res) {
        
    }
}