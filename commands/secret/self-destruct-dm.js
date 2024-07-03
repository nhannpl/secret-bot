const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { defaultTimeout } = require('../../config.json');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();

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

        if (seconds < 0 || minutes < 0 || hours < 0 || days < 0) {
            await interaction.reply({ content: 'All time values must be non-negative integers.', ephemeral: true });
            return;
        }

        const timeout = (seconds + minutes * 60 + hours * 3600 + days * 86400) * 1000 || defaultTimeout * 1000;
        let countDownMin = timeout > defaultTimeout * 1000 ? defaultTimeout : timeout / 1000;

        try {
            const revealButton = new ButtonBuilder()
                .setCustomId('reveal_button')
                .setLabel('Click here to reveal the message')
                .setStyle(ButtonStyle.Danger);

            const sender = interaction.user;

            const actionRow = new ActionRowBuilder().addComponents(revealButton);
            const info = new EmbedBuilder()
                .setColor('#ff5733')
                .setTitle('🔒 Secret Message')
                .setDescription(`**${interaction.user.username}** has sent you a secret message!`)
                .addFields(
                    { name: '📬 **How to Read**', value: `Please press the button below to reveal it.`, inline: false },
                    { name: '⚠️ **Important**', value: `The message will be deleted in **${days} day(s)**, **${hours} hour(s)**, **${minutes} minute(s)**, and **${timeout == 10000 ? 10 : seconds} second(s)** after you click reveal.`, inline: false })
                .setFooter({ text: 'This message will self-destruct after it is opened.', iconURL: sender.avatarURL() })
                .setTimestamp();

            const sentMessage = await targetUser.send({ embeds: [info], fetchReply: true, components: [actionRow] });
            await sentMessage.react('⏰');
            const notifyMessageSent = `Sent self-destructing DM to ${targetUser}. If you entered timeout less than 1s, default time the message will be destroyed is ${defaultTimeout}s.`;

            await interaction.reply({ content: notifyMessageSent, ephemeral: true });

            const collector = sentMessage.createMessageComponentCollector({ time: timeout });

            collector.on('collect', async (button) => {
                if (button.customId === 'reveal_button' && button.user.id === targetUser.id) {
                    await lock.acquire('button_interaction', async () => {
                        // Only one user can process this critical section at a time

                        const deletionTime = new Date(Date.now() + timeout);
                        const deletionTimeString = deletionTime.toLocaleString();

                        const embed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('🔒 Secret Message')
                            .setDescription(`**Message Content:**\n${message}`)
                            .addFields(
                                { name: '🕒 Deletion Time', value: deletionTimeString, inline: false }
                            )
                            .setFooter({ text: `From ${sender.tag}`, iconURL: sender.avatarURL() })
                            .setTimestamp();

                        await button.update({ embeds: [embed], components: [], ephemeral: true });
                
                        await interaction.followUp({ content: `${targetUser} read the message.`, ephemeral: true });

                        setTimeout(async () => {
                            const countdownMessage = await sentMessage.reply({ content: `This message will be destroyed in ${countDownMin}s` });
                            let countdown = countDownMin;
                            await countdownMessage.react('⏰');
                            const countdownEmojis = ['🔟', '9️⃣', '8️⃣', '7️⃣', '6️⃣', '5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣'];

                            const interval = setInterval(async () => {
                                countdown--;
                                if (countdown > 0) {
                                    await sentMessage.react(countdownEmojis[10 - countdown]);
                                } else {
                                    clearInterval(interval);
                                    collector.stop();

                                    await countdownMessage.delete();
                                    await sentMessage.delete();
                                    await targetUser.send({ content: 'The revealed message was self-destructed.', ephemeral: true });
                                    await interaction.followUp({ content: `Message self-destructed at ${deletionTimeString}.`, ephemeral: true });
                                }
                            }, 1000);
                        }, timeout - (countDownMin) * 1000);
                    }).catch(err => {
                        console.error('Error in button interaction lock:', err);
                    });
                }
            });
        } catch (error) {
            console.error('Error sending or processing the message:', error);
        }
    },
};