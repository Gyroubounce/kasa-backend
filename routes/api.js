const express = require('express');
const router = express.Router();

const dbReady = require('../middlewares/dbReady');
const { requireRole, requireAdmin, requireSelfOrAdmin, requireAuth } = require('../middlewares/auth');
const properties = require('../controllers/propertiesController');
const users = require('../controllers/usersController');
const ratings = require('../controllers/ratingsController');
const favorites = require('../controllers/favoritesController');
const uploads = require('../controllers/uploadsController');

// Messaging
const messaging = require('../controllers/messagingController');

// Ensure DB is ready for all API routes
router.use(dbReady);

// Properties
router.get('/properties', properties.list);
router.get('/properties/:id', properties.getById);
router.post('/properties', requireRole(['owner','admin']), properties.create);
router.patch('/properties/:id', requireRole(['owner','admin']), properties.update);
router.delete('/properties/:id', requireRole(['owner','admin']), properties.remove);

// Users
router.get('/users', requireAdmin, users.list);
router.get('/users/:id', requireSelfOrAdmin('id'), users.getById);
router.post('/users', requireAdmin, users.create);
router.patch('/users/:id', requireSelfOrAdmin('id'), users.update);

// Ratings for properties
router.get('/properties/:id/ratings', ratings.listForProperty);
router.post('/properties/:id/ratings', ratings.add);

// Favorites
router.post('/properties/:id/favorite', requireAuth, favorites.addForProperty);
router.delete('/properties/:id/favorite', requireAuth, favorites.removeForProperty);
router.get('/users/:id/favorites', requireSelfOrAdmin('id'), favorites.listForUser);

// Uploads
router.post('/uploads/image', requireRole(['owner','admin']), uploads.uploadImage);

// Delete one or multiple uploaded images by filename or URL
router.delete('/uploads/images', requireRole(['owner','admin']), uploads.deleteImages);


// Démarrer une conversation (HostCard)
router.post('/messaging/start', requireAuth, messaging.startConversation);

// Lister les threads de l'utilisateur
router.get('/messaging/threads', requireAuth, messaging.listThreads);

// Lister les messages d'un thread
router.get('/messaging/threads/:id/messages', requireAuth, messaging.listMessages);

// Envoyer un message dans un thread
router.post('/messaging/threads/:id/messages', requireAuth, messaging.sendMessage);


module.exports = router;
