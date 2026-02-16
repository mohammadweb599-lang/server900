const express = require('express');
const YouthCampController = require('../controllers/YouthCampController');
const authMiddleware = require('../Middleware/auth');

const router = express.Router();

router.use(authMiddleware());

router.get('/info', YouthCampController.getCampInfo);
router.post('/recruit', YouthCampController.recruitPlayer);
router.delete('/fire/:playerId', YouthCampController.firePlayer);

module.exports = router;
