const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time } = require('discord.js');
const { request } = require('undici');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat-image')
        .setDescription('Get a cat image.'),

    async execute(interaction) {

        let pict_url;
        console.log()

        try {
            const message_response = await request('https://api.thecatapi.com/v1/images/search');
            console.log("messga eresponse is "+message_response);
            const data=  await message_response.body.json();
            console.log("Data json is "+data);

            if (data && data.length > 0) {
                pict_url = data[0].url;
                console.log("Got the cat picture URL: " + pict_url);
            } else {
                throw new Error('No data found in the response.');
            }

        
        } catch (error) {
            console.error('Error fetching cat pict:', error);
            return interaction.reply('Sorry, I could not fetch a cat pict right now.');
        }

        try {
            await interaction.reply({ files: [pict_url] })
    

        } catch (error) {
            console.error('Error sending or processing the message:', error);
            await interaction.followUp('Sorry, something went wrong.');
        }
    },
};
