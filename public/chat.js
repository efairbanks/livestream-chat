const streamKey = window.location.href.slice(8).split("/")[1];

// establish connection
const socket = io.connect("/", {
  query: {
    "streamKey": streamKey
  }
});

// query DOM
const message = document.getElementById("message");
const username = document.getElementById("username");
const btn = document.getElementById("send");
const output = document.getElementById("output");
const feedback = document.getElementById("feedback");
const chatContainer = document.getElementById("chat-window");
const playerContainer = document.getElementById("player-container");
let posterImages;

const wasRecentlyTypingByUsername = {};
let userCount = 1;

await fetch("/config?page=chat").then(async (data) => {
  const config = await data.json();
  posterImages = config.POSTER_IMAGES.split(';');
  appendVideoSourceToPlayerDiv(config.STREAM_HOST, streamKey);
  var player = videojs("#player", { autoplay: true });
  document.title = config.CHAT_TITLE ?? "Movie Lobby";
});

function appendVideoSourceToPlayerDiv(host, streamKey) {
  let posterImage;
  let posterCount = posterImages.length;
  if (posterImages != null && posterCount > 0) {
    posterImage = posterImages[Math.floor(Math.random() * posterCount)]
  }

  playerContainer.innerHTML = `
  <video liveui=true poster="${posterImage}"  id="player" class="video-js vjs-default-skin vjs-big-play-centered" controls preload="auto">
    <source src="${host}/hls/${streamKey}.m3u8" type="application/x-mpegURL" />
  </video>
  `;
}

function sendMessage() {
  socket.emit("chat", {
    stream: streamKey,
    message: message.value,
    username: username.value,
    createdAt: new Date(),
    id: new Date().getTime(),
  });
  message.value = "";
}

function clearIsTyping(isTypingElement, username) {
  if (!wasRecentlyTypingByUsername[username]) {
    feedback.innerHTML = feedback.innerHTML.replace(isTypingElement, "");
  } else {
    setTimeout(() => {
      clearIsTyping(isTypingElement, username);
      wasRecentlyTypingByUsername[username] = false;
    }, 2 * 1000);
  }
}

// emit events
btn.addEventListener("click", () => {
  sendMessage();
});

message.addEventListener("keypress", (e) => {
  if (e.key == "Enter") {
    sendMessage();
  } else {
    socket.emit("typing", {
      username: username.value,
      stream: streamKey,
    });
  }
});

// listen for events
socket.on("chat", (data) => {
  if (data.stream === streamKey) {
    appendMessage(data);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});

socket.on("typing", (typingEvent) => {
  if (typingEvent.stream === streamKey) {
    const isTypingElement = `<p><em>${typingEvent.username} is typing a message...</em></p>`;

    if (feedback.innerHTML.indexOf(isTypingElement) == -1) {
      wasRecentlyTypingByUsername[typingEvent] = false;
      feedback.innerHTML += isTypingElement;

      setTimeout(() => {
        clearIsTyping(isTypingElement, typingEvent);
      }, 5 * 1000);
    } else {
      wasRecentlyTypingByUsername[typingEvent] = true;
    }
  }
});
socket.on("userJoined", (count) => {
  userCountChangeEvent(count, 'Joined');
});

socket.on("userLeft", (count) => {
  userCountChangeEvent(count, 'Left');
});

// load message history
fetch(`/messages?streamKey=${streamKey}`).then(async (data) => {
  const messages = await data.json();
  console.log(`Got messages maybe? ${JSON.stringify(messages)}`)
  for (const message of messages) appendMessage(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

function appendMessage(data) {
  output.innerHTML += extremelyLongMessagePreview(data);
}

function updateViewerCount(userCount) {
  const viewCountDisplay = document.getElementById("viewer-count-display");
  const friendString = userCount == 1 ? "friend" : "friends";
  viewCountDisplay.textContent = ` ${userCount} ${friendString} watching!`;
}

function userCountChangeEvent(count, eventType) {
  console.log(`Received count value of ${count}, previous was ${userCount}`);
  userCount = count;
  updateViewerCount(userCount);
  console.log(`User ${eventType}! current user count: ${userCount}`);
}
