const { Events, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { setLongTimeout } = require('../utils/safe-timer');

// Default timeout fallback
let defaultTimeout = 10;
try {
	const config = require('../config.json');
	defaultTimeout = config.defaultTimeout || 10;
} catch (error) {
	if (process.env.DEFAULT_TIMEOUT) {
		defaultTimeout = parseInt(process.env.DEFAULT_TIMEOUT);
	}
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		// Restore pending messages
		const pendingMessages = db.getAllMessages();
		console.log(`Found ${pendingMessages.length} pending messages to monitor.`);

		for (const data of pendingMessages) {
			try {
				let channel;
				if (data.is_dm) {
					// Fetch user to get DM channel
					const user = await client.users.fetch(data.target_user_id);
					channel = await user.createDM();
				} else {
					channel = await client.channels.fetch(data.channel_id);
				}

				if (!channel) {
					console.log(`Channel ${data.channel_id} not found, removing message from DB.`);
					db.deleteMessage(data.message_id);
					continue;
				}

				const message = await channel.messages.fetch(data.message_id);
				if (!message) {
					console.log(`Message ${data.message_id} not found, removing from DB.`);
					db.deleteMessage(data.message_id);
					continue;
				}

				const timeout = data.timeout_ms;
				let countDownMin = timeout > defaultTimeout * 1000 ? defaultTimeout : timeout / 1000;

				// --- CASE 1: Message was ALREADY revealed but bot crashed during countdown ---
				if (data.reveal_time) {
					console.log(`Resuming ACTIVE countdown for message ${data.message_id}`);

					const now = Date.now();
					const expirationTime = data.reveal_time + timeout;
					const remainingTime = expirationTime - now;

					if (remainingTime <= 0) {
						// Expired while bot was down! Delete immediately.
						console.log(`Message ${data.message_id} expired while offline. Deleting now.`);
						await message.delete().catch(() => { });
						db.deleteMessage(data.message_id);
						continue;
					}

					// Resume the timer for the remaining time
					setLongTimeout(async () => {
						try {
							// Only show countdown UI if less than a minute remains
							if (remainingTime > 60000) {
								// Just delete silently when time is up
								await message.delete().catch(() => { });
								db.deleteMessage(data.message_id);
								console.log("Deleted restored message (long timer finished)");
							} else {
								// Full animation for short remaining time
								const countdownMessage = await message.reply({ content: `This message will be destroyed in ${Math.ceil(remainingTime / 1000)}s` });

								await countdownMessage.delete().catch(() => { });
								await message.delete().catch(() => { });
								db.deleteMessage(data.message_id);
							}
						} catch (err) {
							console.error("Error deleting resumed message:", err);
							db.deleteMessage(data.message_id);
						}
					}, remainingTime);

				} else {
					// --- CASE 2: Message is still WAITING to be revealed ---
					console.log(`Restoring collector for WAITING message ${data.message_id}`);

					// Re-attach collector
					const collector = message.createMessageComponentCollector();

					collector.on('collect', async (button) => {
						if (button.customId === 'reveal_button') {
							if (button.user.id !== data.target_user_id) {
								button.deferUpdate();
								return;
							}

							// Mark as revealed in DB immediately
							db.markAsRevealed(data.message_id, Date.now());

							// Calculate the exact deletion time
							const deletionTime = new Date(Date.now() + timeout);
							const deletionTimeString = deletionTime.toLocaleString();

							const sender = await client.users.fetch(data.sender_id).catch(() => ({ tag: 'Unknown User', avatarURL: () => null }));

							const embed = new EmbedBuilder()
								.setColor('#ff0000')
								.setTitle('🔒 Secret Message')
								.setDescription(`**Message Content:**\n${data.message_content}`)
								.addFields(
									{ name: '🕒 Deletion Time', value: deletionTimeString, inline: false }
								)
								.setFooter({ text: `From ${sender.tag}`, iconURL: sender.avatarURL() })
								.setTimestamp();

							await button.update({ embeds: [embed], components: [], ephemeral: true });
							await message.react('⏰');

							// Resume typical countdown logic
							setLongTimeout(async () => {
								try {
									const countdownMessage = await message.reply({ content: `This message will be destroyed in ${countDownMin}s` });
									let countdown = countDownMin;
									await countdownMessage.react('⏰');
									const countdownEmojis = ['🔟', '9️⃣', '8️⃣', '7️⃣', '6️⃣', '5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣'];

									if (countdown <= 10) {
										await message.react(countdownEmojis[10 - countdown]);
									}

									const interval = setInterval(async () => {
										countdown--;
										if (countdown > 0) {
											if (countdown <= 10) {
												await message.react(countdownEmojis[10 - countdown]);
											}
										} else {
											clearInterval(interval);
											collector.stop();

											await countdownMessage.delete().catch(() => { });
											await message.delete().catch(() => { });

											db.deleteMessage(data.message_id);
											console.log("Deleted restored message");
										}
									}, 1000);
								} catch (error) {
									console.error("Error in countdown for restored message:", error);
									db.deleteMessage(data.message_id);
								}

							}, timeout - (countDownMin) * 1000);
						}
					});
				}
			} catch (error) {
				console.error(`Failed to restore message ${data.message_id}:`, error);
				if (error.code === 10008) { // Unknown Message
					db.deleteMessage(data.message_id);
				}
			}
		}
	},
};