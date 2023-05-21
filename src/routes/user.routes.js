// User routes

const express = require('express');
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// UC-201: Register as new user
router.post('', userController.createUser);

// UC-202: Get users overview
router.get('', userController.getAllUsers);

// UC-203: Get user profile
router.get('/profile', authController.validateToken, userController.getProfile);

// UC-204: Get user with id
router.get('/:userId', authController.validateToken, userController.getUserWithID);

// UC-205: Update user
router.put('/:userId', authController.validateToken, userController.updateUser);

// UC-206: Delete user
router.delete('/:userId', authController.validateToken, userController.deleteUser);

module.exports = router;
