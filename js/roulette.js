// === MACHINE À SOUS MARIO — mécanique + économie de pièces ===
// 1) CONFIGURATION
const PIECES_DEPART = 1000, COUT_SPIN = 20;
const ROUGE = '../img/Chmp-rouge.jpg', GEANT = '../img/grd-chmp.png';
const VIOLET = '../img/Chmp-violet.jpg', ETOILE = '../img/etoile.png';
const SYMBOLS = [ROUGE, GEANT, VIOLET];
const CHANCE_ETOILE = 0.08, VIOLETS_DEFAITE = 2, TOURS_INVINCIBLE = 2, CHANCE_BOUCLIER = 0.5;
const GAINS_TRIPLE = { [ROUGE]: 75, [GEANT]: 200 };   // 3 identiques (200 = jackpot)
const GAIN_PAIRE = 20;                                 // 2 identiques
const JAUGE_PAIRE = 12, JAUGE_TRIPLE = 35, JAUGE_JACKPOT = 55;
// 2) ÉTAT DU JEU
let pieces = PIECES_DEPART, jauge = 0;
let multiplicateur = 1, toursMultiplicateur = 0, toursGratuits = 0, toursInvincible = 0, enCours = false;
let statsTours = 0, statsVictoires = 0, statsDefaites = 0, statsBilan = 0;
// 3) ÉLÉMENTS DU DOM
const spinBtn     = document.getElementById('spinBtn');
const reels       = ['r1', 'r2', 'r3'].map(id => document.getElementById(id));
const message     = document.getElementById('message');
const coinCount   = document.getElementById('coinCount');
const coinCounter = document.getElementById('coinCounter');
const gaugeEl     = document.getElementById('gauge');
const gaugeFill   = document.getElementById('gaugeFill');
const boostsEl    = document.getElementById('boosts');
const bonusBanner = document.getElementById('bonusBanner');
const spinCost    = document.getElementById('spinCost');
const statsEl     = document.getElementById('stats');
let   resetBtn    = null;
const auHasard = (t) => t[Math.floor(Math.random() * t.length)];
// 4) SONS (fichiers .mp3)
function jouerSon(fichier) { new Audio('../audio/' + fichier + '.mp3').play().catch(() => {}); }
const sonGain = () => jouerSon('level-up');
const sonDefaite = () => jouerSon('game-over');
// 5) AFFICHAGE (message, bouton SPIN, badges de bonus, jauge)
function setMessage(html, cls) { message.className = 'message' + (cls ? ' ' + cls : ''); message.innerHTML = html; }
function faireBoost(cls, txt) { const d = document.createElement('span'); d.className = 'boost ' + cls; d.textContent = txt; return d; }
function majAffichage() {
    boostsEl.innerHTML = '';
    if (toursGratuits > 0)   boostsEl.appendChild(faireBoost('free',   '🎁 Gratuit ×' + toursGratuits));
    if (multiplicateur > 1)  boostsEl.appendChild(faireBoost('multi',  '⚡ ×' + multiplicateur + ' (' + toursMultiplicateur + ')'));
    if (toursInvincible > 0) boostsEl.appendChild(faireBoost('shield', '🛡️ Bouclier (' + toursInvincible + ')'));
    if (toursGratuits > 0) { spinBtn.classList.add('free'); spinCost.textContent = 'GRATUIT'; }
    else { spinBtn.classList.remove('free'); spinCost.innerHTML = '<span class="mario-coin mini"></span> ' + COUT_SPIN; }
    spinBtn.disabled = enCours || (toursGratuits <= 0 && pieces < COUT_SPIN);
    gaugeFill.style.width = jauge + '%';
}
// 6) STATISTIQUES
function majStats() {
    if (!statsEl) return;
    const decides = statsVictoires + statsDefaites;
    const taux = decides ? Math.round(statsVictoires / decides * 100) : 0;
    const signe = statsBilan >= 0 ? '+' : '';
    statsEl.innerHTML = '🎰 Tours : <b>' + statsTours + '</b> · 🏆 Victoires : <b>' + statsVictoires +
        '</b> · 💀 Défaites : <b>' + statsDefaites + '</b> · 📊 <b>' + taux + '%</b> · 💰 Bilan : <b>' + signe + statsBilan + '</b> 🪙';
}
function resetStats() { statsTours = statsVictoires = statsDefaites = statsBilan = 0; majStats(); }
// 7) PIÈCES (afficher le total avec un petit "bond", gagner / perdre)
function majCompteur() { coinCount.textContent = pieces; coinCounter.classList.remove('bump'); void coinCounter.offsetWidth; coinCounter.classList.add('bump'); }
function gagnerPieces(n) { pieces += n; statsBilan += n; majCompteur(); }
function perdrePieces(n) { n = Math.min(n, pieces); pieces -= n; statsBilan -= n; majCompteur(); return n; }
// 8) JAUGE & BONUS
function remplirJauge(p) {
    jauge += p;
    if (jauge < 100) { gaugeFill.style.width = jauge + '%'; return; }
    jauge -= 100; gaugeFill.style.width = '100%'; gaugeEl.classList.add('full');   // jauge pleine → bonus
    setTimeout(() => { gaugeEl.classList.remove('full'); declencherBonus(); gaugeFill.style.width = jauge + '%'; }, 700);
}
function declencherBonus() {
    const bonus = [
        () => { gagnerPieces(50);                            montrerBanniere('🎁 BONUS<br>+50 PIÈCES !'); },
        () => { toursGratuits += 3;                          montrerBanniere('🎁 BONUS<br>3 SPINS GRATUITS !'); },
        () => { multiplicateur = 2; toursMultiplicateur = 5; montrerBanniere('⚡ BONUS<br>GAINS ×2 (5 tours) !'); },
    ];
    auHasard(bonus)(); sonGain(); majAffichage();
}
function montrerBanniere(html) {
    bonusBanner.innerHTML = html;
    bonusBanner.classList.remove('show'); void bonusBanner.offsetWidth; bonusBanner.classList.add('show');  // relance l'animation
}
// 9) ÉTOILE (bouclier) & VIOLET (défaite)
function activerInvincibilite() {
    sonGain();
    toursInvincible = TOURS_INVINCIBLE;
    montrerBanniere('⭐ ÉTOILE ⭐<br>BOUCLIER ' + TOURS_INVINCIBLE + ' TOURS !');
    setMessage('⭐ Bouclier de chance&nbsp;! Il bloque parfois les défaites 🛡️', 'gain');
}
function effetDefaite(nbViolets) {
    sonDefaite();
    const effets = [
        () => { const n = perdrePieces(50 * nbViolets); montrerBanniere('💣 BOMBE !<br>-' + n + ' 🪙'); setMessage('💣 Aïe&nbsp;! Une bombe… -' + n + ' 🪙', 'perte'); },
        () => { jauge = 0; gaugeFill.style.width = '0%'; montrerBanniere('👻 MALÉDICTION<br>Jauge perdue !'); setMessage('👻 Un Boo efface ta jauge de bonus…', 'perte'); },
        () => { const n = perdrePieces(Math.round(pieces * 0.15)); montrerBanniere('🦝 VOLEUR !<br>-' + n + ' 🪙'); setMessage('🦝 Un voleur file avec ' + n + ' 🪙 !', 'perte'); },
    ];
    auHasard(effets)();
}
// 10) ROULEAUX (tirage des symboles + animation de défilement)
const symboleAuHasard = () => auHasard(SYMBOLS);
const tirageFinal = () => Math.random() < CHANCE_ETOILE ? ETOILE : symboleAuHasard();   // petite chance d'étoile
const STARTERS = [symboleAuHasard(), symboleAuHasard(), symboleAuHasard()];
const STRIP_LEN = 26;
function faireCellule(src, h) {
    const cell = document.createElement('div'); cell.className = 'reel-cell';
    if (h) cell.style.height = h + 'px';
    const img = document.createElement('img'); img.className = 'symbol'; img.src = src; img.alt = 'symbole';
    cell.appendChild(img); return cell;
}
function poserSymbole(strip, src) {          // un seul symbole immobile
    strip.style.transition = 'none'; strip.style.transform = 'translateY(0px)'; strip.innerHTML = '';
    strip.appendChild(faireCellule(src, strip.parentElement.clientHeight));
}
function afficherStatique() { if (!enCours) reels.forEach((strip, i) => poserSymbole(strip, STARTERS[i])); }   // état au repos
function tournerRouleau(i, finalSym, duree) {
    const strip = reels[i], reel = strip.parentElement, h = reel.clientHeight;
    strip.style.transition = 'none'; strip.style.transform = 'translateY(0px)';
    strip.innerHTML = '';
    for (let k = 0; k < STRIP_LEN; k++)
        strip.appendChild(faireCellule(k === STRIP_LEN - 1 ? finalSym : symboleAuHasard(), h));
    reel.classList.add('spinning');          // flou de mouvement
    void strip.offsetHeight;                 // force le calcul avant d'animer
    strip.style.transition = 'transform ' + duree + 'ms cubic-bezier(.12,.78,.28,1)';
    strip.style.transform = 'translateY(' + (-(STRIP_LEN - 1) * h) + 'px)';
    setTimeout(() => { reel.classList.remove('spinning'); poserSymbole(strip, finalSym); }, duree + 30);
}
// 11) TOUR DE JEU (clic SPIN → on tourne → on évalue)
spinBtn.addEventListener('click', () => {
    if (enCours) return;
    if (toursGratuits <= 0 && pieces < COUT_SPIN) { afficherManque(); return; }
    if (toursGratuits > 0) toursGratuits--;
    else { pieces -= COUT_SPIN; statsBilan -= COUT_SPIN; coinCount.textContent = pieces; }
    cacherReset(); setMessage('', ''); enCours = true; majAffichage();
    const finals = [tirageFinal(), tirageFinal(), tirageFinal()];
    const durees = [1100, 1500, 1900];
    reels.forEach((strip, i) => tournerRouleau(i, finals[i], durees[i]));
    setTimeout(() => { enCours = false; evaluer(finals); majAffichage(); }, durees[2] + 80);
});
function evaluer(finals) {
    const [a, b, c] = finals;
    const nbEtoiles = finals.filter(s => s === ETOILE).length;
    const nbViolets = finals.filter(s => s === VIOLET).length;
    statsTours++;
    if (nbEtoiles > 0) {
        activerInvincibilite();                   // ⭐ étoile = bouclier (prioritaire)
    } else {
        const protege = toursInvincible > 0;
        if (protege) toursInvincible--;
        if (nbViolets >= VIOLETS_DEFAITE) {       // 🍄 trop de violets = défaite
            if (protege && Math.random() < CHANCE_BOUCLIER) {
                montrerBanniere('🛡️ BOUCLIER<br>Défaite évitée !');
                setMessage('🛡️ Coup de chance&nbsp;! Le bouclier te sauve', 'gain');
            } else { statsDefaites++; effetDefaite(nbViolets); }
        } else {                                  // triple, paire ou rien
            let gain = 0, type = 'rien';
            if (a === b && b === c) { gain = GAINS_TRIPLE[a] || 20; type = (a === GEANT) ? 'jackpot' : 'triple'; }
            else if (a === b || a === c || b === c) { gain = GAIN_PAIRE; type = 'paire'; }
            if (gain > 0) gain *= multiplicateur;
            if (type === 'jackpot')     setMessage('💥 JACKPOT&nbsp;! +' + gain + ' 🪙', 'jackpot');
            else if (type === 'triple') setMessage('🎉 GAGNÉ&nbsp;! +' + gain + ' 🪙', 'gain');
            else if (type === 'paire')  setMessage('👍 Une paire&nbsp;! +' + gain + ' 🪙', 'gain');
            else                        setMessage('Dommage… retente ta chance&nbsp;!', 'perte');
            if (gain > 0) {
                statsVictoires++; sonGain(); gagnerPieces(gain);
                remplirJauge(type === 'paire' ? JAUGE_PAIRE : type === 'jackpot' ? JAUGE_JACKPOT : JAUGE_TRIPLE);
            }
        }
    }
    majStats();
    if (toursMultiplicateur > 0 && --toursMultiplicateur === 0) multiplicateur = 1;   // le ×2 perd un tour
    if (toursGratuits <= 0 && pieces < COUT_SPIN) afficherManque();
}
// 12) PLUS DE PIÈCES (bouton "Recommencer")
function afficherManque() {
    setMessage('Plus assez de pièces&nbsp;! Gagne-en ou recommence 🪙', 'warn');
    if (!resetBtn) {
        resetBtn = document.createElement('button');
        resetBtn.className = 'reset-btn';
        resetBtn.textContent = '🔄 Recommencer avec ' + PIECES_DEPART + ' 🪙';
        resetBtn.addEventListener('click', () => {
            pieces = PIECES_DEPART; jauge = 0; multiplicateur = 1;
            toursMultiplicateur = 0; toursGratuits = 0; toursInvincible = 0;
            coinCount.textContent = pieces; setMessage('', ''); resetBtn.style.display = 'none'; majAffichage();
        });
        message.insertAdjacentElement('afterend', resetBtn);
    }
    resetBtn.style.display = 'inline-block';
}
function cacherReset() { if (resetBtn) resetBtn.style.display = 'none'; }
// 13) DÉMARRAGE
try { localStorage.removeItem('marioJackpotStats'); } catch (e) {}   // pas de mémoire entre parties
majStats();
if (statsEl) {
    statsEl.title = 'Clique pour remettre les statistiques à zéro';
    statsEl.addEventListener('click', () => { if (confirm('Remettre les statistiques à zéro ?')) resetStats(); });
}
coinCount.textContent = pieces;
majAffichage();
const machineImg = document.querySelector('.machine-img');
if (machineImg && !machineImg.complete) machineImg.addEventListener('load', afficherStatique);
afficherStatique();
window.addEventListener('resize', afficherStatique);
