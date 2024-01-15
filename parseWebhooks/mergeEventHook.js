const {PermissionsBitField } = require("discord.js");
const { OverwriteType, ChannelType } = require('discord-api-types/v10');
const client = require("../index.js");
const mongoClient = require('../dbConnection.js');
var ObjectId = require('mongodb').ObjectId;

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
            await mongoClient.close();
        }
        let mrTitle = body["object_attributes"]["title"];
        mrTitle.replace("\"", "\\\"");
        mrTitle.replace("\'", "\\\'");

        try{
            await mongoClient.connect();
            let result = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({gitlab_mr_id:body["object_attributes"]["id"]});
            await mongoClient.close();
            await mongoClient.connect();
            if(result == null)
            {
                await mongoClient.db("mergeRoomBot").collection("merge_requests").insertOne({
                    name: mrTitle,
                    project_id : body["project"]["id"],
                    channel_id: channel.id,
                    author_id:body["user"]["id"],
                    gitlab_mr_id:body["object_attributes"]["id"]
                });
            }
            else{
                await mongoClient.db("mergeRoomBot").collection("merge_requests").updateOne(
                    {"_id": new ObjectId(result._id)},
                    {
                        $set: {
                            "channel_id": channel.id,
                            "is_closed": false
                        }
                    }
                );
            }
        }
        finally{
            await mongoClient.close();
        }
}

async function closeMergeRequestChat(body){
    try{
        await mongoClient.connect();
        let result = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({gitlab_mr_id:body["object_attributes"]["id"]});
        await mongoClient.close();
        let guild = await client.guilds.fetch(_guild_id);
        let channel = await guild.channels.cache.get(result.channel_id);
        await channel.delete();
        await mongoClient.connect();
        await mongoClient.db("mergeRoomBot").collection("merge_requests").updateOne(
            {"_id": new ObjectId(result._id)},
            {
                $set: {
                    "is_closed": true
                }
            }
        );
    }
    catch(e){
        console.log(e);
    }
    finally{
        await mongoClient.close();
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
        await mongoClient.close();
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