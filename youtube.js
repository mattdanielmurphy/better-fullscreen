let originalParent, originalNextSibling, overlay, player;
let originalStyles = {};
let currentScale = 1;

function log(message, obj = null) {
    console.log(`%c${message}`, 'background: #222; color: #bada55');
    if (obj) console.log(obj);
}

document.addEventListener("fullscreenchange", handleFullscreen);

function handleFullscreen() {
    if (document.fullscreenElement) {
        log("Entering fullscreen");
        createFullscreenOverlay();
    } else {
        log("Exiting fullscreen");
        removeFullscreenOverlay();
    }
}

function createFullscreenOverlay() {
    player = document.querySelector('#movie_player');
    if (!player) {
        log("Player not found");
        return;
    }

    log("Original player styles:", player.style.cssText);

    originalParent = player.parentNode;
    originalNextSibling = player.nextSibling;
    originalStyles = {
        cssText: player.style.cssText,
        className: player.className,
        width: player.style.width,
        height: player.style.height,
        transform: player.style.transform
    };

    log("Stored original styles:", originalStyles);

    overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: black;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    overlay.appendChild(player);
    document.body.appendChild(overlay);

    currentScale = 0.8;
    setPlayerSize();

    overlay.addEventListener('wheel', handleWheel);
    window.addEventListener('resize', setPlayerSize);
}

function setPlayerSize() {
    const videoWidth = player.offsetWidth;
    const videoHeight = player.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / videoWidth;
    const scaleY = windowHeight / videoHeight;
    const fitScale = Math.min(scaleX, scaleY, 1);

    player.style.transform = `scale(${currentScale * fitScale})`;
    log("Applied transform:", player.style.transform);
}

function handleWheel(e) {
    e.preventDefault();
    currentScale += e.deltaY * 0.001;
    currentScale = Math.min(Math.max(0.125, currentScale), 1);
    setPlayerSize();
}

function removeFullscreenOverlay() {
    if (!overlay || !originalParent || !player) {
        log("Missing elements for fullscreen exit");
        return;
    }

    log("Player styles before reset:", player.style.cssText);

    if (originalNextSibling) {
        originalParent.insertBefore(player, originalNextSibling);
    } else {
        originalParent.appendChild(player);
    }

    overlay.remove();

    // Apply reverse scaling
    const reverseScale = 1 / currentScale;
    player.style.transform = `scale(${reverseScale})`;

    log("Applied reverse transform:", player.style.transform);

    // Force a repaint
    void player.offsetWidth;

    // Reset other styles
    player.style.width = originalStyles.width;
    player.style.height = originalStyles.height;
    player.className = originalStyles.className;

    const video = player.querySelector('video');
    if (video) {
        video.style.width = '100%';
        video.style.height = '100%';
    }

    const controls = player.querySelector('.ytp-chrome-bottom');
    if (controls) {
        controls.style.transform = '';
    }

    window.removeEventListener('resize', setPlayerSize);

    // Remove the reverse scaling after a short delay
    setTimeout(() => {
        player.style.transform = originalStyles.transform;
        log("Final player styles:", player.style.cssText);
    }, 50);
}

function setupFullscreenOverride() {
    const player = document.querySelector('#movie_player');
    if (player) {
        const fullscreenButton = player.querySelector('.ytp-fullscreen-button');
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!document.fullscreenElement) {
                    createFullscreenOverlay();
                } else {
                    document.exitFullscreen();
                }
            });
        }
    }
}

function checkForPlayer() {
    if (document.querySelector('#movie_player')) {
        setupFullscreenOverride();
    } else {
        setTimeout(checkForPlayer, 100);
    }
}

checkForPlayer();