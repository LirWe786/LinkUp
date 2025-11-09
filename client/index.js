const voiceMessageBack = document.getElementById('voice-message-back');
const voiceMessageBtn = document.getElementById('voice-message-btn');
const timerSpan = document.getElementById('timer-span');
const chatDiv = document.getElementById('chat-display')
const form = document.getElementById('chat-form');
const msgInp = document.getElementById('send-msg');

const socket = io();

let timerState = false;
let mediaRecorder;
let audioChunks = [];
let isMIcroOn = false;

let name = prompt('Ваше имя')
socket.emit('set username', name)

//функции
function round(num) {
    if (num < 10) {
        return `0${num}`
    } else {
        return num
    }
}
function timer() {
    clearInterval()
    let i = 0;
    timerSpan.innerText = '00:00';
    const intervalId = setInterval(() => {
        if (!timerState) {
            clearInterval(intervalId);
            return;
        }

        i++;
        let minutes = Math.floor(i / 60);
        let seconds = i % 60;
        timerSpan.innerText = `${round(minutes)}:${round(seconds)}`;
    }, 1000);
}

function changeTimeLine(elem, audio) {
    const maxWidth = 100;
    console.log(elem, audio)
    if (audio._intervalId) {
        clearInterval(audio._intervalId);
    }

    audio._intervalId = setInterval(() => {
        if (!audio.duration || isNaN(audio.duration)) return;

        let width = (audio.currentTime / audio.duration) * maxWidth;
        elem.style.width = width + '%';

        if (audio.ended) {
            clearInterval(audio._intervalId);
            elem.style.width = 0;
        }
    }, 200);

}

function createTxtMessage(msg) {
    msgInp.value = ''
    const { firstname, message } = msg
    let date = new Date;

    const li = document.createElement('li')
    li.classList.add('message')
    const txtDiv = document.createElement('div')
    txtDiv.classList.add('message-text-div')
    const nameSpan = document.createElement('span')
    nameSpan.classList.add('message-name')
    const msgSpan = document.createElement('span')
    msgSpan.classList.add('message-text')
    const timeDiv = document.createElement('div')
    timeDiv.classList.add('message-time-div')
    const timeSpan = document.createElement('span')
    chatDiv.appendChild(li)
    timeSpan.classList.add('time-span')
    li.appendChild(txtDiv)
    txtDiv.appendChild(nameSpan)
    txtDiv.appendChild(msgSpan)
    li.appendChild(timeDiv)
    timeDiv.appendChild(timeSpan)
    nameSpan.innerText = firstname;
    msgSpan.innerText = message;
    timeSpan.innerText = date.getMinutes() > 10 ? `${date.getHours()}:${date.getMinutes()}` : `${date.getHours()}:0${date.getMinutes()}`
}

function createAudioMessasge(msg) {
    audioChunks = [];
    const { firstname, message } = msg

    let date = new Date;
    let audio = document.createElement('audio');

    const newBlob = new Blob([message], { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(newBlob)
    audio.src = audioUrl;

    //верстка  сообщения  через DOM
    const li = document.createElement('li');
    li.classList.add('message', 'voice-message');
    li.appendChild(audio)

    const txtDiv = document.createElement('div');
    txtDiv.classList.add('message-text-div');

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('message-name');

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message-text', 'message-length');

    const voicePlayBtn = document.createElement('button');
    voicePlayBtn.classList.add('voice-play-btn');
    voicePlayBtn.id = 'voice-btn';

    const voiceImg = document.createElement('img');
    voiceImg.src = './assets/play.svg';
    voiceImg.alt = '';
    voiceImg.id = 'voice-img';
    voiceImg.classList.add('voice-img');

    voicePlayBtn.appendChild(voiceImg);

    const voiceLengthDiv = document.createElement('div');
    voiceLengthDiv.classList.add('voice-length-div');

    const timeDiv = document.createElement('div');
    timeDiv.classList.add('message-time-div');

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('timer-span');

    const lengthLine = document.createElement("div");
    lengthLine.classList.add('lengthLine');

    const timeLine = document.createElement('div');
    timeLine.classList.add('timeLine');

    //вложение элементов друг в друга
    chatDiv.appendChild(li);
    li.appendChild(txtDiv);
    txtDiv.appendChild(nameSpan);
    txtDiv.appendChild(msgDiv);
    li.appendChild(timeDiv);
    timeDiv.appendChild(timeSpan);
    msgDiv.appendChild(voicePlayBtn);
    msgDiv.appendChild(voiceLengthDiv);
    voiceLengthDiv.appendChild(lengthLine)
    lengthLine.appendChild(timeLine)


    nameSpan.innerText = firstname;
    timeSpan.innerText = date.getMinutes() > 9 ? `${date.getHours()}:${date.getMinutes()}` : `${date.getHours()}:0${date.getMinutes()}`

    //events for audio

    voicePlayBtn.addEventListener('click', () => {
        if (isMIcroOn) {
            audio.pause()

        } else {
            audio.play()
            changeTimeLine(timeLine, audio)

        }
    })
    audio.addEventListener('ended', () => {
        voiceImg.src = './assets/play.svg';
        isMIcroOn = false;
    })
    audio.addEventListener('play', () => {
        voiceImg.src = './assets/pause.svg';
        isMIcroOn = true;
    })
    audio.addEventListener('pause', () => {
        voiceImg.src = './assets/play.svg';
        isMIcroOn = false;
    })


}
//events
voiceMessageBtn.addEventListener('click', () => {
    timerState = true;
    voiceMessageBack.style.display = 'block';
    timer();
})

voiceMessageBack.addEventListener('click', () => {
    timerState = false;
    voiceMessageBack.style.display = 'none';
    mediaRecorder.stop();
})

voiceMessageBtn.addEventListener('click', async () => {

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.addEventListener('dataavailable', (e) => {
            audioChunks.push(e.data);

        });
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            //  const audioUrl = URL.createObjectURL(audioBlob)
            socket.emit('voice message', audioBlob)
            // createAudioMessasge()

        }
        mediaRecorder.start();
    } catch (error) {
        console.log(error)
    }
})


window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;
    console.log(`Размер окна просмотра: ${width}x${height}`);
    if (window.innerWidth < 480) {

    }
});

//server
form.addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('chat message', msgInp.value)
})

socket.on('chat message', (msg) => {
    createTxtMessage(msg)

})

socket.on('voice message', (msg) => {
    createAudioMessasge(msg)
})

