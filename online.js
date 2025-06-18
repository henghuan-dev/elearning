let call;
const username = "参加者";

const teacherVideo = document.getElementById("teacher-video");
const materialVideo = document.getElementById("material-video");

const mainWrapper = document.getElementById("main-wrapper");
const miniWrapper = document.getElementById("mini-wrapper");
const mainLabel = document.getElementById("main-label");
const miniLabel = document.getElementById("mini-label");
const participantCount = document.getElementById("participant-count");
const chatLog = document.getElementById("chat-log");

window.addEventListener("DOMContentLoaded", () => {
  initializeCall();
  makeMiniPlayerDraggable();

  // 初期配置
  mainWrapper.appendChild(materialVideo);
  miniWrapper.appendChild(teacherVideo);
  mainLabel.textContent = "🎬 教材映像";
  miniLabel.textContent = "👨‍🏫 講師映像";
});

function initializeCall() {
  call = Daily.createCallObject({
    userName: username,
    audioSource: false,
    videoSource: false
  });

  call.join({ url: "https://catachi.daily.co/catachi" });

  call.on("joined-meeting", () => {
    updateParticipants();
    setTimeout(() => leaveCall(), 5 * 60 * 1000);
  });

  call.on("participant-joined", updateParticipants);
  call.on("participant-updated", updateParticipants);
  call.on("participant-left", updateParticipants);
  call.on("track-started", updateParticipants);

  call.on("app-message", (e) => {
    const sender = e.from.user_name || "参加者";
    appendChatLog(sender, e.data.text);
  });
}

function updateParticipants() {
  const participants = call.participants();
  participantCount.textContent = `👥 参加者: ${Object.keys(participants).length}`;

  for (const id in participants) {
    const p = participants[id];
    if (p.local || !p.tracks.video?.subscribed || !p.tracks.video.track) continue;

    const stream = new MediaStream([p.tracks.video.track]);
    teacherVideo.srcObject = stream;
    teacherVideo.play().catch(err => console.warn("teacher video play error", err));
    break;
  }
}

function leaveCall() {
  call.leave();
  alert("通話を終了しました。再入室するにはページをリロードしてください。");
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

// 🔁 メイン・サブ入れ替え
function swapPlayers() {
  const isMaterialInMain = mainWrapper.contains(materialVideo);
  const materialWasPaused = materialVideo.paused;
  const teacherWasPaused = teacherVideo.paused;

  if (isMaterialInMain) {
    miniWrapper.appendChild(materialVideo);
    mainWrapper.appendChild(teacherVideo);
    mainLabel.textContent = "👨‍🏫 講師映像";
    miniLabel.textContent = "🎬 教材映像";
  } else {
    mainWrapper.appendChild(materialVideo);
    miniWrapper.appendChild(teacherVideo);
    mainLabel.textContent = "🎬 教材映像";
    miniLabel.textContent = "👨‍🏫 講師映像";
  }

  // ⛔ 自動再生を抑制し、再生状態を元のまま維持
  if (!materialWasPaused) {
    materialVideo.play().catch(() => {});
  } else {
    materialVideo.pause();
  }

  if (!teacherWasPaused) {
    teacherVideo.play().catch(() => {});
  } else {
    teacherVideo.pause();
  }
}


// 🖱️ ドラッグ機能
function makeMiniPlayerDraggable() {
  const player = document.getElementById("mini-container");
  const handle = player.querySelector(".drag-handle");
  let offsetX = 0, offsetY = 0, isDragging = false;

  const start = (e) => {
    isDragging = true;
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    offsetX = clientX - player.offsetLeft;
    offsetY = clientY - player.offsetTop;
    e.preventDefault();
  };

  const move = (e) => {
    if (!isDragging) return;
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    player.style.left = `${clientX - offsetX}px`;
    player.style.top = `${clientY - offsetY}px`;
    player.style.right = "auto";
    player.style.bottom = "auto";
  };

  const end = () => { isDragging = false; };

  handle.addEventListener("mousedown", start);
  handle.addEventListener("touchstart", start);
  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move);
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}
