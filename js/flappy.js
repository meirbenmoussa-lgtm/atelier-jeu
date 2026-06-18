function switchScreen(screenId) {
  const screens = ["main-menu", "roulette-game", "memory-game", "rules-screen"];

  screens.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      if (id === screenId) {
        element.classList.remove("hidden");
      } else {
        element.classList.add("hidden");
      }
    }
  });
}

let bird = document.querySelector(".bird");

if (bird) {
  // --- INITIALISATION DES BRUITAGES (AUDIO) ---
  const sound_jump = new Audio("../audio/mario-jump.mp3");
  const sound_levelup = new Audio("../audio/level-up.mp3");
  const sound_gameover = new Audio("../audio/game-over.mp3");

  // --- CONFIGURATION ET VARIABLES INITIALES ---
  let move_speed = 5;
  let gravity = 0.35;
  let game_state = "Start";

  let img = document.getElementById("bird-1");
  let message = document.querySelector(".message");
  let score_val = document.querySelector(".score_val");
  let score_title = document.querySelector(".score_title");
  let level_val = document.getElementById("level_val");

  let bird_props = bird.getBoundingClientRect();
  let background = document
    .querySelector(".background")
    .getBoundingClientRect();

  let bird_dy = 0;
  let pipe_separation = 0;
  let pipe_gap = 38;

  img.style.display = "none";
  message.classList.add("messageStyle");

  // --- ÉCOUTEUR DES TOUCHES (CLAVIER) ---
  document.addEventListener("keydown", (e) => {
    // 1. GESTION DE LA TOUCHE ESPACE (UNIQUEMENT POUR JOUER / SAUTER)
    if (e.key === " " || e.code === "Space") {
      e.preventDefault(); // Empêche le scroll de la page

      if (game_state === "Play") {
        bird_dy = -7;

        // Bruit de saut
        sound_jump.currentTime = 0;
        sound_jump
          .play()
          .catch((err) => console.log("Erreur audio saut :", err));
      }
      // Si game_state est 'Start', on permet aussi de lancer avec Espace la première fois
      else if (game_state === "Start") {
        startGame();
      }
    }

    // 2. GESTION DE LA TOUCHE ENTRÉE (UNIQUEMENT POUR RECOMMENCER)
    if (e.key === "Enter" || e.code === "Enter") {
      e.preventDefault();

      if (game_state === "End") {
        startGame();
      }
    }
  });

  // --- FONCTION POUR LANCER / REPRENDRE LE JEU ---
  function startGame() {
    document
      .querySelectorAll(".pipe_sprite")
      .forEach((element) => element.remove());

    // Réinitialisation complète des paramètres
    move_speed = 5;
    gravity = 0.35;
    pipe_gap = 38;

    img.style.display = "block";
    bird.style.top = "40vh";
    bird_dy = 0;
    game_state = "Play";

    message.innerHTML = "";
    message.classList.remove("messageStyle");
    score_title.innerHTML = "Score : ";
    score_val.innerHTML = "0";
    if (level_val) level_val.innerHTML = "1";

    requestAnimationFrame(move);
    requestAnimationFrame(apply_gravity);
    requestAnimationFrame(create_pipe);
  }

  // --- BOUCLE 1 : DÉPLACEMENT DES TUYAUX & HITBOX ---
  function move() {
    if (game_state !== "Play") return;

    let pipe_sprites = document.querySelectorAll(".pipe_sprite");
    bird_props = bird.getBoundingClientRect();

    pipe_sprites.forEach((element) => {
      let pipe_sprite_props = element.getBoundingClientRect();

      if (pipe_sprite_props.right <= 0) {
        element.remove();
      } else {
        if (
          bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width &&
          bird_props.left + bird_props.width > pipe_sprite_props.left &&
          bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height &&
          bird_props.top + bird_props.height > pipe_sprite_props.top
        ) {
          gameOver();
          return;
        } else {
          if (
            pipe_sprite_props.right < bird_props.left &&
            element.dataset.passed !== "true" &&
            element.classList.contains("pipe_score")
          ) {
            score_val.innerHTML = parseInt(score_val.innerHTML) + 1;
            element.dataset.passed = "true";

            Niveau();
          }
          element.style.left = pipe_sprite_props.left - move_speed + "px";
        }
      }
    });
    requestAnimationFrame(move);
  }

  // --- BOUCLE 2 : PHYSIQUE DE LA GRAVITÉ ---
  function apply_gravity() {
    if (game_state !== "Play") return;

    bird_dy += gravity;
    bird_props = bird.getBoundingClientRect();

    if (bird_props.top <= 0 || bird_props.bottom >= background.bottom) {
      gameOver();
      return;
    }

    bird.style.top = bird_props.top + bird_dy + "px";
    requestAnimationFrame(apply_gravity);
  }

  // --- BOUCLE 3 : GÉNÉRATION DES TUYAUX ---
  function create_pipe() {
    if (game_state !== "Play") return;

    if (pipe_separation > 100) {
      pipe_separation = 0;

      let pipe_posi = Math.floor(Math.random() * 40) + 10;

      // Tuyau Haut (Inversé)
      let pipe_sprite_inv = document.createElement("div");
      pipe_sprite_inv.className = "pipe_sprite pipe_flipped";
      pipe_sprite_inv.style.top = pipe_posi - 70 + "vh";
      pipe_sprite_inv.style.left = "100vw";
      document.body.appendChild(pipe_sprite_inv);

      // Tuyau Bas
      let pipe_sprite = document.createElement("div");
      pipe_sprite.className = "pipe_sprite pipe_score";
      pipe_sprite.style.top = pipe_posi + pipe_gap + "vh";
      pipe_sprite.style.left = "100vw";
      document.body.appendChild(pipe_sprite);
    }
    pipe_separation++;
    requestAnimationFrame(create_pipe);
  }

  // --- GESTION DES NIVEAUX DE DIFFICULTÉ ---
  function Niveau() {
    let actual_score = parseInt(score_val.innerHTML);
    let current_level = level_val ? level_val.innerHTML : "1";
    let next_level = "1";

    if (actual_score >= 30) {
      move_speed = 11;
      gravity = 0.65;
      pipe_gap = 34;
      next_level = "4";
    } else if (actual_score >= 20) {
      move_speed = 9;
      gravity = 0.55;
      pipe_gap = 35;
      next_level = "3";
    } else if (actual_score >= 10) {
      move_speed = 7;
      gravity = 0.45;
      pipe_gap = 36;
      next_level = "2";
    } else {
      move_speed = 5;
      gravity = 0.35;
      pipe_gap = 38;
      next_level = "1";
    }

    if (level_val && current_level !== next_level) {
      level_val.innerHTML = next_level;
      sound_levelup.currentTime = 0;
      sound_levelup
        .play()
        .catch((err) => console.log("Erreur audio niveau :", err));
    }
  }

  // --- FIN DE PARTIE ---
  function gameOver() {
    game_state = "End";

    sound_gameover.currentTime = 0;
    sound_gameover
      .play()
      .catch((err) => console.log("Erreur audio gameover :", err));

    // Texte mis à jour pour indiquer la touche Entrée !
    message.innerHTML =
      "GAME OVER <p><span>&uarr;</span> Appuie sur Entrée pour rejouer</p>";
    message.classList.add("messageStyle");
  }
}
