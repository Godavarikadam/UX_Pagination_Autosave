const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');


router.get('/', activityController.getActivityLogs);

router.post('/:id/retry', activityController.retryActivity);

module.exports = router;
