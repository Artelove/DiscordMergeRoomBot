const {PermissionsBitField } = require("discord.js");
const { OverwriteType, ChannelType } = require('discord-api-types/v10');
const client = require("../index.js");
const mongoClient = require('../dbConnection.js');

let _guild_id;

async function openMergeRequestChat(body){
        let guild = await client.guilds.fetch(_guild_id);

        let title = `${body["object_attributes"]["iid"]} ${body["object_attributes"]["title"]}`;
        let mergeCreator = await require('../dataCathers/GetUserById')(body["user"]["id"]);
        try{
            await mongoClient.connect();
            let proj = await mongoClient.db("mergeRoomBot").collection("projects").findOne({gitlab_link:body["project"]["web_url"]});
            
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
        }
        finally{
            mongoClient.close();
        }
        let mrTitle = body["object_attributes"]["title"];
        mrTitle.replace("\"", "\\\"");
        mrTitle.replace("\'", "\\\'");

        try{
            await mongoClient.connect();
            let result = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({gitlab_mr_id:`${body["object_attributes"]["id"]}`});
            await mongoClient.connect();
            if(result == null)
            {
                await mongoClient.db("mergeRoomBot").collection("merge_requests").insertOne({
                    name: mrTitle,
                    project_id : body["project"]["id"],
                    channel_id: Number(channel.id),
                    author_id:body["user"]["id"],
                    gitlab_mr_id:body["object_attributes"]["id"]
                });
            }
            else{
                await mongoClient.db("mergeRoomBot").collection("merge_requests").updateOne({
                    channel_id: Number(channel.id),
                    is_closed:false
                }, result._id);
            }
        }
        finally{
            mongoClient.close();
        }
}

async function closeMergeRequestChat(body){
    try{
        await mongoClient.connect();
        let result = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({gitlab_mr_id:body["object_attributes"]["id"]});
        let guild = await client.guilds.fetch(_guild_id);
        await guild.channels.delete(result.channel_id);
        await mongoClient.connect();
        await mongoClient.db("mergeRoomBot").collection("merge_requests").updateOne({is_closed:true}, result);
    }
    catch(e){
        console.log(e);
    }
    finally{
        mongoClient.close();
    }
}

async function editMergeRequestChat(body){
     //is channel exsist
     let guild = await client.guilds.fetch(_guild_id);

    try{
        await mongoClient.connect();
        let result = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({gitlab_mr_id:`${body["object_attributes"]["id"]}`});

        if(result != undefined){
                 let title = `${body["changes"]["title"]["current"]}`;
                 guild.channels.cache.get(result.channel_id).setName(title);
        }
    }
    finally{
        mongoClient.close();
    }
}

module.exports = {
    ParseMerge: function (body, guild_id) {
        _guild_id = guild_id;

        switch(body["object_attributes"]["state"]){
            case "opened" : {
                if(body["changes"]["title"]!=undefined)
                {
                    editMergeRequestChat(body);
                }
                else{
                    openMergeRequestChat(body); 
                }
                break;
            }
            case "merged" : closeMergeRequestChat(body); break;
            case "closed" : closeMergeRequestChat(body); break;
        }
    }
}