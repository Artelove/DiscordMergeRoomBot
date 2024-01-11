const client = require("../index.js");
const connectionPool = require('../dbConnection.js');
const getUser = require('..//dataCathers/GetUserById.js');
const { ChannelType, PermissionsBitField } = require('discord.js');
let user;
let project;
let objectAttributes;
let _guild_id;

const { EmbedBuilder, ColorResolvable  } = require('discord.js');

async function sendNote(body){
    try {
        let guild = await client.guilds.fetch(_guild_id);
        let note = {
            data: body,
            creator:await require('../dataCathers/GetUserById')(body["user"]["id"]),
            description: body["object_attributes"]["note"],
            url:body["object_attributes"]["url"],
            project_name:body["project"]["name"],
            project_url:body["project"]["web_url"],
        }
        let embed = getEmbed(note);

        let db = await connectionPool.connect();
        let merge_request = (await db.query(`SELECT * FROM merge_requests where gitlab_mr_id = ${body["merge_request"]["id"]}`)).rows[0];
        await db.query(`INSERT INTO notes_requests (merge_request_id, channel_id, author_id) VALUES (${merge_request.id}, ${merge_request.channel_id}, ${body["object_attributes"]["author_id"]})`);
        db.release();
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

async function deleteNote(body){
    let db = await connectionPool.connect();
    let result = await db.query(`SELECT * from merge_requests where channel_id = ${body["object_attributes"]["id"]}`);
    db.release();
    let guild = await client.guilds.fetch(_guild_id);
    guild.channels.delete(result.rows[0].channel_id);
}

async function editNote(body){
    let db = await connectionPool.connect();
    let result = await db.query(`SELECT * from merge_requests where channel_id = ${body["object_attributes"]["id"]}`);
    db.release();
    let guild = await client.guilds.fetch(_guild_id);
    guild.channels.delete(result.rows[0].channel_id);
}

function getEmbed(note){
    return new EmbedBuilder()
    .setColor(note.creator["id"]%16777215)
    .setAuthor({ name: note.creator["name"], iconURL:  note.creator["avatar_url"], url: note.creator["web_url"] })
    .setDescription(note.description)
    .addFields(
        { name: 'Links', value: `[${note.project_name}](${note.project_url}) [Note link](${note.url})` , inline: true},
        { name: 'Branch flow', value: `${note.data["merge_request"]["source_branch"]} -> ${note.data["merge_request"]["target_branch"]}`, inline: true },
    )
    .setTimestamp();
}

module.exports = {
    ParseNote: function (body, guild_id) {
        _guild_id = guild_id;
        user = body["user"];
        project = body["project"];
        objectAttributes = body["object_attributes"];
    
        let state = objectAttributes["state"];
        switch(state){
            default:sendNote(body); break;
        }
    }
}