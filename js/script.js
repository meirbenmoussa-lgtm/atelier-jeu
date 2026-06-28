function switchScreen(screenId) {
    // Liste de tous les écrans possibles sur l'index
    const screens = ['main-menu', 'roulette-game', 'memory-game', 'rules-screen'];

    screens.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === screenId) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    });

    // Bascule de la musique selon l'écran affiché.
    switchAudio(screenId);
};

// Écrans qui gardent la musique du menu « Above Ground BGM »
// (le menu principal et la page des Règles).
// Tous les autres écrans sont des jeux -> musique « mario-world ».
const MENU_SCREENS = ['main-menu', 'rules-screen'];

function switchAudio(screenId) {
    const menuAudio = document.getElementById('menu-audio');
    const gameAudio = document.getElementById('game-audio');
    if (!menuAudio || !gameAudio) return;

    const keepMenuMusic = MENU_SCREENS.includes(screenId);
    const toPlay = keepMenuMusic ? menuAudio : gameAudio;
    const toStop = keepMenuMusic ? gameAudio : menuAudio;

    toStop.pause();
    toPlay.play().catch(() => {});
}

// --- GESTION DES VIDÉOS ET DE L'AUDIO DU MENU ---
document.addEventListener('DOMContentLoaded', () => {
    const mainMenu   = document.getElementById('main-menu');
    const introVideo = document.getElementById('menu-intro-video');
    const loopVideo  = document.getElementById('menu-loop-video');
    const menuAudio  = document.getElementById('menu-audio');

    // --- VERROUILLAGE DU MENU PENDANT L'INTRO ---
    // Pendant la vidéo d'intro (~10 s), les « mondes » et le bouton Règles
    // ne sont pas cliquables (classe « locked » sur #main-menu).
    // On déverrouille (classe « active ») dans 3 cas :
    //   1. la vidéo d'intro se termine,
    //   2. le joueur appuie sur ESPACE pour passer l'animation,
    //   3. au bout de 10 s maxi (sécurité, si la vidéo ne se charge pas).
    let menuUnlocked = false;

    const unlockMenu = () => {
        if (menuUnlocked || !mainMenu) return;
        menuUnlocked = true;

        // Bascule vers la vidéo de fond (en boucle) si pas déjà fait.
        if (introVideo && loopVideo && !introVideo.classList.contains('hidden')) {
            introVideo.pause();
            introVideo.classList.add('hidden');
            loopVideo.classList.remove('hidden');
            loopVideo.play().catch(() => {});
        }

        // Active les boutons + lance les animations de flottement.
        mainMenu.classList.remove('locked');
        mainMenu.classList.add('active');

        document.removeEventListener('keydown', onSkipKey);
    };

    // ESPACE = passer l'animation tout de suite.
    const onSkipKey = (e) => {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            unlockMenu();
        }
    };
    document.addEventListener('keydown', onSkipKey);

    // Fin de la vidéo d'intro -> déverrouillage.
    if (introVideo) {
        introVideo.addEventListener('ended', unlockMenu);
    }

    // Sécurité : on déverrouille au bout de 10 s quoi qu'il arrive.
    setTimeout(unlockMenu, 10000);

    // Musique du menu : jouée une fois au lancement.
    // Les navigateurs bloquent l'audio tant que l'utilisateur n'a pas
    // interagi avec la page (sécurité). On tente de jouer tout de suite,
    // et si c'est bloqué on démarre à la première interaction.
    if (menuAudio) {
        const events = ['click', 'keydown', 'pointerdown', 'touchstart'];
        menuAudio.play().catch(() => {
            const unlock = () => {
                menuAudio.play().catch(() => {});
                events.forEach(evt => document.removeEventListener(evt, unlock));
            };
            events.forEach(evt => document.addEventListener(evt, unlock));
        });
    }
});