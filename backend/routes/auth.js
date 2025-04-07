// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas - requieren autenticación
router.get('/me', authMiddleware, authController.getMe);
router.put('/update', authMiddleware, authController.updateUser);
router.put('/change-password', authMiddleware, authController.changePassword);
router.get('/search', authMiddleware, authController.searchUsers);
router.delete('/delete', authMiddleware, authController.deleteAccount);


// Buscar usuarios
router.get('/search', authMiddleware, authController.searchUsers);

module.exports = router;