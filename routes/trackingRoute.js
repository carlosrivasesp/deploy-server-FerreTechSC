const express = require('express');
const router = express.Router();

const { getTrackingByCode } = require('../controllers/trackingController');

router.get('/:codigo', getTrackingByCode);

module.exports = router;