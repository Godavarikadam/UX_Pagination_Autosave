const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middlewares/authenticate'); 


router.post('/register', authenticate('admin'), userController.registerUser);

router.post('/login', userController.loginUser);

router.get('/', authenticate('admin'), userController.getUsers);


router.get('/profile', authenticate(), userController.getUserProfile);

module.exports = router;
