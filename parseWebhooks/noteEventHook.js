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
    let guild = await client.guilds.fetch(_guild_id);
    let title = body["object_attributes"]["title"];
    let mergeCreator = await require('../dataCathers/GetUserById')(body["user"]["id"]);
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
    });
    let db = await connectionPool.connect();
    await db.query(`INSERT INTO merge_requests VALUES 
        ${body["object_attributes"]["title"]},
        ${body["project"]["id"]},
        ${channel.id},
        ${body["user"]["id"]},
        ${body["object_attributes"]["id"]}`);
    channel1 = client.channels.cache.get(channel.id)
    console.log(channel.id);
    newMergeRoom = channel.id;
}

async function closeMergeRequestChat(body){
    let db = await connectionPool.connect();
    let result = await db.query(`SELECT * from merge_requests where channel_id = ${body["object_attributes"]["id"]}`);
    let guild = await client.guilds.fetch(_guild_id);
    guild.channels.delete(result.rows[0].channel_id);
}

module.exports = {
    ParseNote: function (body, guild_id) {
        _guild_id = guild_id;
        user = body["user"];
        project = body["project"];
        objectAttributes = body["object_attributes"];
    
        let state = objectAttributes["state"];
        switch(state){
            case "opened" : openMergeRequestChat(body); break;
            case "merged" : closeMergeRequestChat(body); break;
            case "closed" : closeMergeRequestChat(body); break;
        }
    }
}