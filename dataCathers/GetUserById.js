const token = require("../LogInToken");

module.exports = async function getUser (id) {
    let beawerToken = await token.getToken();
    const response = await fetch(`https://gitlab.com/api/v4/users/${id}?access_token=${beawerToken}`, {
    method: 'GET',
    });
    let json = await response.json();
    return json;
};