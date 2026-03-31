const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', require('./routes'));
app.get('/health', (_, res) => res.json({ service: 'exam-service', ok: true }));

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => console.log('exam-service listening on ' + PORT));
