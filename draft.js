const { SlashCommandBuilder, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spoiler')
        .setDescription('Send a hidden message as a spoiler')
        .addUserOption(option => 
            option.setName('user')
            .setDescription('The user who needs to read the message')
            .setRequired(true)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const hiddenMessage = '||This is a spoiler message.||';

        try {
            // Create a button to reveal the hidden message
            const revealButton = new MessageButton()
                .setCustomId('reveal_button')
                .setLabel('Reveal Spoiler')
                .setStyle('PRIMARY');

            // Create an action row containing the reveal button
            const actionRow = new MessageActionRow().addComponents(revealButton);

            // Send the hidden message with the reveal button to the user's DM
            const sentMessage = await targetUser.send({ content: hiddenMessage, components: [actionRow] });

            // Listen for the 'reveal_button' button click
            const filter = (buttonInteraction) => buttonInteraction.customId === revealButton.customId && buttonInteraction.user.id === targetUser.id;
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 }); // Adjust the timeout as needed

            collector.on('collect', async (buttonInteraction) => {
                // Reveal the hidden message by removing the spoiler tags
                const revealedMessage = hiddenMessage.replace(/\|\|/g, '');

                // Update the message to reveal the hidden content and remove the button
                await buttonInteraction.update({ content: revealedMessage, components: [] });

                // Delete the original message after a timeout (10 seconds)
                setTimeout(async () => {
                    await buttonInteraction.message.delete();
                    // Notify the user that the message was deleted due to timeout
                    await targetUser.send('The revealed message was deleted due to a timeout.');
                }, 10000); // Adjust the timeout duration as needed (in milliseconds)
            });

            collector.on('end', collected => {
                if (!collected.size) {
                    sentMessage.edit({ content: hiddenMessage, components: [] }).catch(console.error);
                }
            });

        } catch (error) {
            console.error('Error sending hidden message:', error);
            // Handle errors if sending the hidden message fails
            await interaction.reply({ content: 'Failed to send hidden message to the user.', ephemeral: true });
        }

        // Reply to the interaction indicating that the hidden message has been sent
        await interaction.reply({ content: 'Hidden message sent to the user.', ephemeral: true });
    },
};
