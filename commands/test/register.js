const { SlashCommandBuilder, ChannelType, PermissionsBitField} = require('discord.js');
const mongoClient = require('../../dbConnection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register project link to parse webhooks')
		.addStringOption(option =>
			option.setName('link')
				.setDescription('GitLab project link')
				.setRequired(true))
		.addStringOption(option => 
			option.setName("name")
				.setDescription('Name of category')
				.setRequired(true)),
	async execute(interaction) {
		let link = interaction.options.data[0].value;
		let category_name = interaction.options.data[1].value + "_mr";
		if(stringIsAValidUrl(link)){
				
			let category = await interaction.guild.channels.create({
				name: category_name,
				type: ChannelType.GuildCategory,
				permissionOverwrites: [
					{
						id: interaction.guild.roles.everyone,
						deny: [PermissionsBitField.Flags.ViewChannel]
					},
				],
			});
			try{
				await mongoClient.connect();
				await mongoClient.db("mergeRoomBot").collection("projects").insertOne({
				guild_id:interaction.guildId, 
				gitlab_link:link, 
				category_name:category_name, 
				category_discord_id:category.id
			})
			}
			finally{
				mongoClient.close();
			}

			await interaction.reply(`Link: ${link} registered.`);
		}
		else{
			await interaction.reply(`Link: ${link} NOT CORRECT!`);
		}
	},
};

const URL = require("url").URL;
const stringIsAValidUrl = (s) => {
	try {
		new URL(s);
		return true;
	} catch (err) {
		return false;
	}
};