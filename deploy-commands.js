const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

// Use environment variables for production, fallback to config.json for local dev
let clientId = process.env.DISCORD_CLIENT_ID;
let token = process.env.DISCORD_TOKEN;

if (!clientId || !token) {
	try {
		const config = require('./config.json');
		clientId = clientId || config.clientId;
		token = token || config.token;
	} catch (error) {
		console.error('Missing credentials! Set DISCORD_CLIENT_ID and DISCORD_TOKEN environment variables or add to config.json');
		process.exit(1);
	}
}

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');

const commandFolders = fs.readdirSync(foldersPath);
console.log(`Command folderrs is ${commandFolders}`)

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	console.log(`commandsPath is ${commandsPath}`);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		console.log(`filePath is ${filePath}`);
		const command = require(filePath);
		console.log(`command is ${command}`);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();