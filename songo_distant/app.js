// Auteur : MOAKO EKANGO BILL ARMEL - Matricule : 24F2686
// Client AJAX
var api = 'server.php';
var idMoi = null;
var tmr = null;
var stateLocal = null;

var blockAnim = false;
var lastCoup = 0;

var uiPlateau = document.getElementById('plateau');
var divCmd = document.getElementById('zone-commandes');
var pnlLogin = document.getElementById('panneau-connexion');
var btnJoin = document.getElementById('bouton-rejoindre');
var txtNom = document.getElementById('nom-joueur');

var banRes = document.getElementById('banniere-reseau');
var lblRes = document.getElementById('statut-reseau');
var lblStat = document.getElementById('statut-joueur-id');

var ecranWait = document.getElementById('overlay-attente');
var txtWait = document.getElementById('texte-attente');
var btnReady = document.getElementById('bouton-pret');
var imgLoad = document.getElementById('spinner-attente');

var txtTour = document.getElementById('indicateur-tour');
var msgs = document.getElementById('zone-alertes');

var lesCases = [];
for(var i=0; i<14; i++) {
    lesCases.push(document.getElementById('case-' + i));
}

var resteJ1 = document.getElementById('graines-restantes-j1');
var resteJ2 = document.getElementById('graines-restantes-j2');
var priseJ1 = document.getElementById('prises-j1');
var priseJ2 = document.getElementById('prises-j2');
var lblN1 = document.getElementById('label-nom-j1');
var lblN2 = document.getElementById('label-nom-j2');

var btnReset = document.getElementById('bouton-reinitialiser');
var btnAddGraines = document.getElementById('bouton-ajouter-graines');

var mRegles = document.getElementById('modal-regles');
var btnRgls = document.getElementById('bouton-regles');
var btnClose = document.querySelector('.fermer-modal');

async function sendData(act, opt = {}) {
    try {
        var u = api + '?action=' + act;
        var req = { method: 'GET' };

        if (opt.method == 'POST') {
            req.method = 'POST';
            var f = new FormData();
            for (var k in opt.data) f.append(k, opt.data[k]);
            req.body = f;
        } else {
            for (var k in opt.data) u += '&' + k + '=' + encodeURIComponent(opt.data[k]);
        }

        var r = await fetch(u, req);
        return await r.json();
    } catch (err) {
        return { succes: false, message: "Err réseau" };
    }
}

async function doLogin() {
    var nm = txtNom.value.trim() || 'Joueur';
    btnJoin.disabled = true;
    btnJoin.innerHTML = "Connexion...";

    var resp = await sendData('rejoindre', { data: { nom: nm } });
    
    if (resp.succes) {
        idMoi = resp.joueur;
        pnlLogin.style.display = 'none';
        uiPlateau.style.display = 'flex';
        divCmd.style.display = 'flex';
        
        banRes.className = 'connecte';
        lblRes.innerHTML = "OK";
        lblStat.innerHTML = "Vous = J" + idMoi + (idMoi == 1 ? " (Sud)" : " (Nord)");
        
        if (resp.etat.dernierCoup) lastCoup = resp.etat.dernierCoup.id;
        
        updateUI(resp.etat);
        if(tmr) clearInterval(tmr);
        tmr = setInterval(async function() {
            if (blockAnim) return;
            var res2 = await sendData('etat', { data: { joueur: idMoi } });
            if (res2.succes) checkAction(res2.etat);
        }, 250);
    } else {
        btnJoin.disabled = false;
        btnJoin.innerHTML = "Rejoindre la Partie";
        affMsg(resp.message || "Impossible.");
    }
}

function affMsg(m) {
    if(m) { msgs.innerText = m; msgs.style.display = 'flex'; }
    else msgs.style.display = 'none';
}

function checkAction(e) {
    if (e.dernierCoup && e.dernierCoup.id > lastCoup) {
        lastCoup = e.dernierCoup.id;
        stateLocal = e;
        doAnim(e.dernierCoup);
    } else {
        updateUI(e);
    }
}

function nextId(id) {
    if (id >= 0 && id <= 6) return id == 0 ? 7 : id - 1;
    return id == 13 ? 6 : id + 1;
}

function waitMs() {
    return new Promise(function(r) { setTimeout(r, 400); });
}

async function doAnim(cp) {
    blockAnim = true;
    ecranWait.style.display = 'none';
    txtTour.innerHTML = "Anim Joueur " + (cp.joueur == 1 ? "Sud" : "Nord") + "...";
    
    var t_loc = cp.plateauAvant.slice();
    for(var u=0; u<14; u++) {
        lesCases[u].innerHTML = t_loc[u];
        lesCases[u].className = 'case';
    }
    
    var start = cp.case;
    var pts = t_loc[start];
    t_loc[start] = 0;
    
    lesCases[start].innerHTML = 0;
    lesCases[start].classList.add('en-cours-distribution');
    await waitMs();
    lesCases[start].classList.remove('en-cours-distribution');
    
    var isJ1 = (start >= 0 && start <= 6);
    var target7 = isJ1 ? 0 : 13;
    
    if (start != target7 || (pts != 1 && pts != 2)) {
        var crt = start;
        if (pts > 13) {
            crt = nextId(start);
            for (var w=0; w<13; w++) {
                t_loc[crt]++;
                lesCases[crt].innerHTML = t_loc[crt];
                lesCases[crt].classList.add('mise-en-valeur');
                await waitMs();
                lesCases[crt].classList.remove('mise-en-valeur');
                crt = nextId(crt);
            }
            var d_rem = pts - 13;
            var a_idx = isJ1 ? 7 : 0;
            while(d_rem > 0) {
                t_loc[a_idx]++;
                lesCases[a_idx].innerHTML = t_loc[a_idx];
                lesCases[a_idx].classList.add('mise-en-valeur');
                await waitMs();
                lesCases[a_idx].classList.remove('mise-en-valeur');
                if (d_rem > 1) {
                    if(isJ1) a_idx = (a_idx == 13 ? 7 : a_idx + 1);
                    else a_idx = (a_idx == 6 ? 0 : a_idx + 1);
                }
                d_rem--;
            }
        } else {
            crt = nextId(start);
            while (pts > 0) {
                t_loc[crt]++;
                lesCases[crt].innerHTML = t_loc[crt];
                lesCases[crt].classList.add('mise-en-valeur');
                await waitMs();
                lesCases[crt].classList.remove('mise-en-valeur');
                if (pts > 1) crt = nextId(crt);
                pts--;
            }
        }
    }
    
    await waitMs();
    blockAnim = false;
    updateUI(stateLocal);
}

function updateUI(e) {
    stateLocal = e;
    if (blockAnim) return;
    
    lblN1.innerHTML = e.joueurs['1'].nom;
    lblN2.innerHTML = e.joueurs['2'].nom;

    for(var k=0; k<14; k++) {
        lesCases[k].innerHTML = e.plateau[k];
        lesCases[k].className = 'case';
        if (e.partieDemarree && !e.fin && e.joueurActif == idMoi && e.coupsAutorises && e.coupsAutorises.indexOf(k) > -1) {
            lesCases[k].classList.add('rangee-active');
        }
    }

    var v1=0, v2=0;
    for(var p=0; p<=6; p++) v1 += e.plateau[p];
    for(var p=7; p<=13; p++) v2 += e.plateau[p];
    
    resteJ1.innerHTML = v1;
    resteJ2.innerHTML = v2;
    priseJ1.innerHTML = e.scores[0];
    priseJ2.innerHTML = e.scores[1];

    affMsg(e.messageAlerte);

    var curJ = e.joueurs[idMoi];
    var advJ = e.joueurs[idMoi == 1 ? '2' : '1'];

    if (!advJ.connecte && !e.fin) {
        ecranWait.style.display = 'flex';
        btnReady.style.display = 'none';
        imgLoad.style.display = 'block';
        txtWait.innerHTML = "⏳ En attente...";
        txtTour.innerHTML = "Attente";
        txtTour.classList.remove('tour-pulse');
        return;
    }

    if (!e.partieDemarree && !e.fin) {
        ecranWait.style.display = 'flex';
        txtTour.innerHTML = "Confirme...";
        txtTour.classList.remove('tour-pulse');
        
        if (!curJ.pret) {
            imgLoad.style.display = 'none';
            btnReady.style.display = 'block';
            txtWait.innerHTML = "Salut " + curJ.nom;
        } else {
            imgLoad.style.display = 'block';
            btnReady.style.display = 'none';
            txtWait.innerHTML = "Attente de " + advJ.nom + "...";
        }
        return;
    }

    if (e.fin) {
        ecranWait.style.display = 'flex';
        txtWait.innerHTML = "FIN";
        imgLoad.style.display = 'none';
        btnReady.style.display = 'none';
        txtTour.innerHTML = "Terminé";
        txtTour.classList.remove('tour-pulse');
        return;
    }

    btnReady.style.display = 'none';
    imgLoad.style.display = 'block';
    
    if (e.joueurActif == idMoi) {
        ecranWait.style.display = 'none';
        txtTour.innerHTML = "🟢 A vous !";
        txtTour.classList.add('tour-pulse');
    } else {
        ecranWait.style.display = 'flex';
        txtWait.innerHTML = "⏳ " + advJ.nom + " joue...";
        txtTour.innerHTML = "Tour " + advJ.nom;
        txtTour.classList.remove('tour-pulse');
    }
}

btnJoin.onclick = doLogin;
txtNom.onkeypress = function(evt) { if(evt.key == 'Enter') doLogin(); };

btnReady.onclick = async function() {
    btnReady.disabled = true;
    var x = await sendData('pret', { method: 'POST', data: { joueur: idMoi } });
    if (x.succes) {
        btnReady.disabled = false;
        updateUI(x.etat);
    }
};

for(var l=0; l<14; l++) {
    (function(id) {
        lesCases[id].onclick = async function() {
            if (blockAnim || !stateLocal || !stateLocal.partieDemarree || stateLocal.fin || stateLocal.joueurActif != idMoi) return;
            if (stateLocal.coupsAutorises && stateLocal.coupsAutorises.indexOf(id) < 0) {
                affMsg("Coup interdit");
                return;
            }
            ecranWait.style.display = 'none';
            lesCases[id].classList.remove('rangee-active');
            var rep = await sendData('jouer', { method: 'POST', data: { joueur: idMoi, case: id } });
            if (rep.succes) checkAction(rep.etat);
            else {
                affMsg(rep.message);
                var reSync = await sendData('etat', { data: { joueur: idMoi } });
                if(reSync.succes) updateUI(reSync.etat);
            }
        };
    })(l);
}

btnReset.onclick = async function() {
    if (!confirm("Rejouer ?")) return;
    var b = await sendData('reinitialiser', { method: 'POST', data: {} });
    if(b.succes) updateUI(b.etat);
};

btnAddGraines.onclick = async function() {
    if (blockAnim || !stateLocal || !stateLocal.partieDemarree || stateLocal.fin || stateLocal.joueurActif != idMoi) return;
    var d = await sendData('ajouter_graines', { method: 'POST', data: { joueur: idMoi } });
    if(d.succes) checkAction(d.etat);
};

btnRgls.onclick = function() { mRegles.style.display = 'flex'; };
btnClose.onclick = function() { mRegles.style.display = 'none'; };
window.onclick = function(e) { if (e.target == mRegles) mRegles.style.display = 'none'; };
