# 🔒 Secret Bot

Your messages are kept secret! A Discord bot for sending self-destructing secret messages.

## ✨ Features

- **Self-Destruct Channel Messages**: Send messages in channels that delete after being read
- **Self-Destruct DMs**: Send private messages that automatically delete after being viewed
- **Custom Timeouts**: Set custom deletion times (seconds, minutes, hours, days)
- **Secure Access**: Only the intended recipient can reveal the message
- **Visual Countdown**: Shows a countdown before message destruction

## 🚀 Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd secret-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the bot**
   ```bash
   cp config.json.example config.json
   ```
   
   Edit `config.json` and adjust settings as needed:
   - `defaultTimeout`: Default time (in seconds) before messages self-destruct (default: 10)

4. **Set up your environment**
   Create a `.env` file with your Discord bot token and other credentials

5. **Deploy commands**
   ```bash
   node deploy-commands.js
   ```

6. **Run the bot**
   ```bash
   node index.js
   ```

## 📝 Available Commands

### `/self-destruct-channel-message`
Send a message in the current channel that will be deleted after the receiver reads it.

**Options:**
- `user` (required): The intended receiver
- `message` (required): The message to send
- `seconds` (optional): Timeout in seconds
- `minutes` (optional): Timeout in minutes
- `hours` (optional): Timeout in hours
- `days` (optional): Timeout in days

### `/self-destruct-dm`
Send a DM that will be deleted after the receiver reads it.

**Options:**
- `user` (required): The user to DM
- `message` (required): The message content
- `seconds` (optional): Timeout in seconds
- `minutes` (optional): Timeout in minutes
- `hours` (optional): Timeout in hours
- `days` (optional): Timeout in days

## ⚙️ Configuration

The bot uses `config.json` for configuration (not tracked in git):

```json
{
    "defaultTimeout": 10
}
```

**Note:** `config.json` is gitignored to prevent accidentally committing sensitive configuration. Use `config.json.example` as a template.

## 🛡️ How It Works

1. Sender creates a self-destruct message with a custom timeout
2. Only the intended recipient can click the "Reveal" button
3. Once revealed, the message remains visible for the specified timeout
4. A countdown shows the remaining time
5. The message automatically deletes when the timer expires

## ⚠️ Important Notes

- Messages can be opened at any time before the timeout expires
- The timeout countdown only starts **after** the message is revealed
- If a message is never opened, it will expire and become unreadable
- Maximum recommended timeout: A few hours (for very long timeouts, consider database storage)

## 🔧 Technical Details

- Built with Discord.js
- Uses message component collectors for button interactions
- Automatic cleanup of expired messages
- Ephemeral notifications to preserve privacy
