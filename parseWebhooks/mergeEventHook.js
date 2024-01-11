const {PermissionsBitField } = require("discord.js");
const { OverwriteType, ChannelType } = require('discord-api-types/v10');
const client = require("../index.js");
const connectionPool = require('../dbConnection.js');
let user;
let project;
let objectAttributes;
let newMergeRoom;
let _guild_id;

async function openMergeRequestChat(body){
    try{
        //is channel exsist
        let guild = await client.guilds.fetch(_guild_id);

        let db = await connectionPool.connect();
        let result = (await db.query(`SELECT * FROM merge_requests where gitlab_mr_id = ${body["object_attributes"]["id"]}`)).rows[0];

        if(result != undefined){
            if(body["changes"] != undefined){
                let title = `${body["object_attributes"]["iid"]} ${body["changes"]["title"]["current"]}`;
                guild.channels.cache.get(result.channel_id).setName(title);
            }
        }
        else
        {
            let title = `${body["object_attributes"]["iid"]} ${body["object_attributes"]["title"]}`;
            let mergeCreator = await require('../dataCathers/GetUserById')(body["user"]["id"]);
            let query = `SELECT * FROM projects where gitlab_link = '${body["project"]["web_url"]}'`;
            let proj = (await db.query(query)).rows[0];

            channel = await guild.channels.create({
                name: title,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: mergeCreator["discord"],
                        allow: [PermissionsBitField.Flags.ViewChannel] 
                    },
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                ],
                parent: proj.category_discord_id
            });
            
            let mrTitle = body["object_attributes"]["title"];
            mrTitle.replace("\"", "\\\"");
            mrTitle.replace("\'", "\\\'");
            query = `INSERT INTO merge_requests (name, project_id, channel_id, author_id, gitlab_mr_id) VALUES ('${mrTitle}', ${body["project"]["id"]}, ${channel.id}, ${body["user"]["id"]}, ${body["object_attributes"]["id"]})`;
            await db.query(query);
            db.release();
        }
    }
    catch (err){
        console.log(err);
    }
}

async function closeMergeRequestChat(body){
    try{
    let db = await connectionPool.connect();
    let result = await db.query(`SELECT * from merge_requests where gitlab_mr_id = ${body["object_attributes"]["id"]}`);
    let guild = await client.guilds.fetch(_guild_id);
    guild.channels.delete(result.rows[0].channel_id);
    await db.query(`DELETE from merge_requests where gitlab_mr_id = ${body["object_attributes"]["id"]}`);
    db.release();
    }
    catch (err){
        console.log(err);
    }
}

async function editMergeRequestChat(body){
    try{
    let db = await connectionPool.connect();
    let result = await db.query(`SELECT * from merge_requests where gitlab_mr_id = ${body["object_attributes"]["id"]}`);
    db.release();
    let guild = await client.guilds.fetch(_guild_id);
    guild.channels.delete(result.rows[0].channel_id);
    }
    catch (err){
        console.log(err.message);
    }
}

module.exports = {
    ParseMerge: function (body, guild_id) {
        _guild_id = guild_id;
        user = body["user"];
        project = body["project"];
        objectAttributes = body["object_attributes"];
    
        let state = objectAttributes["state"];
        switch(state){
            case "opened" : openMergeRequestChat(body); break;
            case "opened" : //TODO: edit name break;
            case "merged" : closeMergeRequestChat(body); break;
            case "closed" : closeMergeRequestChat(body); break;
        }
    }
}