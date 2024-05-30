const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

class ChannelManager {
    constructor(guild) {
        this.guild = guild;
    }

    async deleteChannel(channel) {
        await channel.delete();
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
        .setName('delete-channel')
        .setDescription('Delete a private channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The private channel to delete')
                .setRequired(true)),

    async execute(interaction) {
        const handler = new InteractionHandler(interaction);
        const channelManager = new ChannelManager(interaction.guild);


        const userId = interaction.user.id;

        try {
            const channel = interaction.options.getChannel('channel');


            const permissions = channel.permissionsFor(userId);
            if (!permissions || !permissions.has(PermissionFlagsBits.ManageChannels)) {
                await handler.replyMessage('You do not have permission to delete this channel');
                return;
            }

            await channelManager.deleteChannel(channel);
            await handler.replyMessage(`Deleted channel <#${channel}>.`);
        } catch (error) {
            console.error('Error deleting the channel:', error);
            await handler.replyMessage('Sorry, something went wrong while deleting the channel.');
        }
    },
};
