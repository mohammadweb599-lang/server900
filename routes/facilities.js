const express = require('express');
const FacilityController = require('../controllers/FacilityController');
const authMiddleware = require('../Middleware/auth');

const router = express.Router();

router.use(authMiddleware());

router.get('/', FacilityController.getFacilities);
router.post('/collect/:facilityType', FacilityController.collectCoins);
router.post('/upgrade/:facilityType', FacilityController.upgradeFacility);

module.exports = router;
