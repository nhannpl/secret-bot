const Database = require('better-sqlite3');
const db = new Database('messages.db');

// Create the table if it doesn't exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS pending_messages (
        message_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        guild_id TEXT,
        sender_id TEXT NOT NULL,
        target_user_id TEXT NOT NULL,
        message_content TEXT NOT NULL,
        timeout_ms INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        is_dm INTEGER DEFAULT 0,
        reveal_time INTEGER DEFAULT NULL
    )
`).run();

// Migration: Attempt to add reveal_time column if it doesn't exist (for existing dbs)
try {
    db.prepare('ALTER TABLE pending_messages ADD COLUMN reveal_time INTEGER DEFAULT NULL').run();
} catch (error) {
    // Column likely already exists, ignore
}

module.exports = {
    // Add a new pending message
    addMessage: (data) => {
        const stmt = db.prepare(`
            INSERT INTO pending_messages (
                message_id, channel_id, guild_id, sender_id, 
                target_user_id, message_content, timeout_ms, 
                created_at, is_dm
            ) VALUES (
                @message_id, @channel_id, @guild_id, @sender_id, 
                @target_user_id, @message_content, @timeout_ms, 
                @created_at, @is_dm
            )
        `);
        return stmt.run(data);
    },

    // Get a message by ID
    getMessage: (messageId) => {
        return db.prepare('SELECT * FROM pending_messages WHERE message_id = ?').get(messageId);
    },

    // Mark a message as revealed
    markAsRevealed: (messageId, revealTime) => {
        return db.prepare('UPDATE pending_messages SET reveal_time = ? WHERE message_id = ?').run(revealTime, messageId);
    },

    // Delete a message (when destroyed)
    deleteMessage: (messageId) => {
        return db.prepare('DELETE FROM pending_messages WHERE message_id = ?').run(messageId);
    },

    // Get all pending messages (for startup restoration)
    getAllMessages: () => {
        return db.prepare('SELECT * FROM pending_messages').all();
    }
};
