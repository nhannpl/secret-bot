const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, time } = require('discord.js');
const { defaultTimeout } = require('../../config.json');

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
                .setLabel('Click to reveal the message')
                .setStyle(ButtonStyle.Danger);

            const sender = interaction.user;

            const actionRow = new ActionRowBuilder().addComponents(revealButton);
            const info = `${sender} sent you a secret message. Please press the button below to see the message. ⚠️ The message will be deleted in ${days} day(s), ${hours} hour(s), ${minutes} minute(s) and ${timeout == 10000 ? 10 : seconds} s after you click reveal.`;

            const sentMessage = await targetUser.send({ content: info, fetchReply: true, components: [actionRow] });
            const notifyMessageSent = `Sent self-destructing DM to ${targetUser}. If you entered timeout less than 1s, default time the message will be destroyed is ${defaultTimeout}s.`;

            await interaction.reply({ content: notifyMessageSent, ephemeral: true });

            const collector = sentMessage.createMessageComponentCollector({});
            let deletionTimeString;
            let countdownMessage;
            console.log("Beginning collector on");

            collector.on('collect', async (button) => {
                if (button.customId === 'reveal_button' && button.user.id === targetUser.id) {
                    // Calculate the exact deletion time
                    const deletionTime = new Date(Date.now() + timeout);
                    // console.log("The time out calculated is "+timeout);
                    // console.log(`The deletion time calculated is ${deletionTime}`);
                    deletionTimeString = deletionTime.toLocaleString();//!NOTE!: need to consider if users are in different timezones...
                    console.log(`The deltetion time coverted to localtime format is ${deletionTimeString}`);
                    await button.update({ content: `This message will be deleted at ${deletionTimeString}:\n ${message} \n - from ${sender}`, components: [], ephemeral: true });
                    await sentMessage.react('⏰');
                    await interaction.followUp({ content: `${targetUser} read the message.`, ephemeral: true });

                    setTimeout(async () => {
                        countdownMessage = await sentMessage.reply({ content: `This message will be destroyed in ${countDownMin}s` });
                        let countdown = countDownMin;
                        await countdownMessage.react('⏰');
                        const countdownEmojis = ['🔟', '9️⃣', '8️⃣', '7️⃣', '6️⃣', '5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣'];
                        await countdownMessage.react(countdownEmojis[10 - countDownMin]);

                        const interval = setInterval(async () => {
                            //console.log("Countdown is "+countdown);
                            countdown--;
                            if (countdown > 0) {

                                await countdownMessage.react(countdownEmojis[10 - countdown]);
                            } else {
                                // console.log("Done countdown. Starting clear reactions");
                                clearInterval(interval);
                                // console.log("Stop collector");
                                collector.stop();
                                
                                await countdownMessage.delete();
                                await sentMessage.delete();
                                console.log("Deleted message");

                                await targetUser.send({ content: 'The revealed message was self detructed.', ephemeral: true });
                                await interaction.followUp({ content: `Message self-destructed at ${deletionTimeString}.`, ephemeral: true });
                            }
                        }, 1000);

                    }, timeout - (countDownMin) * 1000); // Custom timeout or default 10 seconds
                }
            });


        } catch (error) {
            console.error('Error sending or processing the message:', error);
            await interaction.followUp('Sorry, something went wrong.');
        }
    },
};
