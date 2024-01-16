const { PermissionsBitField } = require("discord.js");
const { OverwriteType, ChannelType } = require("discord-api-types/v10");
const { EmbedBuilder } = require("discord.js");
const client = require("../index.js");
const mongoClient = require("../dbConnection.js");
var ObjectId = require("mongodb").ObjectId;

let _guild_id;

async function openMergeRequestChat(body) {
	let guild = await client.guilds.fetch(_guild_id);

	let title = `${body["object_attributes"]["title"]}`;
	let mergeCreator = await require("../dataCathers/GetUserById")(body["user"]["id"]);
	try {
		await mongoClient.connect();
		let proj = await mongoClient.db("mergeRoomBot").collection("projects").findOne({ gitlab_link: body["project"]["web_url"] });

		channel = await guild.channels.create({
			name: title,
			type: ChannelType.GuildText,
			permissionOverwrites: [
				{
					id: guild.roles.everyone,
					deny: [PermissionsBitField.Flags.ViewChannel],
				},
			],
			parent: proj.category_discord_id,
		});

		if (mergeCreator["discord"] != "") {
			channel.permissionOverwrites.edit(mergeCreator["discord"], {
				ViewChannel: true,
			});
		}
	} finally {
		await mongoClient.close();
	}
	let mrTitle = body["object_attributes"]["title"];
	mrTitle.replace('"', '\\"');
	mrTitle.replace("'", "\\'");

	try {
		await mongoClient.connect();
		let result = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({ gitlab_mr_id: body["object_attributes"]["id"] });
		await mongoClient.close();
		await mongoClient.connect();
		if (result == null) {
			await mongoClient.db("mergeRoomBot").collection("merge_requests").insertOne({
				name: mrTitle,
				project_id: body["project"]["id"],
				channel_id: channel.id,
				author_id: body["user"]["id"],
				gitlab_mr_id: body["object_attributes"]["id"],
			});
		} else {
			await mongoClient
				.db("mergeRoomBot")
				.collection("merge_requests")
				.updateOne(
					{ _id: new ObjectId(result._id) },
					{
						$set: {
							channel_id: channel.id,
							is_closed: false,
						},
					}
				);
		}
	} finally {
		await mongoClient.close();
	}
}

async function closeMergeRequestChat(body) {
	try {
		await mongoClient.connect();
		let result = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({ gitlab_mr_id: body["object_attributes"]["id"] });
		await mongoClient.close();
		let guild = await client.guilds.fetch(_guild_id);
		let channel = await guild.channels.cache.get(result.channel_id);
		await channel.delete();
		await mongoClient.connect();
		await mongoClient
			.db("mergeRoomBot")
			.collection("merge_requests")
			.updateOne(
				{ _id: new ObjectId(result._id) },
				{
					$set: {
						is_closed: true,
					},
				}
			);
	} catch (e) {
		console.log(e);
	} finally {
		await mongoClient.close();
	}
}

async function editMergeRequestChat(body) {
	//is channel exsist
	let guild = await client.guilds.fetch(_guild_id);

	try {
		await mongoClient.connect();
		let result = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({ gitlab_mr_id: body["object_attributes"]["id"] });

		if (result != null) {
			let title = `${body["changes"]["title"]["current"]}`;
			guild.channels.cache.get(result.channel_id).setName(title);
		}
	} finally {
		await mongoClient.close();
	}
}

async function push_event_blocking_discussions_resolved(body) {
	let note = {
		data: body,
		description: body["object_attributes"]["note"],
		url: body["object_attributes"]["url"],
		project_name: body["project"]["name"],
		project_url: body["project"]["web_url"],
	};
	function getEmbed(note) {
		return new EmbedBuilder()
			.setColor(32768)
			.setDescription(
				`## All blocking discussions resolved
                [Note link](${note.url})`
			)
			.addFields(
				{ name: "Project", value: `[${note.project_name}](${note.project_url})`, inline: true },
				{
					name: "Merge branch flow",
					value: `${note.data["object_attributes"]["source_branch"]} -> ${note.data["object_attributes"]["target_branch"]}`,
					inline: true,
				}
			)

			.setTimestamp();
	}

	let guild = await client.guilds.fetch(_guild_id);

	try {
		await mongoClient.connect();
		let result = await mongoClient.db("mergeRoomBot").collection("merge_requests").findOne({ gitlab_mr_id: body["object_attributes"]["id"] });

		if (result != null) {
			let channel = guild.channels.cache.get(result.channel_id);
			let embed = getEmbed(note);
			channel.send({ embeds: [embed] });
		}
	} finally {
		await mongoClient.close();
	}
}

module.exports = {
	ParseMerge: function (body, guild_id) {
		_guild_id = guild_id;
		switch (body["object_attributes"]["action"]) {
			case "update": {
				if (body["changes"]["title"] != undefined) {
					editMergeRequestChat(body);
				} else {
					push_event_blocking_discussions_resolved(body);
				}
				break;
			}

			case "open":
				openMergeRequestChat(body);
				break;
			case "reopen":
				openMergeRequestChat(body);
				break;
			case "merge":
				closeMergeRequestChat(body);
				break;
			case "close":
				closeMergeRequestChat(body);
				break;
		}
	},
};
