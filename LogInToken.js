const { AUTO_PARAMETERS } = require('./config.json');
let authToken = "";

module.exports = {
    async getToken (){
    if(authToken == ""){
      authToken = await updateToken();
    }

    return authToken;
    }
}

async function updateToken () {
  const response = await fetch(`https://gitlab.com/oauth/token?grant_type=password&username=arteevil.off@gmail.com&password=Ontime_007008`, {
    method: 'POST',
  });
  const myJson = await response.json(); //extract JSON from the http response
  setTimeout(async ()=> {
    authToken = "";
  }, Number(myJson["expires_in"]));

  return myJson["access_token"];
}