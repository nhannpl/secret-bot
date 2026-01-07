const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

// Get owner IDs from environment variables or config.json
let ownerId1 = process.env.OWNER_ID_1;
let ownerId2 = process.env.OWNER_ID_2;

if (!ownerId1 || !ownerId2) {
	try {
		const config = require('../../config.json');
		ownerId1 = ownerId1 || config.ownerId1;
		ownerId2 = ownerId2 || config.ownerId2;
	} catch (error) {
		console.warn('No owner IDs found in environment or config.json - reload command will be disabled');
	}
}

const path = require('node:path');
const fs = require('fs');


//this is chatGPT generated code
module.exports = {
	category: 'admin',
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
				.setRequired(true)),
	async execute(interaction) {
		// Check if the user is the owner
		//console.log(`User id is ${interaction.user.id}`);
		if (interaction.user.id !== ownerId1 & interaction.user.id !== ownerId2) {
			return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
		}

		const commandName = interaction.options.getString('command', true).toLowerCase();
		const folders = ['admin', 'utility', 'secret'];
		let commandPath;

		for (const folder of folders) {
			const filePath = path.resolve(__dirname, `../${folder}/${commandName}.js`);
			if (fs.existsSync(filePath)) {
				commandPath = filePath;
				break;
			}
		}
		if (!commandPath) {
			return interaction.reply({ content: `There is no command with name \`${commandName}\` in any of the folders!`, ephemeral: true });
		}
		const command = interaction.client.commands.get(commandName);
		console.log()
		console.log("commandName is " + commandName);
		console.log("comand is " + command);

		if (!command) {
			return interaction.reply({ content: `There is no command with name \`${commandName}\`!`, ephemeral: true });
		}

		delete require.cache[require.resolve(`${commandPath}`)];
		console.log("deleted cache");
		console.log();

		try {
			interaction.client.commands.delete(command.data.name);
			const newCommand = require(commandPath);
			interaction.client.commands.set(newCommand.data.name, newCommand);
			await interaction.reply({ content: `Command \`${newCommand.data.name}\` was reloaded!`, ephemeral: true });
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``, ephemeral: true });
		}
	},
};
