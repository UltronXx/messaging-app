const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes (require authentication)
router.get('/profile', auth, userController.getProfile);
router.get('/contacts', auth, userController.getContacts);
router.post('/contacts', auth, userController.addContact);
router.get('/search', auth, userController.searchUsers);

module.exports = router;
