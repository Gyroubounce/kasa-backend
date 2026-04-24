// controllers/messagingController.js

const messagingService = require("../services/messagingService");

async function startConversation(req, res, next) {
  try {
    const db = req.app.locals.db;
    const userId = req.user?.id;
    const { otherUserId, content } = req.body;

    const threadId = await messagingService.startConversationWithHost(
      db,
      userId,
      otherUserId,
      content
    );

    res.json({ threadId });
  } catch (err) {
    next(err);
  }
}

async function listThreads(req, res, next) {
  try {
    const db = req.app.locals.db;
    const userId = req.user?.id;

    const threads = await messagingService.listThreads(db, userId);
    res.json(threads);
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const db = req.app.locals.db;
    const userId = req.user?.id;
    const threadId = req.params.id;

    const messages = await messagingService.listMessages(db, threadId, userId);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const db = req.app.locals.db;
    const userId = req.user?.id;
    const threadId = req.params.id;
    const { content } = req.body;

    const result = await messagingService.sendMessage(
      db,
      threadId,
      userId,
      content
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startConversation,
  listThreads,
  listMessages,
  sendMessage,
};
