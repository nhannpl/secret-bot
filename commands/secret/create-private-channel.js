const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const schedule = require('node-schedule');


//!NOTE!: be consistent about what time format to use: military or AM/PM - conflict with the self-destruct-dm
class ChannelManager {
    constructor(guild) {
        this.guild = guild;
    }

    async createPrivateChannel(channelName, userId) {
        const privateChannel = await this.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: this.guild.id, // Deny everyone
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: userId, // Allow the command issuer
                    allow: [PermissionFlagsBits.ViewChannel],
                },
            ],
        });

        return privateChannel;
    }

    async deleteChannel(channel) {
        await channel.delete();
    }
}

class TimeParser {

    static isValidDate(year, month, day) {
        const date = new Date(year, month, day);
        return date.getFullYear() === year &&
               date.getMonth() === month &&
               date.getDate() === day ;
            //    & date.getHours() === hours &&
            //    date.getMinutes() === minutes;
    }

    static isValidTime(hours, minutes) {
        // Check if hours are between 0 and 23
        if (hours < 0 || hours > 23) {
            return false;
        }

        // Check if minutes are between 0 and 59
        if (minutes < 0 || minutes > 59) {
            return false;
        }

        // If all checks pass, return true
        return true;
    }

    static parseDeleteAt(deleteAt) {
        try {
            console.log(`The delete at entered is ${deleteAt}`);
            const match = deleteAt.match(/(\d{2})\/(\d{2})\/(\d{4})-(\d{2}):(\d{2})/);
            if (!match) {
                throw new Error('Invalid format (24-hour clock): Expected mm/dd/yyyy-hh:mm');
            }

            const [_, month, day, year, hours, minutes] = match.map(Number);


            if (!TimeParser.isValidDate(year, month-1, day)) {
                throw new Error(`Invalid date: Date ${month}/${day}/${year} does not exist`);
            }

            if (!TimeParser.isValidTime(hours, minutes)) {
                throw new Error('Invalid time (24-hour clock): Time must be in the range 00:00 - 23:59');
            }

            const deleteAtDate = new Date(year, month-1, day, hours, minutes, 0, 0);
            console.log(`Validated time is ${deleteAtDate}`);

            if (isNaN(deleteAtDate)) {
                throw new Error('Date and time need to follow this format (24-hour clock): mm/dd/yyyy-hh:mm');
            }

            return deleteAtDate;
        } catch (e) {
            console.log( e);
            throw new Error(`Something went wrong: ${e}`);
        }
    }
}

class EmbedMessageBuilder {
    static buildDeletionAnnouncement(deleteDate) {
        const formattedDate = deleteDate.toLocaleString();
        return new EmbedBuilder()
            .setTitle('Channel Deletion Announcement')
            .setDescription(`This channel will be automatically deleted at ${formattedDate}`)
            .setColor('#ff0000');
    }

    static buildNoDeletionAnnouncement() {
        return new EmbedBuilder()
            .setTitle('Channel Deletion Announcement')
            .setDescription(`This private channel does not have an expiry time. But it will be hidden after an amount of inactive time set by the owner of this server.`)
            .setColor('#ff0000');
    }
}

class InteractionHandler {
    constructor(interaction) {
        this.interaction = interaction;
    }

    getChannelName() {
        return this.interaction.options.getString('channel-name');
    }

    getTimeoutMinutes() {
        return this.interaction.options.getInteger('timeout');
    }

    getDeleteAt() {
        return this.interaction.options.getString('delete-at');
    }

    async replyMessage(content, ephemeral = true) {
        await this.interaction.reply({ content, ephemeral });
    }
}

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
                .setDescription('This option has higher priority: Specific time to delete the channel (mm/dd/yyyy-hh:mm)')
                .setRequired(false)),

    async execute(interaction) {
        const handler = new InteractionHandler(interaction);
        const channelManager = new ChannelManager(interaction.guild);

        const channelName = handler.getChannelName();
        const timeoutMinutes = handler.getTimeoutMinutes();
        const deleteAt = handler.getDeleteAt();

        try {
            let replyMessage = `Created private channel #${channelName}.`;

            let deleteAtDate;

            if (deleteAt) {
                try {
                    deleteAtDate = TimeParser.parseDeleteAt(deleteAt);
                    if (deleteAtDate <= new Date()) {
                        throw new Error('The specified delete time must be in the future');
                    }
                    replyMessage += ` It will be deleted at ${deleteAt}.`;
                } catch (e) {
                    console.log(e);
                    console.log("\nEnd of error.");
                    await handler.replyMessage(`${e}`);
                   
                    //await interaction.reply({ content:`${e}` , ephemeral:true })
        
                    return;
                }
            } else if (timeoutMinutes) {
                deleteAtDate = new Date(Date.now() + timeoutMinutes * 60 * 1000);
                replyMessage += ` It will be deleted in ${timeoutMinutes} minute(s).`;
            }
            const privateChannel = await channelManager.createPrivateChannel(channelName, interaction.user.id);


            if (deleteAtDate) {
                schedule.scheduleJob(deleteAtDate, async () => {
                    await channelManager.deleteChannel(privateChannel);
                });
                const announcementEmbed = EmbedMessageBuilder.buildDeletionAnnouncement(deleteAtDate);
                await privateChannel.send({ embeds: [announcementEmbed] });
            } else {
                const announcementEmbed = EmbedMessageBuilder.buildNoDeletionAnnouncement();
                await privateChannel.send({ embeds: [announcementEmbed] });
            }

            await handler.replyMessage(replyMessage);
        } catch (error) {
            console.error('Error creating or deleting the channel:', error);
            await handler.replyMessage('Sorry, something went wrong while creating the private channel.');
        }
    },
};
