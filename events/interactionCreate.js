const { Events, MessageFlags } = require('discord.js');
const { request } = require('undici');
// Initialize database and restore collectors
const db = require('../database');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		// if (interaction.commandName === 'cat') {
		//     const catResult = await request('https://aws.random.cat/meow');
		//     const { file } = await catResult.body.json();
		//     interaction.editReply({ files: [file] });
		// }
		// else


		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	},
};