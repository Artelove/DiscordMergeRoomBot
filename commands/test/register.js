const { SlashCommandBuilder, ChannelType, PermissionsBitField} = require('discord.js');
const connectionPool = require('../../dbConnection');

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
			let db = await connectionPool.connect();
				
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

			let query = `INSERT INTO projects (guild_id, gitlab_link, category_name, category_discord_id) VALUES (${interaction.guildId}, '${link}', '${category_name}', ${category.id});`; // get inputs from req
			await db.query(query);
			db.release();
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