const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time, EmbedBuilder } = require('discord.js');
const { defaultTimeout } = require('../../config.json');


/*ChatGPT assistance: ChatGPT provide template for this code and process intensive prompts from me to write this code. 
* there are some modification in syntax to fit the new version of node js
*/
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

        // Validate that the inputs are non-negative integers
        if (seconds < 0 || minutes < 0 || hours < 0 || days < 0) {
            await interaction.reply({ content: 'All time values must be non-negative integers.', ephemeral: true });
            return;
        }


        // Calculate total timeout in milliseconds
        const timeout = (seconds + minutes * 60 + hours * 3600 + days * 86400) * 1000 || defaultTimeout * 1000; // Default to 10 seconds if all are zero
        let countDownMin = timeout > defaultTimeout * 1000 ? defaultTimeout : timeout / 1000;


        try {
            const revealButton = new ButtonBuilder()
                .setCustomId('reveal_button')
                .setLabel('Click here to reveal the message')
                .setStyle(ButtonStyle.Danger);

            const sender = interaction.user;


            const actionRow = new ActionRowBuilder().addComponents(revealButton);
            // const info = `${sender} sent ${targetUser} a secret message (only ${targetUser} can open the message, but it's public after being open). Please press the button below to see the message.\n⚠️ The message will be deleted in ${days} day(s), ${hours} hour(s), ${minutes} minute(s) and ${timeout == 10000 ? 10 : seconds} s after you click reveal.`;
            const info = new EmbedBuilder()
                .setColor('#ff5733') // Set the color of the embed
                .setTitle('🔒 Secret Message')
                .setDescription(`**${interaction.user.username}** has sent you a secret message!`)
                .addFields(
                    { name: '📬 **How to Read**', value: `Only **${targetUser.username}** can open this message. Please press the button below to reveal it.`, inline: false },
                    { name: '⚠️ **Important**', value: `The message will be public after it is opened and will be deleted in **${days} day(s)**, **${hours} hour(s)**, **${minutes} minute(s)**, and **${timeout == 10000 ? 10 : seconds} second(s)** after you click reveal.`, inline: false })
                .setFooter({ text: 'This message will self-destruct after it is opened.', iconURL: sender.avatarURL() })
                .setTimestamp(); // Adds the current timestamp

            const sentMessage = await interaction.reply({ embeds: [info], fetchReply: true, components: [actionRow] });

            const collector = sentMessage.createMessageComponentCollector({
                time: timeout // Set collector timeout to match message timeout
            });
            let deletionTimeString;
            let countdownMessage;
            let messageOpened = false;

            collector.on('collect', async (button) => {
                if (button.customId === 'reveal_button') {
                    if (button.user.id === targetUser.id) {
                        messageOpened = true;
                        // Calculate the exact deletion time
                        const deletionTime = new Date(Date.now() + timeout);
                        // console.log("The time out calculated is "+timeout);
                        // console.log(`The deletion time calculated is ${deletionTime}`);
                        deletionTimeString = deletionTime.toLocaleString();//!NOTE!: need to consider if users are in different timezones...
                        // console.log(`The deltetion time coverted to localtime format is ${deletionTimeString}`);
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000') // Set a color
                            .setTitle('🔒 Secret Message')
                            .setDescription(`**Message Content:**\n${message}`)
                            .addFields(
                                { name: '🕒 Deletion Time', value: deletionTimeString, inline: false }
                            )
                            .setFooter({ text: `From ${sender.tag}`, iconURL: sender.avatarURL() })
                            .setTimestamp();

                        await button.update({ embeds: [embed], components: [], ephemeral: true });
                        await sentMessage.react('⏰');
                        await interaction.followUp({ content: `${targetUser} read the message.`, ephemeral: true });

                        setTimeout(async () => {
                            countdownMessage = await sentMessage.reply({ content: `This message will be destroyed in ${countDownMin}s` });
                            let countdown = countDownMin;
                            await countdownMessage.react('⏰');
                            const countdownEmojis = ['🔟', '9️⃣', '8️⃣', '7️⃣', '6️⃣', '5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣'];
                            await sentMessage.react(countdownEmojis[10 - countDownMin]);

                            const interval = setInterval(async () => {
                                countdown--;
                                if (countdown > 0) {

                                    await sentMessage.react(countdownEmojis[10 - countdown]);
                                } else {
                                    clearInterval(interval);
                                    collector.stop();

                                    await countdownMessage.delete();
                                    await sentMessage.delete();
                                    console.log("Deleted message");

                                    //await targetUser.send({ content: 'The revealed message was self detructed.', ephemeral: true });
                                    await interaction.followUp({ content: `Message self-destructed at ${deletionTimeString}.` });
                                }
                            }, 1000);

                        }, timeout - (countDownMin) * 1000); // Custom timeout or default 10 seconds
                    } else {
                        button.deferUpdate();
                        await interaction.followUp(`${button.user} is not authorized to open this message.`);
                    }
                }
            });

            // Handle collector timeout (message was never opened)
            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && !messageOpened) {
                    // Message expired before being opened
                    try {
                        const expiredEmbed = new EmbedBuilder()
                            .setColor('#808080')
                            .setTitle('⏰ Secret Message Expired')
                            .setDescription('This secret message has expired and can no longer be opened.')
                            .setFooter({ text: `From ${sender.tag}`, iconURL: sender.avatarURL() })
                            .setTimestamp();

                        await sentMessage.edit({ embeds: [expiredEmbed], components: [] });
                        await interaction.followUp({
                            content: `Secret message to ${targetUser} expired without being opened.`,
                            ephemeral: true
                        });
                    } catch (error) {
                        console.error('Error handling expired message:', error);
                    }
                }
            });


        } catch (error) {
            console.error('Error sending or processing the message:', error);
            await interaction.followUp('Sorry, something went wrong.');
        }
    },
};
