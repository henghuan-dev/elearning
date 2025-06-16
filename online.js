let call;
const username = "参加者";
const chatLog = document.getElementById("chat-log");
const participantCount = document.getElementById("participant-count");

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

  call.on("joined-meeting", () => {
    updateParticipants();
    setTimeout(() => {
      leaveCall();
    }, 5 * 60 * 1000);
  });

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

  for (const id in participants) {
    const p = participants[id];
    if (p.local || !p.tracks.video?.subscribed || !p.tracks.video.track) continue;

    const stream = new MediaStream([p.tracks.video.track]);

    // メイン用
    const mainVideo = document.getElementById("main-video");
    if (mainVideo && !mainVideo.srcObject) {
      mainVideo.srcObject = stream;
      mainVideo.play().catch(err => console.warn("main video autoplay blocked", err));
    }

    // サブ用
    const miniVideo = document.getElementById("mini-video");
    if (miniVideo && !miniVideo.srcObject) {
      miniVideo.srcObject = stream;
      miniVideo.play().catch(err => console.warn("mini video autoplay blocked", err));
    }
  }
}

function leaveCall() {
  call.leave();
  document.getElementById("mini-player").style.display = "none";
  document.getElementById("exit-button").textContent = "再入室";
  document.getElementById("exit-button").onclick = rejoinCall;
}

function rejoinCall() {
  document.getElementById("mini-player").style.display = "block";
  document.getElementById("exit-button").textContent = "退出";
  document.getElementById("exit-button").onclick = leaveCall;
  initializeCall();
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

  const start = (e) => {
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    offsetX = clientX - player.offsetLeft;
    offsetY = clientY - player.offsetTop;
    e.preventDefault();
  };

  const move = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    player.style.left = `${clientX - offsetX}px`;
    player.style.top = `${clientY - offsetY}px`;
    player.style.right = "auto";
    player.style.bottom = "auto";
  };

  const end = () => {
    isDragging = false;
  };

  handle.addEventListener("mousedown", start);
  handle.addEventListener("touchstart", start);
  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move);
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}

// 🎬 プレーヤー切り替え（DOMを動かさず表示のみ）
function swapPlayersByVisibility() {
  const mainIframe = document.getElementById("main-iframe");
  const mainVideo = document.getElementById("main-video");
  const miniIframe = document.getElementById("mini-iframe");
  const miniVideo = document.getElementById("mini-video");

  const isIframeMain = mainIframe.classList.contains("visible");

  // 表示の切り替え（DOM構造は触らない）
  toggleVisibility(mainIframe, !isIframeMain);
  toggleVisibility(mainVideo, isIframeMain);
  toggleVisibility(miniIframe, isIframeMain);
  toggleVisibility(miniVideo, !isIframeMain);

  // 再生の保証
  if (!isIframeMain) mainVideo.play().catch(() => {});
  else miniVideo.play().catch(() => {});

  // ラベル更新
  const mainLabel = document.querySelector('.player-block .block-label');
  const miniLabel = document.querySelector('#mini-player .drag-handle');
  if (mainLabel) {
    mainLabel.textContent = isIframeMain ? "👨‍🏫 講師映像" : "🎬 教材映像";
  }
  if (miniLabel) {
    miniLabel.textContent = isIframeMain ? "🎬 教材映像" : "👨‍🏫 講師映像";
  }
}
function toggleVisibility(element, show) {
  if (show) {
    element.classList.add("visible");
    element.classList.remove("hidden");
  } else {
    element.classList.add("hidden");
    element.classList.remove("visible");
  }
}
function addSwapButtonToMiniPlayer() {
  const mini = document.getElementById("mini-player");
  if (mini.querySelector(".swap-btn")) return;

  const swap = document.createElement("button");
  swap.className = "swap-btn";
  swap.innerHTML = `<i class="fas fa-right-left"></i>`;
  swap.onclick = swapPlayersByVisibility;

  mini.appendChild(swap);
}
