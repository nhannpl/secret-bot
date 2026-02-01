const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Use environment variable for production, fallback to config.json for local dev
let token = process.env.DISCORD_TOKEN;

// Diagnostic logging for debugging Render deployment
console.log('[Startup] Checking for DISCORD_TOKEN...');
console.log('[Startup] DISCORD_TOKEN from env:', token ? `Found (${token.length} chars, starts with ${token.substring(0, 10)}...)` : 'NOT FOUND');

if (!token) {
	console.log('[Startup] Trying to load token from config.json...');
	try {
		const config = require('./config.json');
		token = config.token;
		console.log('[Startup] Token loaded from config.json:', token ? 'Found' : 'NOT FOUND');
	} catch (error) {
		console.error('[Startup] No token found! Set DISCORD_TOKEN environment variable or add token to config.json');
		process.exit(1);
	}
}

console.log('[Startup] Final token status:', token ? 'Ready to login' : 'MISSING - will crash');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildInvites,]
});

// Render compatibility: Simple web server to bind to a port
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// Keep-alive mechanism for Render
const https = require('https');
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

// Ping interval configuration constants
const DEFAULT_PING_INTERVAL_MINUTES = 5;
const MIN_PING_INTERVAL_MINUTES = 1;
const MAX_PING_INTERVAL_MINUTES = 14; // Stay under Render's 15-min timeout

if (RENDER_EXTERNAL_URL) {
	// Parse ping interval from environment variable, with validation
	let pingIntervalMinutes = parseInt(process.env.PING_INTERVAL_MINUTES, 10);

	// Validate and apply bounds
	if (isNaN(pingIntervalMinutes) || pingIntervalMinutes < MIN_PING_INTERVAL_MINUTES) {
		if (process.env.PING_INTERVAL_MINUTES) {
			console.warn(`[Keep-Alive] Invalid PING_INTERVAL_MINUTES="${process.env.PING_INTERVAL_MINUTES}". Using default: ${DEFAULT_PING_INTERVAL_MINUTES} minutes.`);
		}
		pingIntervalMinutes = DEFAULT_PING_INTERVAL_MINUTES;
	} else if (pingIntervalMinutes > MAX_PING_INTERVAL_MINUTES) {
		console.warn(`[Keep-Alive] PING_INTERVAL_MINUTES=${pingIntervalMinutes} exceeds max (${MAX_PING_INTERVAL_MINUTES}). Capping to ${MAX_PING_INTERVAL_MINUTES} minutes.`);
		pingIntervalMinutes = MAX_PING_INTERVAL_MINUTES;
	}

	// Convert to milliseconds
	const PING_INTERVAL_MS = pingIntervalMinutes * 60 * 1000;

	setInterval(() => {
		https.get(RENDER_EXTERNAL_URL, (res) => {
			if (res.statusCode === 200) {
				console.log(`[Keep-Alive] Ping successful to ${RENDER_EXTERNAL_URL}`);
			} else {
				console.log(`[Keep-Alive] Ping failed with status: ${res.statusCode}`);
			}
		}).on('error', (e) => {
			console.error(`[Keep-Alive] Ping error: ${e.message}`);
		});
	}, PING_INTERVAL_MS);

	console.log(`[Keep-Alive] Configured to ping ${RENDER_EXTERNAL_URL} every ${pingIntervalMinutes} minute. (Error gateway)`);
}

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Attempt to login to Discord with error handling
client.login(token)
	.then(() => {
		console.log('[Discord] Login initiated successfully');
	})
	.catch((error) => {
		console.error('[Discord] Failed to login:', error.message);
		console.error('[Discord] This usually means the DISCORD_TOKEN is invalid or missing');
		console.error('[Discord] Please check your environment variables on Render');
	});