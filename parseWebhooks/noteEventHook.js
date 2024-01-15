const client = require("../index.js");
const mongoClient = require("../dbConnection.js");
let _guild_id;

const { EmbedBuilder} = require('discord.js');

async function sendNote(body){
    try {
        let guild = await client.guilds.fetch(_guild_id);
        let note = {
            data: body,
            creator: await require('../dataCathers/GetUserById')(body["user"]["id"]),
            additiondalDescription : "",
            description: body["object_attributes"]["note"],
            url:body["object_attributes"]["url"],
            project_name:body["project"]["name"],
            project_url:body["project"]["web_url"],
        }

        if(body["object_attributes"]["original_position"]!=null){
            note.codeArea = await require('../dataCathers/GetRawFileFromBranchByName.js')(
                body["project_id"], 
                body["object_attributes"]["original_position"]["new_path"], 
                body["merge_request"]["source_branch"])
            note.codeArea = getLinesSecrionFromCode(note.codeArea, body["object_attributes"]["original_position"]["line_range"]["start"]["new_line"], body["object_attributes"]["original_position"]["line_range"]["end"]["new_line"]);
            note.additiondalDescription = `\`\`\`fix\n${note.codeArea}\`\`\`\n`;
        }
        let embed = getEmbed(note);
        await mongoClient.connect();
        let merge_request = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({gitlab_mr_id:body["merge_request"]["id"]});
        let channel = guild.channels.cache.get(merge_request.channel_id);
        channel.permissionOverwrites.edit(note.creator["discord"], {
            ViewChannel: true
        });
        channel.send({ embeds: [embed] })
    }
    catch (err){
        console.log(err);
    }
}

function getEmbed(note){
    return new EmbedBuilder()
    .setColor(note.creator["id"]%16777215)
    .setAuthor({ name: note.creator["name"], iconURL:  note.creator["avatar_url"], url: note.creator["web_url"] })
    .setDescription(`${note.additiondalDescription}${note.description} 
        [Note link](${note.url})`)
    .addFields(
        { name: 'Project', value: `[${note.project_name}](${note.project_url})`, inline: true},
        { name: 'Merge branch flow', value: `${note.data["merge_request"]["source_branch"]} -> ${note.data["merge_request"]["target_branch"]}`, inline: true },
    )
    .setTimestamp();
}

module.exports = {
    ParseNote: function (body, guild_id) {
        _guild_id = guild_id;
    
        sendNote(body);
    }
}

function getLinesSecrionFromCode(code, from, to){
    let countLines = 1;
    let lineSection = "";
    let stringRows = [];
    let stringNumbers = [];
    if(from === 1){
        stringNumbers.push(1);
    }
    for(let i = 0; i < code.length; i++){
       
        if(countLines === to+1){
            lineSection[i-1]='';
            stringNumbers.push(countLines);
            stringRows.push(lineSection);
            //return lineSection;
            break;
        }

        if(countLines >= from){
            lineSection+=code[i];
        }

        if(code[i] === '\n'){
            countLines++;
            if(countLines === to+1){
                lineSection[i-1]='';
                stringRows.push(lineSection);
                break;
                //return lineSection;
            }
            if(countLines >= from){
                stringRows.push(lineSection);
                stringNumbers.push(countLines);
                lineSection='';
            }
        }
    }
    stringRows.splice(0,1);
    let isNeedClearTabulation = true;
    
    stringRows.forEach((str)=>{
        if(str[0] !== ' ')
            isNeedClearTabulation = false;   
    });
    let newStringRows = [];
    while(isNeedClearTabulation){
        newStringRows = [];
        stringRows.forEach((str)=>{
            str = str.substring(1);
            newStringRows.push(str);
        });
        stringRows = newStringRows;
        stringRows.forEach((str)=>{
            if(str[0] !== ' ')
                isNeedClearTabulation = false;   
        });
    }
    lineSection = "";
    newStringRows.forEach((str)=>{
        lineSection+=str;
    });
    return lineSection;
}