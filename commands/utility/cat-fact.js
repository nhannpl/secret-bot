const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time } = require('discord.js');
const { request } = require('undici');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat-fact')
        .setDescription('Dm a cat fact that will be deleted after the receiver read it!'),
    async execute(interaction) {
        let fact;

        try {
            const factResponse = await request('https://catfact.ninja/fact');
            const factData = await factResponse.body.json();
            fact = factData.fact;
        } catch (error) {
            console.error('Error fetching cat fact:', error);
            return interaction.reply('Sorry, I could not fetch a cat fact right now.');
        }

        try {
             await interaction.reply({ content: fact});


        } catch (error) {
            console.error('Error sending or processing the message:', error);
            await interaction.followUp('Sorry, something went wrong.');
        }
    },
};
