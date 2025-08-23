const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const user = prompt("Enter your name");
const users = [];

const peer = new Peer({
  debug: 4,
  secure: true
});

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, user, stream);

    peer.on("call", (call) => {
      console.log('someone call me', call);
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        console.log('userVideoStream', userVideoStream);

        if (!users.contains(userVideoStream.id)) {
          users.push(userVideoStream.id)
          addVideoStream(video, 'stream-user', userVideoStream);
        }
      });
    });

    socket.on("userConnected", (userId, userName) => {
      connectToNewUser(userId, userName, stream);
    });
  });

const connectToNewUser = (userId, userName, stream) => {
  console.log('I call someone', userId, userName);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userName, userVideoStream);
  });
};

peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, userName, stream) => {
  let added = false;
  const videoBlock = document.createElement("div");
  const videoData = document.createElement("div");
  video.srcObject = stream;
  videoBlock.className = "video-block";
  videoData.className = "video-data";
  videoData.innerText = userName;

  video.addEventListener("loadedmetadata", (e) => {
    console.log('loadedmetadata', e);

    if (!added) {
      added = true;
      video.play();
      videoBlock.append(video);
      videoBlock.append(videoData);
      videoGrid.append(videoBlock);
    }
  });

  video.addEventListener("emptied", (e) => {
    console.log('emptied', e);
    videoBlock.remove();
  });

  video.addEventListener("ended", (e) => {
    console.log('ended', e);
    videoBlock.remove();
  });

  video.addEventListener("error", (e) => {
    console.log('error', e);
    videoBlock.remove();
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    console.log('send message', text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  let html = "";

  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  let html = "";

  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName
    }</span> </b>
        <span>${message}</span>
    </div>`;
});
