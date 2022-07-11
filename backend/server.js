require('dotenv').config();

const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const app = express();

app.use(express.static('public'))


// ------config------
const server_config = {
    HTTPS: process.env.HTTPS,

    SSL_KEY: process.env.SSL_KEY,
    SSL_CRT: process.env.SSL_CRT,
    SSL_CAB: process.env.SSL_CAB,
}

const ports = {
    server : process.env.PORT,
}
// ------config------


// -------- SSL websocket port -------------
let server;

if (server_config.HTTPS == 'https') {

	const key = fs.readFileSync(server_config.SSL_KEY);
	const cert = fs.readFileSync(server_config.SSL_CRT);
	const ca = fs.readFileSync(server_config.SSL_CAB);

    const options = {
        key,
        cert,
        ca: [ca, cert],
        requestCert: false,
        rejectUnauthorized: false
    }
    server = https.createServer(options, app);
}
else{
	server = http.createServer(app)
}

// -------- SSL -------------


// ----------- socket -------------
const io = require("socket.io")(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: [ "GET", "POST" ]
	}
})

io.on("connection", (socket) => {
	socket.emit("me", socket.id)

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})
})
// ----------- socket -------------



// -------- ROUTE -------------
app.get("/", (req, res) => { res.send('running...'); });




server.listen(ports.server, () => console.log(`socket is running on port ${ports.server}`))

