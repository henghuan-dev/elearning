// online.js
let call;
const username = "参加者";
const chatLog = document.getElementById("chat-log");
const participantCount = document.getElementById("participant-count");
const iframe = document.querySelector("iframe");

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("enter-button").addEventListener("click", () => {
    document.getElementById("entry-overlay").style.display = "none";
    initializeCall();
  });
});

function initializeCall() {
  call = Daily.createCallObject({
    userName: username,
    audioSource: false,
    videoSource: false
  });

  call.join({ url: "https://catachi.daily.co/catachi" });

  call.on("joined-meeting", updateParticipants);
  call.on("participant-joined", updateParticipants);
  call.on("participant-updated", updateParticipants);
  call.on("participant-left", updateParticipants);
  call.on("track-started", updateParticipants);
  call.on("app-message", (e) => {
    const sender = e.from.user_name || "参加者";
    appendChatLog(sender, e.data.text);
  });

  makeMiniPlayerDraggable();
  addSwapButtonToMiniPlayer();
}

function updateParticipants() {
  const participants = call.participants();
  const count = Object.keys(participants).length;
  participantCount.textContent = `👥 参加者: ${count}`;

  const container = document.getElementById("remote-videos");
  container.innerHTML = "";

  for (const id in participants) {
    const p = participants[id];
    if (p.local || !p.tracks.video?.subscribed || !p.tracks.video.track) continue;

    const stream = new MediaStream([p.tracks.video.track]);
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    video.play().catch((err) => {
      console.warn("autoplay block:", err);
    });

    container.appendChild(video);

    const mini = document.getElementById("mini-player");
    if (!mini.querySelector("video")) {
      const cloned = video.cloneNode();
      cloned.srcObject = video.srcObject;
      cloned.autoplay = true;
      cloned.playsInline = true;
      cloned.muted = true;
      cloned.play().catch((err) => {
        console.warn("cloned autoplay block:", err);
      });
      mini.appendChild(cloned);
    }
  }
}

function toggleAudio() {
  const isMuted = call.localAudio();
  call.setLocalAudio(!isMuted);
}

function leaveCall() {
  call.leave();
  location.reload();
}

function sendChatMessage(event) {
  event.preventDefault();
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (text !== "") {
    call.sendAppMessage({ text });
    appendChatLog("自分", text);
    input.value = "";
  }
}

function appendChatLog(sender, message) {
  const msg = document.createElement("div");
  msg.textContent = `${sender}: ${message}`;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function makeMiniPlayerDraggable() {
  const player = document.getElementById("mini-player");
  const handle = player.querySelector(".drag-handle");
  let offsetX, offsetY, isDragging = false;

  handle.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - player.offsetLeft;
    offsetY = e.clientY - player.offsetTop;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    player.style.left = `${e.clientX - offsetX}px`;
    player.style.top = `${e.clientY - offsetY}px`;
    player.style.right = "auto";
    player.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function swapPlayers() {
  const iframe = document.querySelector("iframe");
  const video = document.querySelector("#mini-player video, .player-block video");

  if (!iframe || !video) return;

  const iframeBlock = iframe.closest(".player-block, .mini-player");
  const videoBlock = video.closest(".player-block, .mini-player");

  iframeBlock.replaceChild(video, iframe);
  videoBlock.appendChild(iframe);

  const iframeLabel = iframeBlock.querySelector(".block-label, .drag-handle");
  const videoLabel = videoBlock.querySelector(".block-label, .drag-handle");

  const isMain = iframeBlock.dataset.role === "main";

  if (isMain) {
    iframeBlock.dataset.role = "sub";
    videoBlock.dataset.role = "main";
    if (iframeLabel) iframeLabel.textContent = "👨‍🏫 講師映像";
    if (videoLabel) videoLabel.textContent = "🎬 教材映像";
  } else {
    iframeBlock.dataset.role = "main";
    videoBlock.dataset.role = "sub";
    if (iframeLabel) iframeLabel.textContent = "🎬 教材映像";
    if (videoLabel) videoLabel.textContent = "👨‍🏫 講師映像";
  }
}

function addSwapButtonToMiniPlayer() {
  const mini = document.getElementById("mini-player");
  const swap = document.createElement("button");
  swap.textContent = "🔄";
  swap.className = "swap-btn";
  swap.style.position = "absolute";
  swap.style.bottom = "8px";
  swap.style.right = "8px";
  swap.style.zIndex = "999";
  swap.style.padding = "0.4rem 0.6rem";
  swap.style.fontSize = "1rem";
  swap.style.background = "#6366f1";
  swap.style.color = "#fff";
  swap.style.border = "none";
  swap.style.borderRadius = "8px";
  swap.style.cursor = "pointer";
  swap.onclick = swapPlayers;
  mini.appendChild(swap);
}
