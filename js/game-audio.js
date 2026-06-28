// --- SON D'ENTRÉE DANS UN JEU ---
// Sur les pages de jeu (Flappy, Roulette), la musique du menu
// « Above Ground BGM » s'est déjà arrêtée toute seule au changement de page.
// Ici on joue le jingle « mario-world » UNE SEULE FOIS (pas en boucle).
// Les navigateurs bloquent l'audio tant que l'utilisateur n'a pas interagi
// avec la page : on tente de jouer tout de suite, et si c'est bloqué on
// démarre à la première interaction (clic, touche, tap...).
(function () {
    const music = new Audio('../audio/mario-world.com.mp3');
    music.loop = false;
    music.volume = 1;

    const events = ['click', 'keydown', 'pointerdown', 'touchstart'];
    music.play().catch(() => {
        const unlock = () => {
            music.play().catch(() => {});
            events.forEach(evt => document.removeEventListener(evt, unlock));
        };
        events.forEach(evt => document.addEventListener(evt, unlock));
    });
})();
