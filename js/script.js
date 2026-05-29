// --- CONFIGURATION ET VARIABLES ---
let move_speed = 5; 
let gravity = 0.35;
let game_state = 'Start';

let bird = document.querySelector('.bird');
let img = document.getElementById('bird-1');
let message = document.querySelector('.message');
let score_val = document.querySelector('.score_val');
let score_title = document.querySelector('.score_title');

let bird_props = bird.getBoundingClientRect();
let background = document.querySelector('.background').getBoundingClientRect();

let bird_dy = 0;
let pipe_separation = 0;
let pipe_gap = 38; 

img.style.display = 'none';
message.classList.add('messageStyle');

// --- NAVIGATION INTER-JEUX ---
function switchScreen(screenId) {
    if (screenId === 'main-menu') {
        game_state = 'Start'; 
        document.querySelectorAll('.pipe_sprite').forEach(p => p.remove());
        img.style.display = 'none';
        bird.style.top = '40vh';
        message.innerHTML = 'Enter To Start Game <p><span style="color: red;">&uarr; </span> ArrowUp ou Espace pour Voler</p>';
        message.classList.add('messageStyle');
        if(score_title) score_title.innerHTML = '';
        if(score_val) score_val.innerHTML = '';
    }

    // Masquer absolument TOUS les écrans existants
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('flappy-game').classList.add('hidden');
    document.getElementById('roulette-game').classList.add('hidden');
    document.getElementById('memory-game').classList.add('hidden');
    document.getElementById('rules-screen').classList.add('hidden'); // Gère l'écran des règles

    // Afficher l'écran demandé
    document.getElementById(screenId).classList.remove('hidden');

    if (screenId === 'flappy-game') {
        background = document.querySelector('.background').getBoundingClientRect();
        bird_props = bird.getBoundingClientRect();
    }
}

// --- ÉCOUTEURS DES TOUCHES ---
document.addEventListener('keydown', (e) => {
    if (document.getElementById('flappy-game').classList.contains('hidden')) return;

    if (e.key == 'Enter' && game_state != 'Play') {
        document.querySelectorAll('.pipe_sprite').forEach((element) => element.remove());
        
        img.style.display = 'block';
        bird.style.top = '40vh';
        bird_dy = 0;
        game_state = 'Play';
        
        message.innerHTML = '';
        message.classList.remove('messageStyle');
        score_title.innerHTML = 'Score : ';
        score_val.innerHTML = '0';
        
        requestAnimationFrame(move);
        requestAnimationFrame(apply_gravity);
        requestAnimationFrame(create_pipe);
    }

    if ((e.key == 'ArrowUp' || e.key == ' ') && game_state == 'Play') {
        bird_dy = -7;
    }
});

// --- BOUCLE 1 : DÉPLACEMENT DES TUYAUX & COLLISIONS ---
function move() {
    if (game_state != 'Play') return;

    let pipe_sprites = document.querySelectorAll('.pipe_sprite');
    bird_props = bird.getBoundingClientRect();

    pipe_sprites.forEach((element) => {
        let pipe_sprite_props = element.getBoundingClientRect();

        if (pipe_sprite_props.right <= 0) {
            element.remove();
        } else {
            if (bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width &&
                bird_props.left + bird_props.width > pipe_sprite_props.left &&
                bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height &&
                bird_props.top + bird_props.height > pipe_sprite_props.top) {
                
                gameOver();
                return;
            } else {
                if (pipe_sprite_props.right < bird_props.left && 
                    element.dataset.passed !== 'true' && 
                    element.classList.contains('pipe_score')) {
                    
                    score_val.innerHTML = parseInt(score_val.innerHTML) + 1;
                    element.dataset.passed = 'true'; 
                }
                element.style.left = pipe_sprite_props.left - move_speed + 'px';
            }
        }
    });
    requestAnimationFrame(move);
}

// --- BOUCLE 2 : PHYSIQUE DE L'OISEAU (GRAVITÉ) ---
function apply_gravity() {
    if (game_state != 'Play') return;

    bird_dy += gravity;
    bird_props = bird.getBoundingClientRect();

    if (bird_props.top <= 0 || bird_props.bottom >= background.bottom) {
        gameOver();
        return;
    }

    bird.style.top = bird_props.top + bird_dy + 'px';
    requestAnimationFrame(apply_gravity);
}

// --- BOUCLE 3 : GÉNÉRATION DES TUYAUX ---
function create_pipe() {
    if (game_state != 'Play') return;

    if (pipe_separation > 100) {
        pipe_separation = 0;
        let pipe_posi = Math.floor(Math.random() * 40) + 10;

        let pipe_sprite_inv = document.createElement('div');
        pipe_sprite_inv.className = 'pipe_sprite';
        pipe_sprite_inv.style.top = pipe_posi - 70 + 'vh';
        pipe_sprite_inv.style.left = '100vw';
        document.body.appendChild(pipe_sprite_inv);

        let pipe_sprite = document.createElement('div');
        pipe_sprite.className = 'pipe_sprite pipe_score'; 
        pipe_sprite.style.top = pipe_posi + pipe_gap + 'vh';
        pipe_sprite.style.left = '100vw';
        document.body.appendChild(pipe_sprite);
    }
    pipe_separation++;
    requestAnimationFrame(create_pipe);
}

// --- ÉCRAN DE FIN DE PARTIE ---
function gameOver() {
    game_state = 'End';
    message.innerHTML = '<span style="color: red; font-size: 2rem; font-weight: bold;">Game Over</span><br>Press Enter To Restart';
    message.classList.add('messageStyle');
    img.style.display = 'none';
}