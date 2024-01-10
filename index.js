const { Client, GatewayIntentBits, Collection, Events, ChatInputCommandInteraction } = require("discord.js");
const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const connectionPool = require('./dbConnection.js')
const path = require('node:path');
const fs = require("fs");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // for guild related things
    GatewayIntentBits.GuildMembers, // for guild members related things
    GatewayIntentBits.GuildEmojisAndStickers, // for manage emojis and stickers
    GatewayIntentBits.GuildIntegrations, // for discord Integrations
    GatewayIntentBits.GuildWebhooks, // for discord webhooks
    GatewayIntentBits.GuildInvites, // for guild invite managing
    GatewayIntentBits.GuildVoiceStates, // for voice related things
    GatewayIntentBits.GuildPresences, // for user presence things
    GatewayIntentBits.MessageContent, // for guild messages things
    GatewayIntentBits.GuildMessageReactions, // for message reactions things
    GatewayIntentBits.GuildMessageTyping, // for message typing things
    GatewayIntentBits.DirectMessages, // for dm messages
    GatewayIntentBits.DirectMessageReactions, // for dm message reaction
    GatewayIntentBits.DirectMessageTyping, // for dm message typinh
    GatewayIntentBits.MessageContent, // enable if you need message content things
  ],
});
module.exports = client;
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.type == ChatInputCommandInteraction) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

var express = require('express');
var bodyParser = require('body-parser');
const { request } = require("node:http");
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

var mergeEventHook = require("./parseWebhooks/mergeEventHook");

async function getGuildId(url){
  let guildId = null;
  let db = await connectionPool.connect();
  
  let query = `SELECT * FROM projects WHERE gitlab_link = '${url}' LIMIT(1)` // get inputs from req
  let result = await db.query(query);
  guildId = result.rows[0].guild_id;
  
  return guildId;
}

app.post('/', async function(req, res) {
  
  let db_guild_id = await getGuildId(req.body["project"]["web_url"]);
  if(db_guild_id == null){
    res.status(404).send('Project not found!');
  }
  else{
    switch(req.body["event_type"]){
      case "merge_request": mergeEventHook.ParseMerge(req.body, db_guild_id); break;
    }
    res.status(200).send('WebHook parsed');
  }
});

var port = 9000;
// start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);
client.login(token);

