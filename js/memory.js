const cardsData = [
    'mario.jpg', 'mario.jpg',
    'luigi.jpg', 'luigi.jpg',
    'fleur.jpg', 'fleur.jpg',
    'etoile.jpg', 'etoile.jpg',
    'nuage.jpg', 'nuage.jpg',
    'champi.jpg', 'champi.jpg'
];

const gameBoard = document.getElementById('game-board');
const tryCountEl = document.getElementById('try-count');
const matchCountEl = document.getElementById('match-count');
const resetBtn = document.getElementById('reset-btn');

let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let tries = 0;
let matches = 0;

// Gestion de la musique d'ambiance
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');

if (musicBtn && bgMusic) {
    musicBtn.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play()
                .then(() => { musicBtn.textContent = "⏸️ Couper la musique"; })
                .catch(error => {
                    console.log("Erreur de lecture : ", error);
                    alert("Le navigateur bloque la musique. Re-clique sur le bouton !");
                });
        } else {
            bgMusic.pause();
            musicBtn.textContent = "🎵 Lancer la musique";
        }
    });
}

// Mélange des cartes (Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Génération du plateau de jeu
function createBoard() {
    // On vide le plateau avant de générer (utile pour le bouton rejouer)
    gameBoard.innerHTML = ''; 
    
    const shuffledCards = shuffle([...cardsData]); // Copie et mélange
    
    shuffledCards.forEach(imageName => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.framework = imageName;

        card.innerHTML = `
            <div class="front-face">
                <img src="../eset/${imageName}" alt="Face avant">
            </div>
            <div class="back-face">
                <img src="../eset/dos-cartes.png" alt="Dos de la carte">
            </div>
        `;

        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

// Gestion du clic
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

// Vérification des paires
function checkForMatch() {
    tries++;
    tryCountEl.textContent = tries;

    let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

// Si c'est correct
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    matches++;
    matchCountEl.textContent = matches;

    resetBoardVars();
    
    if (matches === cardsData.length / 2) {
        setTimeout(() => alert(`Bravo ! Tu as gagné en ${tries} essais !`), 500);
    }
}

// Si c'est faux
function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoardVars();
    }, 1000);
}

// Reset des variables de jeu après chaque paire jouée
function resetBoardVars() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

// FONCTION REJOUER : Remise à zéro complète de la partie
function resetGame() {
    tries = 0;
    matches = 0;
    tryCountEl.textContent = tries;
    matchCountEl.textContent = matches;
    resetBoardVars();
    createBoard();
}

// Écouteur pour le bouton Rejouer
if (resetBtn) {
    resetBtn.addEventListener('click', resetGame);
}

// Lancement initial du jeu
createBoard();