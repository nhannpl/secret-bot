const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time } = require('discord.js');
const { request } = require('undici');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dog-image')
        .setDescription('Get a dog pict.'),

    async execute(interaction) {

        let pict_url;
        console.log()

        try {
            const message_response = await request('https://dog.ceo/api/breeds/image/random');
            console.log("messga eresponse is "+message_response);
            const data=await message_response.body.json();
            console.log("Data json is "+data);

            pict_url = data.message;
            console.log("Got the pict url "+pict_url);
        
        } catch (error) {
            console.error('Error fetching dog pict:', error);
            return interaction.reply('Sorry, I could not fetch a dog pict right now.');
        }

        try {
            await interaction.reply({ files: [pict_url] })
    

        } catch (error) {
            console.error('Error sending or processing the message:', error);
            await interaction.followUp('Sorry, something went wrong.');
        }
    },
};
