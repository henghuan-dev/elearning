let call;
const username = "参加者";
const chatLog = document.getElementById("chat-log");
const participantCount = document.getElementById("participant-count");

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("enter-button").addEventListener("click", () => {
    document.getElementById("entry-overlay").style.display = "none";
    initializeCall();
  });

  // ドラッグ移動を初期化
  makeMiniPlayerDraggable();
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
}

function updateParticipants() {
  const participants = call.participants();
  const count = Object.keys(participants).length;
  participantCount.textContent = `👥 参加者: ${count}`;

  for (const id in participants) {
    const p = participants[id];
    if (p.local || !p.tracks.video?.subscribed || !p.tracks.video.track) continue;

    const stream = new MediaStream([p.tracks.video.track]);

    const mainVideo = document.getElementById("main-video");
    if (mainVideo && !mainVideo.srcObject) {
      mainVideo.srcObject = stream;
      mainVideo.play().catch(err => console.warn("main video autoplay blocked", err));
    }

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

// 🟡 ドラッグ移動機能
function makeMiniPlayerDraggable() {
  const player = document.getElementById("mini-player");
  const handle = player.querySelector(".drag-handle");
  let offsetX = 0, offsetY = 0, isDragging = false;

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

  const end = () => { isDragging = false; };

  handle.addEventListener("mousedown", start);
  handle.addEventListener("touchstart", start);
  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move);
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}

// 🎬 プレーヤー切り替え（visible/hiddenクラスで入れ替え）
function swapPlayersByVisibility() {
  const mainIframe = document.getElementById("main-iframe");
  const mainVideo = document.getElementById("main-video");
  const miniVideo = document.getElementById("mini-video");

  const isIframeMain = mainIframe.classList.contains("visible");

  toggleVisibility(mainIframe, !isIframeMain);
  toggleVisibility(mainVideo, isIframeMain);
  toggleVisibility(miniVideo, !isIframeMain);

  // ✅ 明示的に再生
  setTimeout(() => {
    if (!isIframeMain) {
      mainVideo?.play().catch(() => {});
    } else {
      miniVideo?.play().catch(() => {});
    }
  }, 100); // 描画が切り替わった直後に再生
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
