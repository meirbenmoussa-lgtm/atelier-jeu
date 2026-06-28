// === MACHINE À SOUS MARIO — mécanique + économie de pièces ===

const spinBtn = document.getElementById('spinBtn');

if (spinBtn) {

    /* =====================================================================
       1) CONFIGURATION (à ajuster pour rendre le jeu + ou - généreux)
       ===================================================================== */
    const PIECES_DEPART = 1000;   // pièces au démarrage
    const COUT_SPIN     = 20;     // coût d'un tour

    // Images des symboles
    const ROUGE  = '../img/Chmp-rouge.jpg';
    const GEANT  = '../img/grd-chmp.png';
    const VIOLET = '../img/Chmp-violet.jpg';
    const ETOILE = '../img/etoile.png';
    const SYMBOLS = [ROUGE, GEANT, VIOLET];   // symboles "normaux" des rouleaux

    const CHANCE_ETOILE    = 0.08;  // proba qu'une étoile sorte sur un rouleau (8%)
    const VIOLETS_DEFAITE  = 2;     // nb de violets qui déclenche la DÉFAITE
    const TOURS_INVINCIBLE = 2;     // durée du bouclier offert par l'étoile
    const CHANCE_BOUCLIER  = 0.5;   // chance que le bouclier bloque une défaite (1 sur 2)

    // Gains pour 3 symboles IDENTIQUES (pas de VIOLET : 3 violets = défaite, jamais un gain)
    const GAINS_TRIPLE = { [ROUGE]: 75, [GEANT]: 200 /* 💥 JACKPOT */ };
    const GAIN_PAIRE   = 4;         // 2 symboles identiques

    // Remplissage de la jauge de bonus (en %) selon le résultat
    const JAUGE_PAIRE = 12, JAUGE_TRIPLE = 35, JAUGE_JACKPOT = 55;

    /* =====================================================================
       2) ÉTAT DU JEU (les valeurs qui changent en jouant)
       ===================================================================== */
    let pieces              = PIECES_DEPART;
    let jauge               = 0;       // 0 → 100
    let multiplicateur      = 1;       // ×1 normal, ×2 pendant un bonus
    let toursMultiplicateur = 0;       // tours restants avec le multiplicateur
    let toursGratuits       = 0;       // spins gratuits restants
    let toursInvincible     = 0;       // tours de bouclier restants (donnés par l'étoile)
    let enCours             = false;   // un tour est-il en train de tourner ?

    // Statistiques (en mémoire seulement : remises à zéro à chaque chargement)
    let statsTours = 0, statsVictoires = 0, statsDefaites = 0;
    let statsBilan = 0;   // gain/perte net de pièces (tient compte du coût du spin)

    /* =====================================================================
       3) ÉLÉMENTS DU DOM (le HTML manipulé par le script)
       ===================================================================== */
    const reels       = ['r1', 'r2', 'r3'].map(id => document.getElementById(id));
    const message     = document.getElementById('message');
    const coinCount   = document.getElementById('coinCount');
    const coinCounter = document.getElementById('coinCounter');
    const gaugeEl     = document.getElementById('gauge');
    const gaugeFill   = document.getElementById('gaugeFill');
    const boostsEl    = document.getElementById('boosts');
    const coinLayer   = document.getElementById('coinLayer');
    const bonusBanner = document.getElementById('bonusBanner');
    const machine     = document.getElementById('machine');
    const spinCost    = document.getElementById('spinCost');
    const statsEl     = document.getElementById('stats');
    let   resetBtn    = null;

    // Petit utilitaire : renvoie un élément au hasard d'un tableau
    function auHasard(tableau) {
        return tableau[Math.floor(Math.random() * tableau.length)];
    }

    /* =====================================================================
       4) SONS (générés sans fichier audio, via Web Audio)
       ===================================================================== */
    let audioCtx = null;
    function getCtx() {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
            catch (e) { return null; }
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }
    // Joue une note (un "bip") qui démarre dans "debut" secondes
    function note(freq, debut, duree, type) {
        const ctx = getCtx(); if (!ctx) return;
        const t = ctx.currentTime + debut;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || 'square';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + duree);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + duree + 0.02);
    }
    // Joue une mélodie : une liste de notes espacées de "ecart" secondes
    function melodie(freqs, ecart, duree, type) {
        freqs.forEach((f, i) => note(f, i * ecart, duree, type));
    }
    const sonPiece   = () => melodie([988, 1319], 0.07, 0.22);
    const sonBonus   = () => melodie([523, 659, 784, 1047], 0.12, 0.18);
    const sonEtoile  = () => melodie([659, 784, 988, 1175, 1568], 0.08, 0.14);
    const sonDefaite = () => melodie([330, 247, 165, 98], 0.10, 0.16, 'sawtooth');

    /* =====================================================================
       5) AFFICHAGE (message, boutons, boosts, jauge)
       ===================================================================== */
    function setMessage(html, cls) {
        message.className = 'message' + (cls ? ' ' + cls : '');
        message.innerHTML = html;
    }

    function faireBoost(cls, txt) {
        const d = document.createElement('span');
        d.className = 'boost ' + cls;
        d.textContent = txt;
        return d;
    }

    function majAffichage() {
        // Badges des bonus actifs
        boostsEl.innerHTML = '';
        if (toursGratuits > 0)   boostsEl.appendChild(faireBoost('free',   '🎁 Gratuit ×' + toursGratuits));
        if (multiplicateur > 1)  boostsEl.appendChild(faireBoost('multi',  '⚡ ×' + multiplicateur + ' (' + toursMultiplicateur + ')'));
        if (toursInvincible > 0) boostsEl.appendChild(faireBoost('shield', '🛡️ Bouclier (' + toursInvincible + ')'));

        // Coût affiché sur le bouton SPIN
        if (toursGratuits > 0) {
            spinBtn.classList.add('free');
            spinCost.textContent = 'GRATUIT';
        } else {
            spinBtn.classList.remove('free');
            spinCost.innerHTML = '<span class="mario-coin mini"></span> ' + COUT_SPIN;
        }

        // On ne peut jouer que si le tour est fini et qu'on a de quoi payer
        spinBtn.disabled = enCours || (toursGratuits <= 0 && pieces < COUT_SPIN);
        gaugeFill.style.width = jauge + '%';
    }

    /* =====================================================================
       6) STATISTIQUES (victoires / défaites / bilan)
       ===================================================================== */
    function majStats() {
        if (!statsEl) return;
        const decides = statsVictoires + statsDefaites;     // tours "à enjeu"
        const taux  = decides ? Math.round(statsVictoires / decides * 100) : 0;
        const signe = statsBilan >= 0 ? '+' : '';
        statsEl.innerHTML =
            '🎰 Tours : <b>' + statsTours + '</b>' +
            ' · 🏆 Victoires : <b>' + statsVictoires + '</b>' +
            ' · 💀 Défaites : <b>' + statsDefaites + '</b>' +
            ' · 📊 <b>' + taux + '%</b>' +
            ' · 💰 Bilan : <b>' + signe + statsBilan + '</b> 🪙';
    }
    function resetStats() {
        statsTours = statsVictoires = statsDefaites = statsBilan = 0;
        majStats();
    }

    /* =====================================================================
       7) PIÈCES (compteur animé, pièces qui volent, gagner / perdre)
       ===================================================================== */
    // Le compteur monte/descend progressivement de "de" vers "vers"
    function animerCompteur(de, vers) {
        coinCounter.classList.remove('bump');
        void coinCounter.offsetWidth;            // relance l'animation "bump"
        coinCounter.classList.add('bump');
        const duree = 700, t0 = performance.now();
        function etape(now) {
            const p = Math.min(1, (now - t0) / duree);
            coinCount.textContent = Math.round(de + (vers - de) * p);
            if (p < 1) requestAnimationFrame(etape);
        }
        requestAnimationFrame(etape);
    }

    // Pièces dorées qui jaillissent depuis la machine
    function lancerPieces(nb) {
        const r = machine.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        for (let i = 0; i < nb; i++) {
            const wrap = document.createElement('div');
            wrap.className = 'fly-wrap';
            wrap.style.left = cx + 'px';
            wrap.style.top  = cy + 'px';
            wrap.style.setProperty('--dx', (Math.random() * 240 - 120).toFixed(0) + 'px');
            wrap.style.animationDelay = (i * 55) + 'ms';
            const coin = document.createElement('span');
            coin.className = 'mario-coin flying';
            wrap.appendChild(coin);
            coinLayer.appendChild(wrap);
            setTimeout(sonPiece, i * 55);
            wrap.addEventListener('animationend', () => wrap.remove());
        }
    }

    function gagnerPieces(n) {
        const avant = pieces;
        pieces += n; statsBilan += n;
        lancerPieces(Math.max(3, Math.min(14, Math.round(n / 4))));
        animerCompteur(avant, pieces);
    }
    function perdrePieces(n) {
        n = Math.min(n, pieces);                  // jamais en dessous de 0
        const avant = pieces;
        pieces -= n; statsBilan -= n;
        animerCompteur(avant, pieces);
        return n;
    }

    /* =====================================================================
       8) JAUGE & BONUS (la barre qui se remplit puis offre un bonus)
       ===================================================================== */
    function remplirJauge(p) {
        jauge += p;
        if (jauge < 100) { gaugeFill.style.width = jauge + '%'; return; }
        jauge -= 100;                             // on garde le surplus
        gaugeFill.style.width = '100%';
        gaugeEl.classList.add('full');
        setTimeout(() => {
            gaugeEl.classList.remove('full');
            declencherBonus();
            gaugeFill.style.width = jauge + '%';
        }, 700);
    }

    function declencherBonus() {
        const bonus = [
            () => { gagnerPieces(50);                              montrerBanniere('🎁 BONUS<br>+50 PIÈCES !'); },
            () => { toursGratuits += 3;                            montrerBanniere('🎁 BONUS<br>3 SPINS GRATUITS !'); },
            () => { multiplicateur = 2; toursMultiplicateur = 5;   montrerBanniere('⚡ BONUS<br>GAINS ×2 (5 tours) !'); },
        ];
        auHasard(bonus)();
        sonBonus();
        majAffichage();
    }

    function montrerBanniere(html) {
        bonusBanner.innerHTML = html;
        bonusBanner.classList.remove('show');
        void bonusBanner.offsetWidth;             // relance l'animation
        bonusBanner.classList.add('show');
    }

    /* =====================================================================
       9) ÉTOILE (bouclier) & VIOLET (défaite)
       ===================================================================== */
    // Effet visuel tiré au hasard quand un gadget apparaît
    function effetVisuelAleatoire() {
        const choix = auHasard(['flash', 'rainbow', 'shake']);
        if (choix === 'shake') {
            machine.classList.remove('shake');
            void machine.offsetWidth;
            machine.classList.add('shake');
            setTimeout(() => machine.classList.remove('shake'), 600);
        } else {
            const flash = document.createElement('div');
            flash.className = 'flash' + (choix === 'rainbow' ? ' rainbow' : '');
            document.body.appendChild(flash);
            flash.addEventListener('animationend', () => flash.remove());
        }
    }

    // ⭐ Étoile = bouclier de chance pour les prochains tours
    function activerInvincibilite() {
        effetVisuelAleatoire();
        sonEtoile();
        toursInvincible = TOURS_INVINCIBLE;
        montrerBanniere('⭐ ÉTOILE ⭐<br>BOUCLIER ' + TOURS_INVINCIBLE + ' TOURS !');
        setMessage('⭐ Bouclier de chance&nbsp;! Il bloque parfois les défaites 🛡️', 'gain');
    }

    // 🍄 Trop de violets = défaite tirée au hasard
    function effetDefaite(nbViolets) {
        effetVisuelAleatoire();
        sonDefaite();
        const effets = [
            () => { const n = perdrePieces(50 * nbViolets);
                    montrerBanniere('💣 BOMBE !<br>-' + n + ' 🪙');
                    setMessage('💣 Aïe&nbsp;! Une bombe… -' + n + ' 🪙', 'perte'); },
            () => { jauge = 0; gaugeFill.style.width = '0%';
                    montrerBanniere('👻 MALÉDICTION<br>Jauge perdue !');
                    setMessage('👻 Un Boo efface ta jauge de bonus…', 'perte'); },
            () => { const n = perdrePieces(Math.round(pieces * 0.15));
                    montrerBanniere('🦝 VOLEUR !<br>-' + n + ' 🪙');
                    setMessage('🦝 Un voleur file avec ' + n + ' 🪙 !', 'perte'); },
        ];
        auHasard(effets)();
    }

    /* =====================================================================
       10) ROULEAUX (tirage des symboles + animation de défilement)
       ===================================================================== */
    const symboleAuHasard = () => auHasard(SYMBOLS);

    // Symbole final d'un rouleau : petite chance de tomber sur l'étoile
    const tirageFinal = () => Math.random() < CHANCE_ETOILE ? ETOILE : symboleAuHasard();

    const STARTERS  = [symboleAuHasard(), symboleAuHasard(), symboleAuHasard()]; // affichage au repos
    const STRIP_LEN = 26;                     // nb de symboles qui défilent

    // Crée une "case" (une image dans une fenêtre du rouleau)
    function faireCellule(src, h) {
        const cell = document.createElement('div');
        cell.className = 'reel-cell';
        if (h) cell.style.height = h + 'px';
        const img = document.createElement('img');
        img.className = 'symbol';
        img.src = src;
        img.alt = 'symbole';
        cell.appendChild(img);
        return cell;
    }

    // Affiche UN seul symbole immobile dans un rouleau
    function poserSymbole(strip, src) {
        const h = strip.parentElement.clientHeight;
        strip.style.transition = 'none';
        strip.style.transform  = 'translateY(0px)';
        strip.innerHTML = '';
        strip.appendChild(faireCellule(src, h));
    }

    // État au repos : un symbole par rouleau
    function afficherStatique() {
        if (enCours) return;
        reels.forEach((strip, i) => poserSymbole(strip, STARTERS[i]));
    }

    // Fait défiler le rouleau i puis l'arrête sur finalSym
    function tournerRouleau(i, finalSym, duree) {
        const strip = reels[i], reel = strip.parentElement;
        const h = reel.clientHeight;

        // Bande de symboles au hasard, avec finalSym tout en bas
        strip.style.transition = 'none';
        strip.style.transform  = 'translateY(0px)';
        strip.innerHTML = '';
        for (let k = 0; k < STRIP_LEN; k++) {
            strip.appendChild(faireCellule(k === STRIP_LEN - 1 ? finalSym : symboleAuHasard(), h));
        }

        reel.classList.add('spinning');           // flou de mouvement
        void strip.offsetHeight;                  // force le calcul avant d'animer
        strip.style.transition = 'transform ' + duree + 'ms cubic-bezier(.12,.78,.28,1)';
        strip.style.transform  = 'translateY(' + (-(STRIP_LEN - 1) * h) + 'px)';

        // À l'arrêt : on enlève le flou et on ne garde que le symbole final
        setTimeout(() => {
            reel.classList.remove('spinning');
            poserSymbole(strip, finalSym);
        }, duree + 30);
    }

    /* =====================================================================
       11) TOUR DE JEU (clic sur SPIN → on tourne → on évalue)
       ===================================================================== */
    spinBtn.addEventListener('click', () => {
        if (enCours) return;
        if (toursGratuits <= 0 && pieces < COUT_SPIN) { afficherManque(); return; }

        // Paiement du tour
        if (toursGratuits > 0) {
            toursGratuits--;
        } else {
            pieces -= COUT_SPIN;
            statsBilan -= COUT_SPIN;              // le coût du spin compte dans le bilan
            coinCount.textContent = pieces;
        }
        cacherReset();
        setMessage('', '');
        enCours = true;
        majAffichage();

        // On lance les 3 rouleaux ; ils s'arrêtent les uns après les autres
        const finals = [tirageFinal(), tirageFinal(), tirageFinal()];
        const durees = [1100, 1500, 1900];
        reels.forEach((strip, i) => tournerRouleau(i, finals[i], durees[i]));

        // Quand le dernier rouleau s'arrête → on évalue le résultat
        setTimeout(() => {
            enCours = false;
            evaluer(finals);
            majAffichage();
        }, durees[2] + 80);
    });

    function evaluer(finals) {
        const [a, b, c] = finals;
        const nbEtoiles = finals.filter(s => s === ETOILE).length;
        const nbViolets = finals.filter(s => s === VIOLET).length;
        statsTours++;

        if (nbEtoiles > 0) {
            activerInvincibilite();               // ⭐ étoile → bouclier (prioritaire)
        } else {
            const protege = toursInvincible > 0;  // bouclier encore actif ?
            if (protege) toursInvincible--;

            if (nbViolets >= VIOLETS_DEFAITE) {
                // 🍄 défaite, sauf si le bouclier la bloque (au hasard)
                if (protege && Math.random() < CHANCE_BOUCLIER) {
                    montrerBanniere('🛡️ BOUCLIER<br>Défaite évitée !');
                    setMessage('🛡️ Coup de chance&nbsp;! Le bouclier te sauve', 'gain');
                } else {
                    statsDefaites++;
                    effetDefaite(nbViolets);
                }
            } else {
                // Cas normal : triple, paire, ou rien
                let gain = 0, type = 'rien';
                if (a === b && b === c) {
                    gain = GAINS_TRIPLE[a] || 20;
                    type = (a === GEANT) ? 'jackpot' : 'triple';
                } else if (a === b || a === c || b === c) {
                    gain = GAIN_PAIRE; type = 'paire';
                }
                if (gain > 0) gain *= multiplicateur;

                if (type === 'jackpot')     setMessage('💥 JACKPOT&nbsp;! +' + gain + ' 🪙', 'jackpot');
                else if (type === 'triple') setMessage('🎉 GAGNÉ&nbsp;! +' + gain + ' 🪙', 'gain');
                else if (type === 'paire')  setMessage('👍 Une paire&nbsp;! +' + gain + ' 🪙', 'gain');
                else                        setMessage('Dommage… retente ta chance&nbsp;!', 'perte');

                if (gain > 0) {
                    statsVictoires++;
                    gagnerPieces(gain);
                    remplirJauge(type === 'paire' ? JAUGE_PAIRE : type === 'jackpot' ? JAUGE_JACKPOT : JAUGE_TRIPLE);
                }
            }
        }

        majStats();

        // Le multiplicateur temporaire perd un tour
        if (toursMultiplicateur > 0 && --toursMultiplicateur === 0) multiplicateur = 1;

        // Plus assez de pièces pour rejouer ?
        if (toursGratuits <= 0 && pieces < COUT_SPIN) afficherManque();
    }

    /* =====================================================================
       12) PLUS DE PIÈCES (bouton "Recommencer")
       ===================================================================== */
    function afficherManque() {
        setMessage('Plus assez de pièces&nbsp;! Gagne-en ou recommence 🪙', 'warn');
        if (!resetBtn) {
            resetBtn = document.createElement('button');
            resetBtn.className = 'reset-btn';
            resetBtn.textContent = '🔄 Recommencer avec ' + PIECES_DEPART + ' 🪙';
            resetBtn.addEventListener('click', () => {
                pieces = PIECES_DEPART; jauge = 0;
                multiplicateur = 1; toursMultiplicateur = 0;
                toursGratuits = 0; toursInvincible = 0;
                coinCount.textContent = pieces;
                setMessage('', '');
                resetBtn.style.display = 'none';
                majAffichage();
            });
            message.insertAdjacentElement('afterend', resetBtn);
        }
        resetBtn.style.display = 'inline-block';
    }
    function cacherReset() { if (resetBtn) resetBtn.style.display = 'none'; }

    /* =====================================================================
       13) DÉMARRAGE (au chargement de la page)
       ===================================================================== */
    // Efface une éventuelle ancienne sauvegarde : plus aucune mémoire entre les parties
    try { localStorage.removeItem('marioJackpotStats'); } catch (e) { /* ignore */ }
    majStats();
    if (statsEl) {
        statsEl.title = 'Clique pour remettre les statistiques à zéro';
        statsEl.addEventListener('click', () => {
            if (confirm('Remettre les statistiques à zéro ?')) resetStats();
        });
    }
    coinCount.textContent = pieces;
    majAffichage();

    // Affichage initial des rouleaux (recalculé une fois l'image de la machine chargée)
    const machineImg = document.querySelector('.machine-img');
    if (machineImg && !machineImg.complete) machineImg.addEventListener('load', afficherStatique);
    afficherStatique();
    window.addEventListener('resize', afficherStatique);
}
