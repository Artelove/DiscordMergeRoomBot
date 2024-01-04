const { SlashCommandBuilder } = require('discord.js');
const connectionPool = require('../../dbConnection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register project link to parse webhooks')
		.addStringOption(option =>
			option.setName('link')
				.setDescription('GitLab project link')
				.setRequired(true)),
	async execute(interaction) {
		let link = interaction.options.data[0].value;
		if(stringIsAValidUrl(link)){
			connectionPool.connect((err, db) => {
                if (err){
					console.log(err.message);
					throw err;
				}
                let query = `INSERT INTO projects (guild_id, gitlab_link) VALUES (${interaction.guildId}, '${link}');`; // get inputs from req
                db.query(query, (err, result) => {
					if (err){
						console.log(err.message);
						throw err;
					}
                    console.log(result.rowCount);
                })
            });
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