const { userCountsByStreamKey, messagesByStreamKey, server } = require("./server");
const socket = require("socket.io");
const got = require("got");
const { toHTML } = require("discord-markdown");
const { textEmoji } = require("markdown-to-text-emoji");

const metascraper = require("metascraper")([
  require("metascraper-description")(),
  require("metascraper-image")(),
  require("metascraper-title")(),
  require("metascraper-url")(),
]);

const io = socket(server);

io.on("connection", (clientSocket) => {
  const streamKey = clientSocket.handshake.query.streamKey;

  clientSocket.join(streamKey);
  incrementUserCount(streamKey);

  console.log("Made socket connection", clientSocket.id);
  io.to(streamKey).emit("userJoined", userCountsByStreamKey[streamKey]);

  clientSocket.on("chat", async (data) => {
    await setEmbed(data);

    data.html = toHTML(textEmoji(data.message));

    if (messagesByStreamKey[data.stream] == null) {
      messagesByStreamKey[data.stream] = new Array();
    }
    const newIndex = messagesByStreamKey[data.stream].push(data) - 1;
    setTimeout(() => messagesByStreamKey[data.stream].splice(newIndex, 1), 5 * 60 * 1000);

    io.sockets.emit("chat", data);
  });

  clientSocket.on("typing", (data) => {
    clientSocket.broadcast.emit("typing", data);
  });

  clientSocket.on("disconnect", () => {
    decrementUserCount(streamKey);
    clientSocket.to(streamKey).broadcast.emit("userLeft", userCountsByStreamKey[streamKey]);
  });
});

function incrementUserCount(streamKey) {
  if (userCountsByStreamKey[streamKey] == null) {
    userCountsByStreamKey[streamKey] = 1;
  }
  else {
    userCountsByStreamKey[streamKey]++;
  }
}

function decrementUserCount(streamKey) {
  userCountsByStreamKey[streamKey]--;

  if (userCountsByStreamKey[streamKey] < 0) userCountsByStreamKey[streamKey] = 0;
}

async function setEmbed(data) {
  const containsURL = /([https://].*)/.test(data.message);
  if (containsURL) {
    try {
      const targetUrl = /([https://].*)/.exec(data.message)[0];
      const { body: html, url } = await got(targetUrl);

      data.embed = await metascraper({ html, url });
    } catch { }
  }
}
