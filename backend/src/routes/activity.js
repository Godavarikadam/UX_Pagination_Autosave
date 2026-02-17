// const express = require('express');
// const router = express.Router();
// const activityController = require('../controllers/activityController');


// router.get('/', activityController.getActivityLogs);

// router.post('/:id/retry', activityController.retryActivity);

// module.exports = router;


const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authenticate = require('../middlewares/auth'); // Ensure this matches your file name

// VIEW LOGS: Accessible by Admin, Editor, and Viewer
// This allows the Viewer to perform their primary function: monitoring.
router.get('/', authenticate(['admin', 'editor', 'viewer']), activityController.getActivityLogs);

// RETRY ACTIVITY: Restricted to Admin and Editor
// Viewers should not be able to re-trigger failed processes.
router.post('/:id/retry', authenticate(['admin', 'editor']), activityController.retryActivity);

module.exports = router;