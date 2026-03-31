const fs = require('fs');
const path = require('path');
const router = require('express').Router();

router.get('/ping', (_, res) => res.json({ service: 'notification-service', message: 'pong' }));

const files = fs.readdirSync(__dirname)
.filter(f => f !== 'index.js' && f.endsWith('.js'));

for (const file of files) {
const sub = require(path.join(__dirname, file));
router.use(sub.router || sub);
}

module.exports = router;
