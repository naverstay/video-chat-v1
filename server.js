const express = require("express");
const app = express();
const https = require("https");
const path = require("path");
const fs = require("fs");
// const server = require("http").Server(app);

const serverOptions = {
    key: fs.readFileSync(path.join(__dirname, "cert/localhost+2-key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert/localhost+2.pem"))
};

const server = https.createServer(serverOptions, app);

app.set("view engine", "ejs");

const io = require("socket.io")(server, {
    cors: {
        origin: "*"
    }
});

const {ExpressPeerServer} = require("peer");
const options = {debug: true};

app.use("/peerjs", ExpressPeerServer(server, options));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect(`/${crypto.randomUUID()}`);
});

app.get("/:room", (req, res) => {
    res.render("room", {roomId: req.params.room});
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, userName) => {
        socket.join(roomId);
        setTimeout(() => {
            io.to(roomId).emit("userConnected", userId, userName);
        }, 1000);

        socket.on("disconnect", () => {
            io.to(roomId).emit("userDisconnected", userId, userName);
        });

        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName, userId);
        });
    });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on https://0.0.0.0:${PORT}`);
});
