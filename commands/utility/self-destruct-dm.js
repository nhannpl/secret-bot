const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('self-destruct-dm')
        .setDescription('Send a DM that will be deleted after the receiver reads it!')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user who needs to read the message')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to DM')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Custom timeout in seconds before the message self-destructs')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Custom timeout in minutes before the message self-destructs')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('hours')
                .setDescription('Custom timeout in hours before the message self-destructs')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Custom timeout in days before the message self-destructs')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const message = interaction.options.getString('message');
        const seconds = interaction.options.getInteger('seconds') || 0;
        const minutes = interaction.options.getInteger('minutes') || 0;
        const hours = interaction.options.getInteger('hours') || 0;
        const days = interaction.options.getInteger('days') || 0;

        // Calculate total timeout in milliseconds
        const timeout = (seconds + minutes * 60 + hours * 3600 + days * 86400) * 10000 || 10000; // Default to 10 seconds if all are zero



        try {
            const revealButton = new ButtonBuilder()
                .setCustomId('reveal_button')
                .setLabel('Click to reveal the message')
                .setStyle(ButtonStyle.Danger);
            
            const sender= interaction.user;

            const actionRow = new ActionRowBuilder().addComponents(revealButton);
            const info = `${sender} sent you a secret message. Please press the button below to see the message. ⚠️ The message will be deleted in ${days} day(s), ${hours} hour(s), ${minutes} minute(s) and ${timeout ==10000? 10: seconds} s after you click reveal.`;

            const sentMessage = await targetUser.send({ content: info, fetchReply: true, components: [actionRow] });
            await interaction.reply({ content: `Sent self-destructing DM to ${targetUser}.`, ephemeral: true });

            const collector = sentMessage.createMessageComponentCollector({ });
            let deletionTimeString;

            collector.on('collect', async (button) => {
                if (button.customId === 'reveal_button' && button.user.id === targetUser.id) {
                            // Calculate the exact deletion time
                    const deletionTime = new Date(Date.now() + timeout);
                    console.log("The time out calculated is "+timeout);
                    deletionTimeString = deletionTime.toLocaleString();
                    await button.update({ content: `This message will be deleted at ${deletionTimeString}:\n ${message} \n - from ${sender}`, components: [], ephemeral: true });
                    await interaction.followUp({ content: `${targetUser} read the message.`, ephemeral: true });

                    setTimeout(async () => {
                        collector.stop();
                    }, timeout); // Custom timeout or default 10 seconds
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    console.log('No reactions collected');
                } else {
                    await sentMessage.delete();
                    await targetUser.send({ content: 'The revealed message was deleted due to a timeout.', ephemeral: true });
                    await interaction.followUp({ content: `Message self-destructed at ${deletionTimeString}.`, ephemeral: true });
                }
            });
        } catch (error) {
            console.error('Error sending or processing the message:', error);
            await interaction.followUp('Sorry, something went wrong.');
        }
    },
};
