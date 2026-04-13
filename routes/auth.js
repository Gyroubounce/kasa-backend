const express = require('express');
const router = express.Router();

const dbReady = require('../middlewares/dbReady');
const { 
  doRegister, 
  doLogin, 
  doRequestReset, 
  doResetPassword, 
  doMe, 
  doLogout 
} = require('../controllers/authController');

const { requireAuth } = require('../middlewares/auth');

// Ensure DB is ready for all auth routes
router.use(dbReady);

// Auth endpoints
router.post('/register', doRegister);
router.post('/login', doLogin);
router.post('/request-reset', doRequestReset);
router.post('/reset-password', doResetPassword);

// NEW: Get current user from cookie
router.get('/me', requireAuth, doMe);

// NEW: Logout (clear cookie)
router.post('/logout', doLogout);

module.exports = router;
