// Authentication routes

const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// UC-101: Login
router.post('', authController.login);

module.exports = router;
