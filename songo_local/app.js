// Auteur : MOAKO EKANGO BILL ARMEL - Matricule : 24F2686
// Gestion du jeu Songo

var tab_jeu = Array(14).fill(5);
var pts = [0, 0];
var numJoueur = 1; // 1: Sud, 2: Nord
var blockUi = false;

// variables pour la demo
var modeDemo = false;
var tmrDemo = null;

// dom elements
var lblTour = document.getElementById('indicateur-tour');
var btnReset = document.getElementById('bouton-reinitialiser');
var btnAddGraines = document.getElementById('bouton-ajouter-graines');
var btnDemo = document.getElementById('bouton-demo');
var divAlerts = document.getElementById('zone-alertes');

var lesCases = [];
for(var i=0; i<14; i++) {
    lesCases.push(document.getElementById('case-' + i));
}

// affichage scores greniers
var restJ1 = document.getElementById('graines-restantes-j1');
var restJ2 = document.getElementById('graines-restantes-j2');
var priseJ1 = document.getElementById('prises-j1');
var priseJ2 = document.getElementById('prises-j2');
var nameLbl1 = document.getElementById('label-nom-j1');
var nameLbl2 = document.getElementById('label-nom-j2');

var inputNom1 = document.getElementById('nom-j1');
var inputNom2 = document.getElementById('nom-j2');

var modalRules = document.getElementById('modal-regles');
var btnRegles = document.getElementById('bouton-regles');
var btnFermerModal = document.querySelector('.fermer-modal');

function getPlayerName(num) {
    if(num === 1) {
        var v = inputNom1.value.trim();
        return v !== "" ? v : "Sud";
    } else {
        var v = inputNom2.value.trim();
        return v ? v : "Nord";
    }
}

function nextIdx(idx) {
    if(idx >= 0 && idx <= 6) {
        if(idx == 0) return 7;
        return idx - 1;
    } else {
        if(idx == 13) return 6;
        return idx + 1;
    }
}

function prevIdx(idx) {
    if(idx >= 0 && idx <= 6) {
        if(idx == 6) return 13;
        return idx + 1;
    } else {
        if(idx == 7) return 0;
        return idx - 1;
    }
}

function isOpponent(idx, j) {
    if(j == 1) {
        return (idx >= 7 && idx <= 13);
    } else {
        return (idx >= 0 && idx <= 6);
    }
}

function showMsg(msg) {
    if(msg != "") {
        divAlerts.innerText = msg;
        divAlerts.style.display = 'flex';
    } else {
        divAlerts.style.display = 'none';
    }
}

function calculEnvoi(depart) {
    var nb = tab_jeu[depart];
    if(nb == 0) return 0;

    var envoyes = 0;
    if(nb > 13) {
        var crt = nextIdx(depart);
        for(var k=0; k<13; k++) {
            if(isOpponent(crt, numJoueur)) envoyes++;
            crt = nextIdx(crt);
        }
        envoyes += (nb - 13);
    } else {
        var crt = nextIdx(depart);
        while(nb > 0) {
            if(isOpponent(crt, numJoueur)) envoyes++;
            crt = nextIdx(crt);
            nb--;
        }
    }
    return envoyes;
}

function getLegalMoves() {
    var start = (numJoueur == 1) ? 0 : 7;
    var end = (numJoueur == 1) ? 6 : 13;
    var d7 = (numJoueur == 1) ? 0 : 13;

    var pos = [];
    for(var i=start; i<=end; i++) {
        if(tab_jeu[i] > 0) {
            pos.push(i);
        }
    }

    // regle case 7
    var filtres = pos.filter(function(x) {
        if(x == d7 && (tab_jeu[x] == 1 || tab_jeu[x] == 2)) {
            // verifier si on a d'autres choix
            for(var b=0; b<pos.length; b++) {
                if(pos[b] != d7) return true;
            }
            return false;
        }
        return true;
    });

    var opSt = (numJoueur == 1) ? 7 : 0;
    var opEn = (numJoueur == 1) ? 13 : 6;
    var empty = true;
    
    for(var w=opSt; w<=opEn; w++) {
        if(tab_jeu[w] > 0) { empty = false; break; }
    }

    if(empty == false) return filtres;

    // solidarite
    var mapEnvois = [];
    for(var e=0; e<filtres.length; e++) {
        mapEnvois.push({ c: filtres[e], val: calculEnvoi(filtres[e]) });
    }

    var valid7 = [];
    for(var e=0; e<mapEnvois.length; e++) {
        if(mapEnvois[e].val >= 7) valid7.push(mapEnvois[e].c);
    }
    if(valid7.length > 0) return valid7;

    var max = 0;
    for(var e=0; e<mapEnvois.length; e++) {
        if(mapEnvois[e].val > max) max = mapEnvois[e].val;
    }
    if(max > 0) {
        var resp = [];
        for(var e=0; e<mapEnvois.length; e++) {
            if(mapEnvois[e].val == max) resp.push(mapEnvois[e].c);
        }
        return resp;
    }

    return [];
}

function redraw(hl = -1, distrib = -1) {
    var legals = blockUi ? [] : getLegalMoves();

    for(var idx=0; idx<14; idx++) {
        var item = lesCases[idx];
        item.innerHTML = tab_jeu[idx];
        item.className = 'case';
        if(legals.indexOf(idx) !== -1) item.classList.add('rangee-active');
        if(idx === hl) item.classList.add('mise-en-valeur');
        if(idx === distrib) item.classList.add('en-cours-distribution');
    }

    lblTour.innerHTML = "Tour : " + getPlayerName(numJoueur);

    var c1=0, c2=0;
    for(var u=0; u<=6; u++) c1 += tab_jeu[u];
    for(var u=7; u<=13; u++) c2 += tab_jeu[u];

    restJ1.innerHTML = c1;
    restJ2.innerHTML = c2;
    priseJ1.innerHTML = pts[0];
    priseJ2.innerHTML = pts[1];
    
    nameLbl1.innerHTML = getPlayerName(1);
    nameLbl2.innerHTML = getPlayerName(2);
}

function playDelay() {
    return new Promise(function(resolve) {
        setTimeout(resolve, 400);
    });
}

async function clicAction(idxObj) {
    if(blockUi) return;

    var autorises = getLegalMoves();
    if(autorises.indexOf(idxObj) < 0) {
        showMsg("Coup non autorisé ! (Solidarité ou interdit)");
        if(modeDemo) stopD();
        return;
    }

    showMsg("");
    blockUi = true;
    var valGraines = tab_jeu[idxObj];
    tab_jeu[idxObj] = 0;
    redraw(-1, idxObj);
    await playDelay();

    var isJ1 = (idxObj >= 0 && idxObj <= 6);
    var c7 = isJ1 ? 0 : 13;

    // don direct adversaire
    if(idxObj == c7 && (valGraines == 1 || valGraines == 2)) {
        var op = (numJoueur == 1) ? 1 : 0;
        pts[op] += valGraines;
        redraw();
        await playDelay();
        numJoueur = (numJoueur == 1) ? 2 : 1;
        blockUi = false;
        redraw();
        checkEnd();
        return;
    }

    var pos = idxObj;
    var nbDist = 0;

    if(valGraines > 13) {
        pos = nextIdx(idxObj);
        for(var n=0; n<13; n++) {
            tab_jeu[pos]++;
            nbDist++;
            redraw(pos, idxObj);
            await playDelay();
            pos = nextIdx(pos);
        }

        var rst = valGraines - 13;
        var adv = isJ1 ? 7 : 0;
        while(rst > 0) {
            tab_jeu[adv]++;
            nbDist++;
            redraw(adv, idxObj);
            await playDelay();
            if(rst > 1) {
                if(isJ1) {
                    adv = (adv == 13) ? 7 : adv+1;
                } else {
                    adv = (adv == 6) ? 0 : adv+1;
                }
            }
            rst--;
        }
        pos = adv;
    } else {
        pos = nextIdx(idxObj);
        while(valGraines > 0) {
            tab_jeu[pos]++;
            nbDist++;
            redraw(pos, idxObj);
            await playDelay();
            if(valGraines > 1) pos = nextIdx(pos);
            valGraines--;
        }
    }

    var der = pos;

    // check prises
    if(isOpponent(der, numJoueur)) {
        var c1adv = (numJoueur == 1) ? 7 : 0;
        var listePrises = [];

        if(der == c1adv) {
            if(nbDist >= 14) listePrises.push({ c: der, val: 1, p: '1' });
        } else if(tab_jeu[der] >= 2 && tab_jeu[der] <= 4) {
            listePrises.push({ c: der, val: tab_jeu[der], p: 'n' });
            var pCheck = prevIdx(der);
            while(isOpponent(pCheck, numJoueur)) {
                if(pCheck == c1adv) {
                    if(tab_jeu[pCheck] >= 2 && tab_jeu[pCheck] <= 4) {
                        listePrises.push({ c: pCheck, val: tab_jeu[pCheck], p: 'n' });
                    }
                    break;
                } else if(tab_jeu[pCheck] >= 2 && tab_jeu[pCheck] <= 4) {
                    listePrises.push({ c: pCheck, val: tab_jeu[pCheck], p: 'n' });
                    pCheck = prevIdx(pCheck);
                } else {
                    break;
                }
            }
        }

        if(listePrises.length > 0) {
            var stO = (numJoueur == 1) ? 7 : 0;
            var enO = (numJoueur == 1) ? 13 : 6;
            var totAdv = 0;
            for(var z=stO; z<=enO; z++) totAdv += tab_jeu[z];

            var checkP = 0;
            for(var x=0; x<listePrises.length; x++) {
                checkP += (listePrises[x].p == '1') ? 1 : listePrises[x].val;
            }

            if(totAdv == checkP) {
                showMsg("Capture annulée : interdit de vider complètement le camp adverse !");
            } else {
                for(var z=0; z<listePrises.length; z++) {
                    var lp = listePrises[z];
                    if(lp.p == '1') {
                        tab_jeu[lp.c]--;
                        pts[numJoueur - 1]++;
                    } else {
                        pts[numJoueur - 1] += lp.val;
                        tab_jeu[lp.c] = 0;
                    }
                }
                redraw();
                await playDelay();
            }
        }
    }

    numJoueur = (numJoueur == 1) ? 2 : 1;
    blockUi = false;
    redraw();
    checkEnd();
}

function checkEnd() {
    var nom1 = getPlayerName(1);
    var nom2 = getPlayerName(2);

    if(pts[0] >= 40) {
        showMsg("🏆 FIN : Victoire de " + nom1 + " (" + pts[0] + ")");
        blockUi = true;
        if(modeDemo) stopD();
        return;
    }
    if(pts[1] >= 40) {
        showMsg("🏆 FIN : Victoire de " + nom2 + " (" + pts[1] + ")");
        blockUi = true;
        if(modeDemo) stopD();
        return;
    }

    var sum = 0;
    for(var s=0; s<14; s++) sum += tab_jeu[s];
    
    if(sum < 10) {
        showMsg("⚖️ Match Nul : Moins de 10 graines rest.");
        blockUi = true;
        if(modeDemo) stopD();
        return;
    }

    if(getLegalMoves().length == 0) {
        showMsg("⚖️ FIN : Impossible de nourrir l'adversaire.");
        blockUi = true;
        if(modeDemo) stopD();
    }
}

function resetGame() {
    if(blockUi && pts[0] < 40 && pts[1] < 40) {
        var s = 0;
        for(var k=0; k<14; k++) s+= tab_jeu[k];
        if(s >= 10 && getLegalMoves().length > 0) return;
    }
    for(var k=0; k<14; k++) tab_jeu[k] = 5;
    pts = [0, 0];
    numJoueur = 1;
    blockUi = false;
    showMsg("");
    if(modeDemo) stopD();
    redraw();
}

btnReset.onclick = resetGame;

btnAddGraines.onclick = function() {
    if(blockUi) return;
    var d = (numJoueur == 1) ? 0 : 7;
    var e = (numJoueur == 1) ? 6 : 13;
    for(var i=d; i<=e; i++) {
        if(tab_jeu[i] > 0) { tab_jeu[i] += 10; break; }
    }
    redraw();
};

function toggleD() {
    if(modeDemo) stopD(); else startD();
}

function startD() {
    modeDemo = true;
    btnDemo.innerHTML = "⏹ Arrêter Démo";
    btnDemo.classList.add('demo-actif');
    tmrDemo = setInterval(function() {
        if(!blockUi) {
            var dispo = getLegalMoves();
            if(dispo.length > 0) {
                var r = Math.floor(Math.random() * dispo.length);
                clicAction(dispo[r]);
            } else {
                stopD();
            }
        }
    }, 4500);
}

function stopD() {
    modeDemo = false;
    btnDemo.innerHTML = "Mode Démo";
    btnDemo.classList.remove('demo-actif');
    if(tmrDemo) { clearInterval(tmrDemo); tmrDemo = null; }
}

btnDemo.onclick = toggleD;

btnRegles.onclick = function() { modalRules.style.display = 'flex'; };
btnFermerModal.onclick = function() { modalRules.style.display = 'none'; };
window.onclick = function(e) { if(e.target == modalRules) modalRules.style.display = 'none'; };

inputNom1.oninput = function() { redraw(-1,-1); };
inputNom2.oninput = function() { redraw(-1,-1); };

for(var l=0; l<14; l++) {
    (function(id) {
        lesCases[id].onclick = function() {
            if(modeDemo) stopD();
            clicAction(id);
        };
    })(l);
}

// init
redraw();
