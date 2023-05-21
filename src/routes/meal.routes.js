// Meal routes

const express = require('express');
const mealController = require('../controllers/meal.controller');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// UC-301: Add meal
router.post('', authController.validateToken, mealController.addMeal);

// UC-302: Update meal
router.put('/:mealId', authController.validateToken, mealController.updateMeal);

// UC-303: Get all meals
router.get('', mealController.getAllMeals);

// UC-304: Get meal with id
router.get('/:mealId', mealController.getMealWithID);

// UC-305: Delete meal
router.delete('/:mealId', authController.validateToken, mealController.deleteMeal);

// UC-401: Sign up for meal
router.post('/:mealId/participate', authController.validateToken, mealController.signUpForMeal);

// UC-402: Sign out for meal
router.delete('/:mealId/participate', authController.validateToken, mealController.signOutForMeal);

// UC-403: Get participants
router.get('/:mealId/participants', mealController.getParticipants);

// UC-404: Get participant details
router.get('/:mealId/participants/:participantId', mealController.getParticipantDetails);

module.exports = router;
