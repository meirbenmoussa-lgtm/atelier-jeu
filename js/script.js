
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
}

// On cible l'oiseau pour savoir si on est bien sur la page du jeu
let bird = document.querySelector('.bird');

if (bird) {
    // --- CONFIGURATION ET VARIABLES INITIALES ---
    let move_speed = 5; 
    let gravity = 0.35;
    let game_state = 'Start';

    let img = document.getElementById('bird-1');
    let message = document.querySelector('.message');
    let score_val = document.querySelector('.score_val');
    let score_title = document.querySelector('.score_title');

    let bird_props = bird.getBoundingClientRect();
    let background = document.querySelector('.background').getBoundingClientRect();

    let bird_dy = 0;
    let pipe_separation = 0;
    let pipe_gap = 38; // Écartement entre le tuyau du haut et du bas

    // Configuration visuelle de départ
    img.style.display = 'none';
    message.classList.add('messageStyle');

    // --- ÉCOUTEUR DES TOUCHES CLAVIER ---
    document.addEventListener('keydown', (e) => {
        // Lancer le jeu avec la touche Entrée
        if (e.key === 'Enter' && game_state !== 'Play') {
            // Supprimer les anciens tuyaux si c'est un restart
            document.querySelectorAll('.pipe_sprite').forEach((element) => element.remove());
            
            img.style.display = 'block';
            bird.style.top = '40vh';
            bird_dy = 0;
            game_state = 'Play';
            
            message.innerHTML = '';
            message.classList.remove('messageStyle');
            score_title.innerHTML = 'Score : ';
            score_val.innerHTML = '0';
            
            // Lancement des boucles d'animation
            requestAnimationFrame(move);
            requestAnimationFrame(apply_gravity);
            requestAnimationFrame(create_pipe);
        }

        // Faire sauter l'oiseau avec Flèche Haut ou Espace
        if ((e.key === 'ArrowUp' || e.key === ' ') && game_state === 'Play') {
            bird_dy = -7;
        }
    });

    // --- BOUCLE 1 : DÉPLACEMENT DES TUYAUX & HITBOX (COLLISIONS) ---
    function move() {
        if (game_state !== 'Play') return;

        let pipe_sprites = document.querySelectorAll('.pipe_sprite');
        bird_props = bird.getBoundingClientRect();

        pipe_sprites.forEach((element) => {
            let pipe_sprite_props = element.getBoundingClientRect();

            // Supprimer le tuyau s'il sort de l'écran par la gauche
            if (pipe_sprite_props.right <= 0) {
                element.remove();
            } else {
                // Détection de collision AABB (Hitbox oiseau vs tuyau)
                if (bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width &&
                    bird_props.left + bird_props.width > pipe_sprite_props.left &&
                    bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height &&
                    bird_props.top + bird_props.height > pipe_sprite_props.top) {
                    
                    gameOver();
                    return;
                } else {
                    // Gestion du score (Calculé uniquement sur le tuyau du bas doté de la classe 'pipe_score')
                    if (pipe_sprite_props.right < bird_props.left && 
                        element.dataset.passed !== 'true' && 
                        element.classList.contains('pipe_score')) {
                        
                        score_val.innerHTML = parseInt(score_val.innerHTML) + 1;
                        element.dataset.passed = 'true'; // Évite de rajouter des points en boucle sur la même frame
                    }
                    // Déplacement physique du tuyau vers la gauche
                    element.style.left = pipe_sprite_props.left - move_speed + 'px';
                }
            }
        });
        requestAnimationFrame(move);
    }

    // --- BOUCLE 2 : PHYSIQUE DE LA GRAVITÉ ---
    function apply_gravity() {
        if (game_state !== 'Play') return;

        bird_dy += gravity;
        bird_props = bird.getBoundingClientRect();

        // Détection si l'oiseau frappe le plafond ou s'écrase au sol
        if (bird_props.top <= 0 || bird_props.bottom >= background.bottom) {
            gameOver();
            return;
        }

        bird.style.top = bird_props.top + bird_dy + 'px';
        requestAnimationFrame(apply_gravity);
    }

    // --- BOUCLE 3 : GÉNÉRATION DES TUYAUX EN CONTINU ---
    function create_pipe() {
        if (game_state !== 'Play') return;

        if (pipe_separation > 100) {
            pipe_separation = 0;

            // Calcul de la hauteur aléatoire pour le passage secret
            let pipe_posi = Math.floor(Math.random() * 40) + 10;

            // Génération du tuyau supérieur (Inversé)
            let pipe_sprite_inv = document.createElement('div');
            pipe_sprite_inv.className = 'pipe_sprite';
            pipe_sprite_inv.style.top = pipe_posi - 70 + 'vh';
            pipe_sprite_inv.style.left = '100vw';
            document.body.appendChild(pipe_sprite_inv);

            // Génération du tuyau inférieur (Celui qui déclenche le score)
            let pipe_sprite = document.createElement('div');
            pipe_sprite.className = 'pipe_sprite pipe_score'; 
            pipe_sprite.style.top = pipe_posi + pipe_gap + 'vh';
            pipe_sprite.style.left = '100vw';
            document.body.appendChild(pipe_sprite);
        }
        pipe_separation++;
        requestAnimationFrame(create_pipe);
    }

    // --- FIN DE PARTIE (GAME OVER) ---
    function gameOver() {
        game_state = 'End';
        message.innerHTML = '<span style="color: red; font-size: 2rem; font-weight: bold;">Game Over</span><br>Press Enter To Restart';
        message.classList.add('messageStyle');
        img.style.display = 'none';
    }
}