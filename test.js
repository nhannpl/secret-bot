const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const AsyncLock = require('async-lock');
const { defaultTimeout } = require('../../config.json');

const lock = new AsyncLock();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('self-destruct-channel-message')
        .setDescription('Send a message in the current channel that will be deleted after the receiver reads it!')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The intended receiver')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
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

        const channelMembers = interaction.channel.members;

        if (!channelMembers.has(targetUser.id)) {
            return interaction.reply({
                content: `The user ${targetUser.username} is not in the current channel.`,
                ephemeral: true,
            });
        }

        if (seconds < 0 || minutes < 0 || hours < 0 || days < 0) {
            await interaction.reply({ content: 'All time values must be non-negative integers.', ephemeral: true });
            return;
        }

        const timeout = (seconds + minutes * 60 + hours * 3600 + days * 86400) * 1000 || defaultTimeout * 1000;
        const countDownMin = timeout > defaultTimeout * 1000 ? defaultTimeout : timeout / 1000;

        try {
            const revealButton = new ButtonBuilder()
                .setCustomId('reveal_button')
                .setLabel('Click here to reveal the message')
                .setStyle(ButtonStyle.Danger);

            const deleteNowButton = new ButtonBuilder()
                .setCustomId('delete_now_button')
                .setLabel('Delete message now')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(revealButton);
            const deleteNowRow = new ActionRowBuilder().addComponents(deleteNowButton);

            const info = new EmbedBuilder()
                .setColor('#ff5733')
                .setTitle('🔒 Secret Message')
                .setDescription(`**${interaction.user.username}** has sent you a secret message!`)
                .addFields(
                    { name: '📬 **How to Read**', value: `Only **${targetUser.username}** can open this message. Please press the button below to reveal it.`, inline: false },
                    { name: '⚠️ **Important**', value: `The message will be public after it is opened and will be deleted in **${days} day(s)**, **${hours} hour(s)**, **${minutes} minute(s)**, and **${timeout == 10000 ? 10 : seconds} second(s)** after you click reveal.`, inline: false })
                .setFooter({ text: 'This message will self-destruct after it is opened.', iconURL: interaction.user.avatarURL() })
                .setTimestamp();

            const sentMessage = await interaction.reply({ embeds: [info], fetchReply: true, components: [actionRow] });

            const collector = sentMessage.createMessageComponentCollector({});

            collector.on('collect', async (button) => {
                lock.acquire('message-lock', async (done) => {
                    try {
                        if (button.customId === 'reveal_button') {
                            if (button.user.id === targetUser.id) {
                                const deletionTime = new Date(Date.now() + timeout);
                                const deletionTimeString = deletionTime.toLocaleString();

                                const embed = new EmbedBuilder()
                                    .setColor('#ff0000')
                                    .setTitle('🔒 Secret Message')
                                    .setDescription(`**Message Content:**\n${message}`)
                                    .addFields(
                                        { name: '🕒 Deletion Time', value: deletionTimeString, inline: false }
                                    )
                                    .setFooter({ text: `From ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() })
                                    .setTimestamp();

                                await button.update({ embeds: [embed], components: [deleteNowRow], ephemeral: true });

                                setTimeout(async () => {
                                    lock.acquire('message-lock', async (doneTimeout) => {
                                        try {
                                            const countdownMessage = await sentMessage.reply({ content: `This message will be destroyed in ${countDownMin}s` });
                                            let countdown = countDownMin;
                                            const countdownEmojis = ['🔟', '9️⃣', '8️⃣', '7️⃣', '6️⃣', '5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣'];
                                            await sentMessage.react(countdownEmojis[10 - countDownMin]);

                                            const interval = setInterval(async () => {
                                                try {
                                                    await sentMessage.react(countdownEmojis[10 - countdown]);
                                                    countdown--;

                                                    if (countdown <= 0) {
                                                        clearInterval(interval);
                                                        collector.stop();
                                                        await countdownMessage.delete();
                                                        await sentMessage.delete();
                                                        await interaction.followUp({ content: `Message self-destructed at ${deletionTimeString}.`, ephemeral: true });
                                                    }
                                                } catch (error) {
                                                    clearInterval(interval);
                                                }
                                            }, 1000);

                                        } catch (error) {
                                            console.error('Error during countdown or message deletion:', error);
                                        } finally {
                                            doneTimeout();
                                        }
                                    });
                                }, timeout - (countDownMin) * 1000);
                            } else {
                                await button.deferUpdate();
                                await interaction.followUp({ content: `${button.user} is not authorized to open this message.`, ephemeral: true });
                            }
                        } else if (button.customId === 'delete_now_button') {
                            if (button.user.id === targetUser.id) {
                                lock.acquire('message-lock', async (doneDelete) => {
                                    try {
                                        await sentMessage.delete();
                                        collector.stop();
                                        await interaction.followUp({ content: `Message self-destructed immediately by ${targetUser.username}.`, ephemeral: true });
                                    } catch (error) {
                                        console.error('Error deleting message:', error);
                                    } finally {
                                        doneDelete();
                                    }
                                });
                            } else {
                                await button.deferUpdate();
                                await interaction.followUp({ content: `${button.user} is not authorized to delete this message.`, ephemeral: true });
                            }
                        }
                    } catch (error) {
                        console.error('Error handling button click:', error);
                        await interaction.followUp({ content: 'An error occurred while processing the message.', ephemeral: true });
                    } finally {
                        done();
                    }
                });
            });

        } catch (error) {
            console.error('Error sending or processing the message:', error);
            await interaction.followUp({ content: 'Sorry, something went wrong.', ephemeral: true });
        }
    },
};