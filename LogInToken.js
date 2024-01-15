const { gitlab_access_token } = require('./config.json');

module.exports = {
    async getToken (){
      return gitlab_access_token;
    }
}