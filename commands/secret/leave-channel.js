const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

class ChannelManager {
    constructor(guild) {
        this.guild = guild;
    }

    async revokeAccess(channel, userId) {
        await channel.permissionOverwrites.edit(userId, {
            ViewChannel: false,
        });
    }

    async getChannelById(channelId) {
        return await this.guild.channels.cache.get(channelId);
    }
}

class InteractionHandler {
    constructor(interaction) {
        this.interaction = interaction;
    }

    getChannelId() {
        return this.interaction.options.getString('channel-id');
    }

    async replyMessage(content, ephemeral = true) {
        await this.interaction.reply({ content, ephemeral });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave-channel')
        .setDescription('Leave a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to leave')
                .setRequired(true)),

    async execute(interaction) {
        const handler = new InteractionHandler(interaction);
        const channelManager = new ChannelManager(interaction.guild);

        const userId = interaction.user.id;

        try {
            const channel = interaction.options.getChannel('channel');
         
            const channelName=""+channel;

            await channelManager.revokeAccess(channel, userId);
            await handler.replyMessage(`You have left the channel <#${channelName}>.`);
            await channel.send(`${interaction.user} had left the channel.`);
        } catch (error) {
            console.error('Error leaving the channel:', error);
            await handler.replyMessage('Sorry, something went wrong while leaving the channel.');
        }
    },
};
