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

function createDOMTextMessage(firstname, message, date) {
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

function createTxtMessage(msg) {
    msgInp.value = ''
    const { firstname, message } = msg
    let date = new Date;
    createDOMTextMessage(firstname, message, date)
}


function createDOMAudioMesage(audio, firstname, date) {
    // Создание <li> и основной контейнер
    const container = document.querySelector('#chat-display')

    const li = document.createElement('li');
    li.classList.add('audio-container');

    // Имя отправителя
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('message-name');
    nameSpan.textContent = 'Anonimus';

    // Внутренний контейнер сообщения
    const audioMessage = document.createElement('div');
    audioMessage.classList.add('audio-message');

    // Кнопка play/pause
    const playPauseBtn = document.createElement('button');
    playPauseBtn.classList.add('play-pause-btn');

    // Иконка play
    const img = document.createElement('img');
    img.src = './assets/play.svg';
    img.alt = '';

    //Аудио тег

    // Прогресс-бар
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');

    // Прогресс внутри бара
    const progress = document.createElement('div');
    progress.classList.add('progress');

    // Длительность (справа)
    const timeSpan = document.createElement('span');
    timeSpan.classList.add('duration');

    // Собираем всё вместе
    playPauseBtn.appendChild(img);
    progressBar.appendChild(progress);
    audioMessage.appendChild(playPauseBtn);
    audioMessage.appendChild(progressBar);
    audioMessage.appendChild(timeSpan);

    li.appendChild(nameSpan);
    li.appendChild(audioMessage);
    container.appendChild(li)

    nameSpan.innerText = firstname;
    timeSpan.innerText = date.getMinutes() > 9 ? `${date.getHours()}:${date.getMinutes()}` : `${date.getHours()}:0${date.getMinutes()}`

    playPauseBtn.addEventListener('click', () => {
        console.log(isMIcroOn)
        if (isMIcroOn) {
            audio.pause()

        } else {
            audio.play()
            changeTimeLine(progress, audio)

        }
    })



    audio.addEventListener('ended', () => {
        img.src = './assets/play.svg';
        isMIcroOn = false;
    })
    audio.addEventListener('play', () => {
        img.src = './assets/pause.svg';
        isMIcroOn = true;
    })
    audio.addEventListener('pause', () => {
        img.src = './assets/play.svg';
        isMIcroOn = false;
    })

}

function createAudioMessasge(msg) {
    audioChunks = [];
    let date = new Date;
    const { firstname, message } = msg


    let audio = document.createElement('audio');

    const newBlob = new Blob([message], { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(newBlob)
    audio.src = audioUrl;
    createDOMAudioMesage(audio, firstname, date)

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

