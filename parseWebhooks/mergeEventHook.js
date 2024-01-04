const {Permissions } = require("discord.js");
const { OverwriteType, ChannelType } = require('discord-api-types/v10');
const client = require("../index");
let user;
let project;
let objectAttributes;
let newMergeRoom;

async function openMergeRequestChat(body, guild_id){
    let guild = await client.guilds.fetch(guild_id);
    let title = body["object_attributes"]["title"];
    channel = await guild.channels.create(title,{
        permissionOverwrites: [
            {
                id:  "264400114141888512",
                type: "member",
                allow: [Permissions.FLAGS.VIEW_CHANNEL] 
            },
            {
                id:  guild.roles.everyone,
                deny: [Permissions.FLAGS.VIEW_CHANNEL]
            },
        ],
        type: ChannelType.GuildText
    });
    channel1 = client.channels.cache.get(channel.id)
    console.log(channel.id);
    newMergeRoom = channel.id;
    await channel1.send('message')
}

async function closeMergeRequestChat(){
    let guild = await client.guilds.fetch(guild_id);
    client.channels.cache.get();
    guild.channels.delete(newMergeRoom);
}

module.exports = {
    ParseMerge: function (body, guild_id) {
        user = body["user"];
        project = body["project"];
        objectAttributes = body["object_attributes"];
    
        let state = objectAttributes["state"];
        switch(state){
            case "opened" : openMergeRequestChat(body); break;
            case "merged" : closeMergeRequestChat(body); break;
            case "closed" : closeMergeRequestChat(body); break;
        }
    },
    ParseNote: function (body, guild_id) {
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