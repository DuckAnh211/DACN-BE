require('dotenv').config();
const express = require('express');
const configViewEngine = require('./config/viewEngine');
const apiRoutes = require('./routes/api');
const connection = require('./config/database');
const bodyParser = require('body-parser');
const { getHomepage } = require('./controllers/homeController');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { createMediasoupWorker, handleSocket } = require('./sfu/mediasoupManager');

const app = express();
const port = process.env.PORT || 8080;
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5500', 'http://192.168.1.26:5500'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: ['http://localhost:5500', 'http://192.168.1.26:5500'],
  credentials: true
}));
//config req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

//config template engine
configViewEngine(app);

// serve static client
app.use(express.static(path.join(__dirname, 'public')));

const webAPI = express.Router();
webAPI.get("/", getHomepage);

//khai báo route
app.use('/', webAPI);
app.use('/v1/api/', apiRoutes);

(async () => {
    try {
        //using mongoose
        await connection();
        await createMediasoupWorker();

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            handleSocket(socket, io);
        });

        server.listen(port, () => {
            console.log(`Backend Nodejs App listening on port ${port}`);
        });
    } catch (error) {
        console.log(">>> Error connect to DB: ", error);
    }
})();
