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
                .setRequired(false))
        .addStringOption(option =>
            option.setName('delete-at')
                .setDescription('This option has higher priority: Specific time to delete the channel (dd/mm/yyyy-hh:mmAM/PM)')
                .setRequired(false)),
    
    async execute(interaction) {
        const channelName = interaction.options.getString('channel-name');
        const timeoutMinutes = interaction.options.getInteger('timeout');
        const deleteAt = interaction.options.getString('delete-at');
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
            console.log();

            let replyMessage = `Created private channel <#${privateChannel.id}>.`;
            let deleteAfterMs;

       if (deleteAt) {
                const deleteAtDate = new Date(deleteAt.replace(/(\d{2})\/(\d{2})\/(\d{4})-(\d{2}):(\d{2})(AM|PM)/, 
                    (match, day, month, year, hours, minutes, period) => {
                        hours = period === 'PM' && hours !== '12' ? (parseInt(hours) + 12).toString() : hours;
                        hours = period === 'AM' && hours === '12' ? '00' : hours;
                        return `${year}-${month}-${day}T${hours}:${minutes}:00`;
                    }
                ));

                if (isNaN(deleteAtDate)) {
                    throw new Error('Invalid date format');
                    
                }

                deleteAfterMs = deleteAtDate - new Date();
                if (deleteAfterMs <= 0) {
                    throw new Error('The specified delete time must be in the future');
                }

                replyMessage += ` It will be deleted at ${deleteAt}.`;
            }
            else if (timeoutMinutes) {
                deleteAfterMs = timeoutMinutes * 60 * 1000;
                replyMessage += ` It will be deleted in ${timeoutMinutes} minute(s).`;
            }

            if (deleteAfterMs) {
                setTimeout(async () => {
                    await privateChannel.delete();
                    console.log(`Deleted channel ${channelName}`);
                }, deleteAfterMs);
            }
            
            await interaction.reply({ content: replyMessage, ephemeral: true });

        } catch (error) {
            console.error('Error creating or deleting the channel:', error);
            await interaction.reply('Sorry, something went wrong while creating the private channel.');
        }
    },
};
