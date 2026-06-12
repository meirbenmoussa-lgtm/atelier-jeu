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
};