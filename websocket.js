const { messages, server } = require("./server");
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
let userCount = 0;

io.on("connection", (clientSocket) => {
  userCount++;
  console.log("Made socket connection", clientSocket.id);
  clientSocket.emit("userJoined", userCount);
  clientSocket.broadcast.emit("userJoined", userCount);

  clientSocket.on("chat", async (data) => {
    await setEmbed(data);

    data.html = toHTML(textEmoji(data.message));

    if (messages[data.stream] == null) {
      messages[data.stream] = new Array();
    }
    const newIndex = messages[data.stream].push(data) - 1;
    setTimeout(() => messages[data.stream].splice(newIndex, 1), 5 * 60 * 1000);

    io.sockets.emit("chat", data);
  });

  clientSocket.on("typing", (data) => {
    clientSocket.broadcast.emit("typing", data);
  });

  clientSocket.on("disconnect", () => {
    userCount--;

    if (userCount < 0) userCount = 0;

    clientSocket.broadcast.emit("userLeft", userCount);
  });
});

async function setEmbed(data) {
  const containsURL = /([https://].*)/.test(data.message);
  if (containsURL) {
    try {
      const targetUrl = /([https://].*)/.exec(data.message)[0];
      const { body: html, url } = await got(targetUrl);

      data.embed = await metascraper({ html, url });
    } catch {}
  }
}
