const express = require('express');
const userController = require('../controllers/user.controller');
const router = express.Router();

// UC-201
router.post('', userController.createUser);

// UC-202
router.get('', userController.getAllUsers);

// UC-203
router.get('/profile', userController.getProfile);

// UC-204
router.get('/:userId', userController.getUserWithID);

// UC-205
router.put('/:userId', userController.updateUser);

// UC-206
router.delete('/:userId', userController.deleteUser);

module.exports = router;
