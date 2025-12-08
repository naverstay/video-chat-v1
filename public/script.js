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
    showChat.classList.remove("__indicator");
});

const userId = crypto.randomUUID() + "";
const userName = prompt("Enter your name") || userId.split("-")[1];
let users = [userId];
let peerId = "";

const peer = new Peer({
    debug: 0, // 4
    secure: true
});

let myVideoStream;

const getScrollbarWidth = () => {
    // Creating invisible container
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll"; // forcing scrollbar to appear
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement("div");
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
};

const appHeight = () => {
    const doc = document.documentElement;
    const sab =
        parseInt(
            getComputedStyle(document.documentElement).getPropertyValue("--sab")
        ) || 0;
    doc.style.setProperty(
        "--app-height",
        `${Math.max(300, window.innerHeight - 1 - sab)}px`
    );
    doc.style.setProperty("--app-scroll-size", getScrollbarWidth() + "px");
};

const attachCallHandlers = (call, video, name = "unknown", id = "") => {
    call.on("stream", (userVideoStream) => {
        console.log('userVideoStream', id, users);

        if (!users.includes(id)) {
            addVideoStream(wrapVideoStream(video, name, userVideoStream, id));
            users.push(id)
        }
    });

    call.on("close", () => {
        console.log(`Call with ${name} closed`);
        // video.remove();
    });

    call.on("error", (err) => {
        console.error(`Error in call with ${name}:`, err);
        // video.remove();
    });
};

navigator.mediaDevices
    .getUserMedia({
        audio: true,
        video: true
    })
    .then((stream) => {
        stream.getAudioTracks().forEach(track => {
            track.enabled = false;
        });

        stream.getVideoTracks().forEach(track => {
            track.enabled = false;
        });

        myVideoStream = stream;
        addVideoStream(wrapVideoStream(myVideo, userName, stream, userId));

        peer.on("call", (call) => {
            console.log('someone call me', call);
            call.answer(stream);
            const video = document.createElement("video");
            const userName = call?.metadata?.username ?? "stream-user";
            const userId = call?.metadata?.userid ?? "stream-user-id";

            attachCallHandlers(call, video, userName, userId);
        });

        socket.on("userConnected", (userId, userName) => {
            connectToNewUser(userId, userName, stream);
        });

        socket.on("userDisconnected", (userId) => {
            const videoBlock = document.getElementById("user-" + userId);

            users = users.filter(u => u !== userId);

            if (videoBlock) {
                videoBlock.remove();
            }
        });
    });

const connectToNewUser = (userId, userName, stream) => {
    console.log('I call someone', userId, userName);
    const call = peer.call(userId, stream, {
        metadata: {username: userName, userid: userId}
    });
    const video = document.createElement("video");

    attachCallHandlers(call, video, userName, userId);
};

const updateVideoButton = (toggle = false) => {
    if (myVideoStream.getVideoTracks().length > 0 && toggle) {
        myVideoStream.getVideoTracks()[0].enabled = !myVideoStream.getVideoTracks()[0].enabled;
    }

    const enabled = myVideoStream.getVideoTracks().length > 0 && myVideoStream.getVideoTracks()[0].enabled;
    let html = "";

    if (!enabled) {
        html = `<i class="fas fa-video-slash"></i>`;
        stopVideo.classList.add("background__red");
        stopVideo.innerHTML = html;
    } else {
        html = `<i class="fas fa-video"></i>`;
        stopVideo.classList.remove("background__red");
        stopVideo.innerHTML = html;
    }
};

const updateSoundButton = (toggle = false) => {
    if (myVideoStream.getAudioTracks().length > 0 && toggle) {
        myVideoStream.getAudioTracks()[0].enabled = !myVideoStream.getAudioTracks()[0].enabled;
    }

    const enabled = myVideoStream.getAudioTracks().length > 0 && myVideoStream.getAudioTracks()[0].enabled;
    let html = "";

    if (!enabled) {
        html = `<i class="fas fa-microphone-slash"></i>`;
        muteButton.classList.add("background__red");
        muteButton.innerHTML = html;
    } else {
        html = `<i class="fas fa-microphone"></i>`;
        muteButton.classList.remove("background__red");
        muteButton.innerHTML = html;
    }
};

peer.on("open", (id) => {
    console.log('my id is' + id);
    peerId = id;
    socket.emit("join-room", ROOM_ID, id, userName);
});

peer.on("close", (id) => {
    console.log('close' + id);
    // socket.emit("join-room", ROOM_ID, id, userName);
});
peer.on("disconnected", (id) => {
    console.log('disconnected ' + id);
    // socket.emit("join-room", ROOM_ID, id, userName);
});

const wrapVideoStream = (video, userName, stream, id) => {
    let videoBlock = document.createElement("div");
    const videoData = document.createElement("div");

    const videoBlockId = "user-" + (id || "video-block-id");

    if (document.getElementById(videoBlockId)) {
        videoBlock = document.getElementById(videoBlockId);

        console.log('videoBlock', videoBlock);

        videoBlock.innerHTML = "";
    }

    video.srcObject = stream;
    videoBlock.id = videoBlockId;
    videoBlock.className = "video-block";
    videoData.className = "video-data";
    videoData.innerText = userName;
    videoBlock.append(video);
    videoBlock.append(videoData);

    return videoBlock;
};

const removeVideoBlock = (video) => {
    console.log("remove video block", video);

    const parentElement = video.parentElement;

    if (parentElement) {
        setTimeout(() => {
            console.log("remove video block", video, video.parentElement);
            // parentElement.remove();
        }, 200);
    }
};

const addVideoStream = (videoBlock) => {
    const video = videoBlock.getElementsByTagName('video')?.[0];

    if (video) {
        video.addEventListener("loadedmetadata", (e) => {
            console.log('loadedmetadata', e);

            video.play();
            videoGrid.append(videoBlock);

            if (myVideoStream) {
                updateVideoButton();
                updateSoundButton();
            } else {
                console.log('myVideoStream', myVideoStream)
            }
        });

        video.addEventListener("emptied", (e) => {
            console.log('emptied', e, video, video.closest('.video-block'), video.parentNode);
            removeVideoBlock(video);
        });

        video.addEventListener("ended", (e) => {
            console.log('ended', e, video, video.closest('.video-block'), video.parentNode);
            removeVideoBlock(video);
        });

        video.addEventListener("error", (e) => {
            console.log('error', e, video, video.closest('.video-block'), video.parentNode);
            removeVideoBlock(video);
        });
    }
};

const text = document.getElementById("chat_message");
const send = document.getElementById("send");
const messages = document.querySelector(".messages");

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
    updateSoundButton(true);
});

stopVideo.addEventListener("click", () => {
    updateVideoButton(true);
});

inviteButton.addEventListener("click", (e) => {
    prompt(
        "Copy this link and send it to people you want to meet with",
        window.location.href
    );
});

socket.on("createMessage", (message, name, id) => {
    messages.innerHTML +=
        `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${name === userName ? "me" : name
        }</span> </b>
        <span>${message}</span>
    </div>`;

    if (![userId, peerId].includes(id)) {
        showChat.classList.add("__indicator");
    }
});

window.addEventListener("DOMContentLoaded", () => {
    appHeight();
});
window.addEventListener("resize", () => {
    appHeight();
});
