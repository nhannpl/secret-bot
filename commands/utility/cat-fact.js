const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time } = require('discord.js');
const { request } = require('undici');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat-fact')
        .setDescription('Dm a cat fact that will be deleted after the receiver read it!')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user who needs to read the message')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('timeout')
                .setDescription('Custom timeout in seconds before the message self-destructs')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const timeout = interaction.options.getInteger('timeout') || 10;
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
            const revealButton = new ButtonBuilder()
                .setCustomId('reveal_button')
                .setLabel('Click to reveal the message')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(revealButton);
            const info = `${interaction.user} sent you a secret message. Please press the button below to see the message. ⚠️ You have ${timeout} second(s) before the message is deleted as you click reveal.`;

            const sentMessage = await targetUser.send({ content: info, fetchReply: true, components: [actionRow] });
            await interaction.reply({ content: `Sent self-destructing DM to ${targetUser}.`, ephemeral: true });

            const collector = sentMessage.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async (button) => {
                if (button.customId === 'reveal_button' && button.user.id === targetUser.id) {
                    await button.update({ content: fact, components: [], ephemeral: true });
                    await interaction.followUp({ content: `${targetUser} read the message.`, ephemeral: true });

                    setTimeout(async () => {
                        collector.stop();
                    }, timeout * 1000); // Custom timeout or default 10 seconds
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    console.log('No reactions collected');
                } else {
                    await sentMessage.delete();
                    await targetUser.send({ content: 'The revealed message was deleted due to a timeout.', ephemeral: true });
                    await interaction.followUp({content:`Message self desctructed after ${timeout} second(s).`,  ephemeral: true})
                }
            });
        } catch (error) {
            console.error('Error sending or processing the message:', error);
            await interaction.followUp('Sorry, something went wrong.');
        }
    },
};
