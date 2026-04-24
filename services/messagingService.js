// services/messagingService.js
const crypto = require("crypto");

/**
 * Create or return an existing thread between two users.
 * userId = current user (user1)
 * otherUserId = other user (user2)
 */
async function createThread(db, userId, otherUserId) {
  if (!userId) {
    const err = new Error("authentication required");
    err.status = 401;
    throw err;
  }
  if (!otherUserId) {
    const err = new Error("other user id is required");
    err.status = 400;
    throw err;
  }

  // Ensure both users exist
  const u1 = await db.getAsync("SELECT id FROM users WHERE id = ?", [userId]);
  const u2 = await db.getAsync("SELECT id FROM users WHERE id = ?", [otherUserId]);

  if (!u1 || !u2) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // Check if thread already exists (in both directions)
  const existing = await db.getAsync(
    `
    SELECT id FROM threads
    WHERE (user1_id = ? AND user2_id = ?)
       OR (user1_id = ? AND user2_id = ?)
    `,
    [userId, otherUserId, otherUserId, userId]
  );

  if (existing) return existing.id;

  // Create new thread with UUID
  const threadId = crypto.randomUUID();

  await db.runAsync(
    `
    INSERT INTO threads(id, user1_id, user2_id, last_message)
    VALUES (?,?,?,?)
    `,
    [threadId, userId, otherUserId, ""]
  );

  return threadId;
}

/**
 * Start a conversation exactly like the frontend MessagingContext.
 * - If thread exists → return it
 * - Else create thread
 * - Add suggested message
 */
async function startConversationWithHost(db, userId, otherUserId, content) {
  if (!userId) {
    const err = new Error("authentication required");
    err.status = 401;
    throw err;
  }
  if (!otherUserId) {
    const err = new Error("other user id is required");
    err.status = 400;
    throw err;
  }

  // Ensure both users exist
  const u1 = await db.getAsync("SELECT id FROM users WHERE id = ?", [userId]);
  const u2 = await db.getAsync("SELECT id FROM users WHERE id = ?", [otherUserId]);

  if (!u1 || !u2) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // Check if thread already exists (in both directions)
  let thread = await db.getAsync(
    `
    SELECT * FROM threads
    WHERE (user1_id = ? AND user2_id = ?)
       OR (user1_id = ? AND user2_id = ?)
    `,
    [userId, otherUserId, otherUserId, userId]
  );

  let threadId;

  if (thread) {
    threadId = thread.id;
  } else {
    // Create new thread
    threadId = crypto.randomUUID();

    await db.runAsync(
      `
      INSERT INTO threads(id, user1_id, user2_id, last_message)
      VALUES (?,?,?,?)
      `,
      [threadId, userId, otherUserId, ""]
    );
  }

  // If no suggested message → return threadId
  if (!content) return threadId;

  // Insert message
  const messageId = crypto.randomUUID();

  await db.runAsync(
    `
    INSERT INTO messages(id, thread_id, sender_id, content)
    VALUES (?,?,?,?)
    `,
    [messageId, threadId, userId, content]
  );

  // Update thread metadata (NO unread logic)
  await db.runAsync(
    `
    UPDATE threads
    SET 
      last_message = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [content, threadId]
  );

  return threadId;
}

/**
 * List all threads for a user.
 */
async function listThreads(db, userId) {
  if (!userId) {
    const err = new Error("authentication required");
    err.status = 401;
    throw err;
  }

  const rows = await db.allAsync(
    `
    SELECT 
      t.*,
      u1.name AS user1_name, u1.picture AS user1_picture, u1.role AS user1_role,
      u2.name AS user2_name, u2.picture AS user2_picture, u2.role AS user2_role
    FROM threads t
    JOIN users u1 ON u1.id = t.user1_id
    JOIN users u2 ON u2.id = t.user2_id
    WHERE t.user1_id = ? OR t.user2_id = ?
    ORDER BY t.updated_at DESC
    `,
    [userId, userId]
  );

  return rows.map((row) => {
    const isUser1 = row.user1_id === userId;

    const otherUser = isUser1
      ? {
          id: String(row.user2_id),
          name: row.user2_name,
          picture: row.user2_picture || undefined,
          role: row.user2_role,
        }
      : {
          id: String(row.user1_id),
          name: row.user1_name,
          picture: row.user1_picture || undefined,
          role: row.user1_role,
        };

    return {
      id: row.id,
      otherUser,
      lastMessage: row.last_message || "",
      updatedAt: row.updated_at, // ⭐⭐ LA LIGNE QUI MANQUAIT ⭐⭐
    };
  });
}


/**
 * List messages for a thread.
 */
async function listMessages(db, threadId, userId) {
  if (!userId) {
    const err = new Error("authentication required");
    err.status = 401;
    throw err;
  }

  const thread = await db.getAsync(
    "SELECT * FROM threads WHERE id = ?",
    [threadId]
  );

  if (!thread) {
    const err = new Error("Thread not found");
    err.status = 404;
    throw err;
  }

  // Ensure user belongs to thread
  if (thread.user1_id !== userId && thread.user2_id !== userId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const rows = await db.allAsync(
    `
    SELECT m.*, u.name, u.picture, u.role
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.thread_id = ?
    ORDER BY m.created_at ASC
    `,
    [threadId]
  );

  return rows.map((row) => ({
    id: row.id,
    threadId: row.thread_id,
    sender: {
      id: String(row.sender_id),
      name: row.name,
      picture: row.picture || undefined,
      role: row.role,
    },
    content: row.content,
    createdAt: row.created_at,
    // ❌ plus de read
  }));
}

/**
 * Send a message in a thread.
 */
async function sendMessage(db, threadId, userId, content) {
  if (!userId) {
    const err = new Error("authentication required");
    err.status = 401;
    throw err;
  }
  if (!content) {
    const err = new Error("content is required");
    err.status = 400;
    throw err;
  }

  const thread = await db.getAsync(
    "SELECT * FROM threads WHERE id = ?",
    [threadId]
  );

  if (!thread) {
    const err = new Error("Thread not found");
    err.status = 404;
    throw err;
  }

  // Ensure user belongs to thread
  if (thread.user1_id !== userId && thread.user2_id !== userId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const messageId = crypto.randomUUID();

  await db.runAsync(
    `
    INSERT INTO messages(id, thread_id, sender_id, content)
    VALUES (?,?,?,?)
    `,
    [messageId, threadId, userId, content]
  );

  // Update thread metadata (NO unread logic)
  await db.runAsync(
    `
    UPDATE threads
    SET 
      last_message = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [content, threadId]
  );

  return { ok: true };
}

module.exports = {
  createThread,
  startConversationWithHost,
  listThreads,
  listMessages,
  sendMessage,

};
