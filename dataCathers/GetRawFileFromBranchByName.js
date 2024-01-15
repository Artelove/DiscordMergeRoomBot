//https://gitlab.com/api/v4/projects/53358223/repository/files/README.md/raw?ref=qwuhehqwehqwehkqwheklqwkheqhwjkekjhqwehjkqwejkhqwekj&access_token=dfec6ebbabc6e228ec736906ce193b17d2da6058a86f2ba3b3b2d88098613f7e

const token = require("../LogInToken");

module.exports = async function getRawFile (project_id, file_name, branch_name, start_line = 0, end_line = 0) {
    let beawerToken = await token.getToken();
    const response = await fetch(`https://gitlab.com/api/v4/projects/${project_id}/repository/files/${encodeURI(file_name)}/raw/?ref=${encodeURI(branch_name)}&access_token=${beawerToken}`, {
    method: 'GET',
    });
    return await response.text();
};