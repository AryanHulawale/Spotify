const currentsong = new Audio();
let songs;
let currentFolder;



function create_card(cardimg, title, moreinfo, folder_name) {
    let html =
        `<div class="card">
            <div data-folder="${folder_name}" class="img">
                <img src="${cardimg}" alt="" width="140px">
                <div class="play-btn">
                    <img src="PNG/playbutton.png" alt="">
                </div>
            </div>
            <h1 class="cards-h1">${title}</h1>
            <p>${moreinfo}</p>
        </div>`;

    document.getElementsByClassName("cards-container")[0].insertAdjacentHTML('beforeend', html);
}

function create_librarysong(song, songimgsrc = "SVG icons/music.svg") {

    let html = `
    <div class="library-song">
        <div class="song-img">
            <img src="${songimgsrc}" alt="" width="px">
        </div>
        <div class="songsinfo">
            <h1 class="library-song-h1">${song}</h1>
        </div>
    </div>`;

    document.getElementsByClassName("songs-list")[0].insertAdjacentHTML('beforeend', html);
}

async function getsongs(folder = "songs/mix") {
    currentFolder = folder;
    let a = await fetch(`/${folder}`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");

    let songs = [];
    for (let i = 0; i < as.length; i++) {
        let x = as[i];
        if (x.href.endsWith(".mp3")) {
            songs.push(x.href);
        }
    }

    console.log("Songs fetched:", songs);
    return songs;
}

function PlayMusic(track) {
    currentsong.src = track;
    currentsong.play();

    let playButton = document.getElementById("play");
    playButton.src = "SVG icons/pause.svg";  // Show pause icon

    // Extract and decode the filename from the track URL
    let trackName = decodeURIComponent(track.split("/").pop().replace(".mp", ""));

    // Update the song detail
    document.querySelector(".song-detail").innerHTML = trackName;

}

function convertToMinutesSeconds(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const remainingSeconds = Math.floor(timeInSeconds % 60);

    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
    return `${minutes}:${formattedSeconds}`;
}

async function getAlbums() {
    console.log("function is called")
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");
    let array = Array.from(anchors);
    for (let i = 0; i < array.length; i++) {
        const e = array[i];
        // console.log(e.href);
        if (e.href.includes("/songs")) {

            let filename = e.href.split("/").slice(-2)[0];
            console.log(filename);
            let a = await fetch(`/songs/${filename}/info.json`);
            let response = await a.json();
            console.log(response);

            let coverImgPath = `/songs/${filename}/cover.jpeg`;
            create_card(coverImgPath, response.title, response.description, filename);
        }
    }
}

// Event delegation for handling card clicks
document.querySelector(".cards-container").addEventListener("click", async (event) => {
    const card = event.target.closest(".card");
    if (card) {
        const folder = card.querySelector(".img").dataset.folder;
        songs = await getsongs(`songs/${folder}`);
        document.querySelector(".songs-list").innerHTML = ""; // Clear the song list

        Array.from(songs).forEach((song) => {
            let songName = song.split('/').pop().replace(/\.mp3$/, '').replaceAll("%20", " ");
            create_librarysong(songName);
        });

        // Attach click listeners to the new song items
        document.querySelectorAll(".songs-list .library-song").forEach((songItem) => {
            songItem.addEventListener("click", () => {
                let songName = songItem.querySelector(".songsinfo").firstElementChild.innerHTML;
                let songUrl = `/${currentFolder}/` + songName + ".mp3";
                PlayMusic(songUrl);
            });
        });
    }
    PlayMusic(songs[0]);
});

async function main() {
    songs = await getsongs("songs/mix");

    getAlbums();
    songs.forEach((song, index) => {
        let songName = song.split('/').pop().replace(/\.mp3$/, '').replaceAll("%20", " ");
        create_librarysong(songName);
    });

    // Play and pause button logic
    let playButton = document.getElementById("play");
    playButton.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            playButton.src = "SVG icons/pause.svg";  // Show pause icon
        } else {
            currentsong.pause();
            playButton.src = "SVG icons/play.svg";  // Show play icon
        }
    });

    currentsong.addEventListener("timeupdate", () => {
        let time = document.querySelector(".time");
        time.innerHTML = `${convertToMinutesSeconds(currentsong.currentTime)} / ${convertToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let seekbarWidth = e.target.clientWidth;
        document.querySelector(".circle").style.left = e.offsetX + "px";
        currentsong.currentTime = (currentsong.duration * e.offsetX) / seekbarWidth;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        let left = document.querySelector(".left");
        left.style.left = "0%";
    });

    document.querySelector(".cross").addEventListener("click", () => {
        let left = document.querySelector(".left");
        left.style.left = "-120%";
    });

    // Previous and next song logic
    document.getElementById("previous").addEventListener("click", () => {
        let currentSongName = currentsong.src.split("/").pop().trim();
        let filenames = songs.map(songUrl => songUrl.split("/").pop().trim());
        let index = filenames.indexOf(currentSongName);

        if (index > 0) {
            PlayMusic(songs[index - 1]);
        } else {
            console.log("No previous song available.");
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        let currentSongName = currentsong.src.split("/").slice(-1)[0].trim();
        let filenames = songs.map(songUrl => songUrl.split("/").slice(-1)[0].trim());
        let index = filenames.indexOf(currentSongName);

        if ((index + 1) < songs.length) {
            PlayMusic(songs[index + 1]);
        } else {
            console.log("No next song available.");
        }
    });
    document.querySelectorAll(".songs-list .library-song").forEach((songItem) => {
        songItem.addEventListener("click", () => {
            let songName = songItem.querySelector(".songsinfo").firstElementChild.innerHTML;
            let songUrl = `/${currentFolder}/` + songName + ".mp3";
            PlayMusic(songUrl);
        });
    });

    // Volume control logic
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
    });

    let btn = document.querySelector(".vol");
    btn.addEventListener("click", () => {
        if (currentsong.volume != 0) {
            currentsong.volume = 0;
            btn.src = "SVG icons/mute.svg";  // Show mute icon
        } else {
            currentsong.volume = 1.0;
            btn.src = "SVG icons/volume.svg";  // Show volume icon
        }
    });

    const rangeSlider = document.getElementById('rangeSlider');

    function updateSliderBackground() {
        const value = (rangeSlider.value - rangeSlider.min) / (rangeSlider.max - rangeSlider.min) * 100;
        rangeSlider.style.background = `linear-gradient(to right, rgb(27, 188, 27) ${value}%, grey ${value}%)`;
    }

    rangeSlider.addEventListener('input', updateSliderBackground);
    updateSliderBackground();
}

main();
