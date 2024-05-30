const { SlashCommandBuilder,PermissionsBitField, PermissionFlagsBits,PermissionOverwrites, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-users-to-channel')
        .setDescription('Add up to three users to an existing private channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The private channel to add users to')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user1')
                .setDescription('The first user to add to the channel')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user2')
                .setDescription('The second user to add to the channel')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user3')
                .setDescription('The third user to add to the channel')
                .setRequired(false)),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const user1 = interaction.options.getUser('user1');
        const user2 = interaction.options.getUser('user2');
        const user3 = interaction.options.getUser('user3');

        try {
            // Check if the channel is a text channel
            if (channel.type !== ChannelType.GuildText) {
                return interaction.reply({ content: 'Please select a valid text channel.', ephemeral: true });
            }


            // Update channel permissions to allow users to view the channel
            let message ="";
            async function addUserToChanel(user){
                const permissions =channel.permissionsFor(user)
                
                if (permissions && permissions.has(PermissionFlagsBits.ViewChannel))
                    {
                        message+=`${user} is already in channel <#${channel.id}>.\n`;
             
                    }
                else
                {
                    await channel.permissionOverwrites.edit(user.id, { ViewChannel: true });
                    message+=`Added ${user} to <#${channel.id}>.\n`;
                }
            }

            await addUserToChanel(user1);

            if (user2) {
                await addUserToChanel(user2);

            }
            if (user3) {
                await addUserToChanel(user3)
            }

            await interaction.reply({ content: message, ephemeral: true });

        } catch (error) {
            console.error('Error adding users to the channel:', error);
            await interaction.reply('Sorry, something went wrong while adding users to the channel.');
        }
    },
};
