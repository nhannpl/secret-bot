const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-private-channel')
        .setDescription('Create a private channel with an optional timeout for deletion')
        .addStringOption(option =>
            option.setName('channel-name')
                .setDescription('The name of the private channel')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('timeout')
                .setDescription('Timeout in minutes before the channel is deleted')
                .setRequired(false)),
    
    async execute(interaction) {
        const channelName = interaction.options.getString('channel-name');
        const timeoutMinutes = interaction.options.getInteger('timeout');
        const guild = interaction.guild;

        try {
            // Create the private channel
            const privateChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id, // Deny everyone
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id, // Allow the command issuer
                        allow: [PermissionFlagsBits.ViewChannel],
                    },
                ],
            });

            // Notify the user
            let replyMessage = `Created private channel <#${privateChannel.id}>.`;
            if (timeoutMinutes) {
                replyMessage += ` It will be deleted in ${timeoutMinutes} minute(s).`;
                // Set timeout to delete the channel
                setTimeout(async () => {
                    await privateChannel.delete();
                    console.log(`Deleted channel ${channelName} after ${timeoutMinutes} minutes`);
                }, timeoutMinutes * 60 * 1000);
            }
            
            await interaction.reply({ content: replyMessage, ephemeral: true });

        } catch (error) {
            console.error('Error creating or deleting the channel:', error);
            await interaction.reply('Sorry, something went wrong while creating the private channel.');
        }
    },
};
