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

// On cible Mario pour savoir si on est bien sur la page du jeu
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
    let level_val = document.getElementById('level_val');

    let bird_props = bird.getBoundingClientRect();
    let background = document.querySelector('.background').getBoundingClientRect();

    let bird_dy = 0;
    let pipe_separation = 0;
    let pipe_gap = 38; // Écartement initial entre le tuyau du haut et du bas

    // Configuration visuelle de départ
    img.style.display = 'none';
    message.classList.add('messageStyle');

    // --- ÉCOUTEUR UNIQUE : TOUCHE ESPACE ---
    document.addEventListener('keydown', (e) => {
        // On n'écoute UNIQUEMENT la barre Espace
        if (e.key === ' ' || e.code === 'Space') {
            
            // Empêche la page de scroller vers le bas sur navigateur lors de l'appui
            e.preventDefault(); 

            // 1. Si le jeu n'a pas commencé ou est en Game Over -> On lance / relance le jeu
            if (game_state !== 'Play') {
                // Supprimer les anciens tuyaux si c'est un restart
                document.querySelectorAll('.pipe_sprite').forEach((element) => element.remove());
                
                // Réinitialisation des paramètres de vitesse et de physique au niveau de base
                move_speed = 5;
                gravity = 0.35;
                pipe_gap = 38;

                img.style.display = 'block';
                bird.style.top = '40vh';
                bird_dy = 0;
                game_state = 'Play';
                
                message.innerHTML = '';
                message.classList.remove('messageStyle');
                score_title.innerHTML = 'Score : ';
                score_val.innerHTML = '0';
                if (level_val) level_val.innerHTML = '1';
                
                // Lancement des boucles d'animation
                requestAnimationFrame(move);
                requestAnimationFrame(apply_gravity);
                requestAnimationFrame(create_pipe);
            } 
            // 2. Si le jeu est déjà en cours -> La touche Espace fait sauter Mario
            else {
                bird_dy = -7;
            }
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
                // Détection de collision AABB (Hitbox Mario vs Tuyau)
                if (bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width &&
                    bird_props.left + bird_props.width > pipe_sprite_props.left &&
                    bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height &&
                    bird_props.top + bird_props.height > pipe_sprite_props.top) {
                    
                    gameOver();
                    return;
                } else {
                    // Gestion du score
                    if (pipe_sprite_props.right < bird_props.left && 
                        element.dataset.passed !== 'true' && 
                        element.classList.contains('pipe_score')) {
                        
                        score_val.innerHTML = parseInt(score_val.innerHTML) + 1;
                        element.dataset.passed = 'true';
                        
                        // Ajustement de la difficulté en temps réel à chaque point marqué
                        Niveau();
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

        // Détection si Mario frappe le plafond ou s'écrase au sol
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

            // Calcul de la hauteur aléatoire pour le passage
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

    // --- GESTION DES NIVEAUX DE DIFFICULTÉ ---
    function Niveau() {
        let actual_score = parseInt(score_val.innerHTML);
        
        if (actual_score >= 30) {
            move_speed = 11;
            gravity = 0.65;
            pipe_gap = 34;
            if (level_val) level_val.innerHTML = '4'; // Niveau 4 à partir de 30 pts
        } else if (actual_score >= 20) {
            move_speed = 9;
            gravity = 0.55;
            pipe_gap = 35;
            if (level_val) level_val.innerHTML = '3'; // Niveau 3 à partir de 20 pts
        } else if (actual_score >= 10) {
            move_speed = 7;
            gravity = 0.45;
            pipe_gap = 36;
            if (level_val) level_val.innerHTML = '2'; // Niveau 2 à partir de 10 pts
        } else {
            move_speed = 5;
            gravity = 0.35;
            pipe_gap = 38;
            if (level_val) level_val.innerHTML = '1'; // Niveau 1 par défaut
        }
    }

    // --- FIN DE PARTIE (GAME OVER) ---
    function gameOver() {
        game_state = 'End';
        message.innerHTML = 'GAME OVER <p><span>&uarr;</span> Appuie sur Espace pour rejouer</p>';
        message.classList.add('messageStyle');
    }
}