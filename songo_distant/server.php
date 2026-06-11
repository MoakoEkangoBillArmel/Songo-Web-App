<?php
// Auteur : MOAKO EKANGO BILL ARMEL - Matricule : 24F2686
// Backend PHP pour le jeu Songo en reseau

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$fic = 'etat_jeu.json';

function etatDefaut() {
    return [
        'plateau' => array_fill(0, 14, 5),
        'scores' => [0, 0],
        'joueurActif' => 1,
        'partieDemarree' => false,
        'dernierCoup' => [
            'id' => 0,
            'case' => -1,
            'joueur' => -1,
            'plateauAvant' => null
        ],
        'joueurs' => [
            '1' => ['nom' => 'Joueur1', 'connecte' => false, 'pret' => false, 'dernierPing' => null],
            '2' => ['nom' => 'Joueur2', 'connecte' => false, 'pret' => false, 'dernierPing' => null]
        ],
        'fin' => false,
        'messageAlerte' => '',
        'coupsAutorises' => []
    ];
}

function caseSuivante($c) {
    if ($c >= 0 && $c <= 6) return $c == 0 ? 7 : $c - 1;
    return $c == 13 ? 6 : $c + 1;
}

function casePrecedente($c) {
    if ($c >= 0 && $c <= 6) return $c == 6 ? 13 : $c + 1;
    return $c == 7 ? 0 : $c - 1;
}

function estAdverse($c, $j) {
    return $j == 1 ? ($c >= 7 && $c <= 13) : ($c >= 0 && $c <= 6);
}

function calcEnvoi(&$tab, $dep, $jou) {
    $n = $tab[$dep];
    if ($n == 0) return 0;
    $total = 0;
    if ($n > 13) {
        $cur = caseSuivante($dep);
        for ($i = 0; $i < 13; $i++) {
            if (estAdverse($cur, $jou)) $total++;
            $cur = caseSuivante($cur);
        }
        $total += $n - 13;
    } else {
        $cur = caseSuivante($dep);
        while ($n > 0) {
            if (estAdverse($cur, $jou)) $total++;
            $cur = caseSuivante($cur);
            $n--;
        }
    }
    return $total;
}

function getCoupsValides(&$e) {
    if ($e['fin'] || !$e['partieDemarree']) return [];
    
    $jou = $e['joueurActif'];
    $d = $jou == 1 ? 0 : 7;
    $f = $jou == 1 ? 6 : 13;
    $c7 = $jou == 1 ? 0 : 13;
    
    $possibles = [];
    for ($i = $d; $i <= $f; $i++) {
        if ($e['plateau'][$i] > 0) $possibles[] = $i;
    }
    
    $oD = $jou == 1 ? 7 : 0;
    $oF = $jou == 1 ? 13 : 6;
    $advVide = true;
    for ($i = $oD; $i <= $oF; $i++) {
        if ($e['plateau'][$i] > 0) { $advVide = false; break; }
    }
    
    $valides = [];
    if ($advVide) {
        $avec7 = [];
        $liste = [];
        foreach ($possibles as $idx) {
            $env = calcEnvoi($e['plateau'], $idx, $jou);
            $liste[] = ['c' => $idx, 'v' => $env];
            if ($env >= 7) $avec7[] = $idx;
        }
        if (count($avec7) > 0) {
            $valides = $avec7;
        } else {
            $mx = 0;
            foreach ($liste as $item) if ($item['v'] > $mx) $mx = $item['v'];
            foreach ($liste as $item) if ($item['v'] == $mx) $valides[] = $item['c'];
        }
    } else {
        $valides = $possibles;
    }
    
    // filtre case7
    $ok = [];
    foreach ($valides as $idx) {
        if ($idx == $c7 && ($e['plateau'][$idx] == 1 || $e['plateau'][$idx] == 2)) {
            if (count($valides) > 1) continue;
        }
        $ok[] = $idx;
    }
    
    return $ok;
}

function testFin(&$e) {
    if (!$e['partieDemarree']) return;
    
    $n1 = $e['joueurs']['1']['nom'];
    $n2 = $e['joueurs']['2']['nom'];
    
    if ($e['scores'][0] >= 40) {
        $e['messageAlerte'] = "🏆 Victoire de $n1 avec {$e['scores'][0]} graines !";
        $e['fin'] = true; return;
    }
    if ($e['scores'][1] >= 40) {
        $e['messageAlerte'] = "🏆 Victoire de $n2 avec {$e['scores'][1]} graines !";
        $e['fin'] = true; return;
    }
    
    $tot = array_sum($e['plateau']);
    if ($tot < 10) {
        $e['messageAlerte'] = "⚖️ Match nul — moins de 10 graines ($tot)";
        $e['fin'] = true; return;
    }
    
    if (count(getCoupsValides($e)) == 0) {
        $e['messageAlerte'] = "⚖️ Match nul — impossible de nourrir l'adversaire";
        $e['fin'] = true;
    }
}

function faireCoup(&$e, $caseChoisie, $jou) {
    if ($e['fin'] || !$e['partieDemarree'] || $e['joueurActif'] != $jou) return false;
    
    $coups = getCoupsValides($e);
    if (!in_array($caseChoisie, $coups)) {
        $e['messageAlerte'] = "Coup interdit !";
        return false;
    }
    
    $tabAvant = $e['plateau'];
    $numCoup = $e['dernierCoup']['id'] + 1;
    $e['messageAlerte'] = '';
    
    $jAct = $e['joueurActif'];
    $nb = $e['plateau'][$caseChoisie];
    $e['plateau'][$caseChoisie] = 0;
    
    $isJ1 = ($caseChoisie >= 0 && $caseChoisie <= 6);
    $c7 = $isJ1 ? 0 : 13;
    
    // cas special case 7 avec 1 ou 2
    if ($caseChoisie == $c7 && ($nb == 1 || $nb == 2)) {
        $e['scores'][2 - $jAct] += $nb;
        $e['joueurActif'] = $jAct == 1 ? 2 : 1;
        $e['dernierCoup'] = ['id' => $numCoup, 'case' => $caseChoisie, 'joueur' => $jou, 'plateauAvant' => $tabAvant];
        testFin($e);
        return true;
    }
    
    $cur = $caseChoisie;
    $nbDist = 0;
    
    if ($nb > 13) {
        $cur = caseSuivante($caseChoisie);
        for ($i = 0; $i < 13; $i++) {
            $e['plateau'][$cur]++;
            $nbDist++;
            $cur = caseSuivante($cur);
        }
        $rst = $nb - 13;
        $aIdx = $isJ1 ? 7 : 0;
        while ($rst > 0) {
            $e['plateau'][$aIdx]++;
            $nbDist++;
            if ($rst > 1) {
                $aIdx = $isJ1 ? ($aIdx == 13 ? 7 : $aIdx + 1) : ($aIdx == 6 ? 0 : $aIdx + 1);
            }
            $rst--;
        }
        $cur = $aIdx;
    } else {
        $cur = caseSuivante($caseChoisie);
        while ($nb > 0) {
            $e['plateau'][$cur]++;
            $nbDist++;
            if ($nb > 1) $cur = caseSuivante($cur);
            $nb--;
        }
    }
    
    $der = $cur;
    
    // captures
    if (estAdverse($der, $jAct)) {
        $c1adv = $jAct == 1 ? 7 : 0;
        $prises = [];
        
        if ($der == $c1adv) {
            if ($nbDist >= 14) $prises[] = ['c' => $der, 'v' => 1, 't' => '1'];
        } else if ($e['plateau'][$der] >= 2 && $e['plateau'][$der] <= 4) {
            $prises[] = ['c' => $der, 'v' => $e['plateau'][$der], 't' => 'n'];
            $pv = casePrecedente($der);
            while (estAdverse($pv, $jAct)) {
                if ($pv == $c1adv) {
                    if ($e['plateau'][$pv] >= 2 && $e['plateau'][$pv] <= 4) {
                        $prises[] = ['c' => $pv, 'v' => $e['plateau'][$pv], 't' => 'n'];
                    }
                    break;
                } else if ($e['plateau'][$pv] >= 2 && $e['plateau'][$pv] <= 4) {
                    $prises[] = ['c' => $pv, 'v' => $e['plateau'][$pv], 't' => 'n'];
                    $pv = casePrecedente($pv);
                } else break;
            }
        }
        
        if (count($prises) > 0) {
            $od = $jAct == 1 ? 7 : 0;
            $of = $jAct == 1 ? 13 : 6;
            $totAdv = 0;
            for ($i = $od; $i <= $of; $i++) $totAdv += $e['plateau'][$i];
            
            $chk = 0;
            foreach ($prises as $p) $chk += ($p['t'] == '1') ? 1 : $p['v'];
            
            if ($totAdv == $chk) {
                $e['messageAlerte'] = "Prise annulée — on ne peut pas vider l'adversaire !";
            } else {
                foreach ($prises as $p) {
                    if ($p['t'] == '1') {
                        $e['plateau'][$p['c']]--;
                        $e['scores'][$jAct - 1]++;
                    } else {
                        $e['scores'][$jAct - 1] += $p['v'];
                        $e['plateau'][$p['c']] = 0;
                    }
                }
            }
        }
    }
    
    $e['joueurActif'] = $jAct == 1 ? 2 : 1;
    $e['dernierCoup'] = ['id' => $numCoup, 'case' => $caseChoisie, 'joueur' => $jou, 'plateauAvant' => $tabAvant];
    
    testFin($e);
    return true;
}

function pingSpirou(&$e) {
    $now = time();
    foreach (['1', '2'] as $j) {
        if ($e['joueurs'][$j]['connecte'] && $e['joueurs'][$j]['dernierPing'] !== null) {
            if ($now - $e['joueurs'][$j]['dernierPing'] > 12) {
                $e['joueurs'][$j]['connecte'] = false;
                $e['joueurs'][$j]['pret'] = false;
                if ($e['partieDemarree']) $e['partieDemarree'] = false;
            }
        }
    }
}

// --- Lecture fichier avec verrou ---
$fp = fopen($fic, 'c+');
flock($fp, LOCK_EX);

$raw = stream_get_contents($fp);
$etat = $raw ? json_decode($raw, true) : etatDefaut();
if (!$etat) $etat = etatDefaut();

pingSpirou($etat);

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$rep = ['succes' => false];

if ($action == 'rejoindre') {
    $nm = trim($_GET['nom'] ?? '');
    $who = null;
    if (!$etat['joueurs']['1']['connecte']) $who = 1;
    else if (!$etat['joueurs']['2']['connecte']) $who = 2;
    
    if ($who !== null) {
        if ($nm != '') $etat['joueurs'][$who]['nom'] = substr($nm, 0, 15);
        $etat['joueurs'][$who]['connecte'] = true;
        $etat['joueurs'][$who]['dernierPing'] = time();
        $etat['coupsAutorises'] = getCoupsValides($etat);
        $rep = ['succes' => true, 'joueur' => $who, 'etat' => $etat];
    } else {
        $rep = ['succes' => false, 'message' => 'Partie complète, revenez plus tard'];
    }
} else if ($action == 'pret') {
    $who = (int)($_POST['joueur'] ?? 0);
    if ($who && isset($etat['joueurs'][$who])) {
        $etat['joueurs'][$who]['pret'] = true;
        $etat['joueurs'][$who]['dernierPing'] = time();
        if ($etat['joueurs']['1']['pret'] && $etat['joueurs']['2']['pret']) {
            $etat['partieDemarree'] = true;
        }
        $etat['coupsAutorises'] = getCoupsValides($etat);
        $rep = ['succes' => true, 'etat' => $etat];
    }
} else if ($action == 'etat') {
    $who = $_GET['joueur'] ?? null;
    if ($who && isset($etat['joueurs'][$who])) {
        $etat['joueurs'][$who]['dernierPing'] = time();
        $etat['joueurs'][$who]['connecte'] = true;
    }
    if ($etat['joueurs']['1']['connecte'] && $etat['joueurs']['2']['connecte']
        && $etat['joueurs']['1']['pret'] && $etat['joueurs']['2']['pret']) {
        $etat['partieDemarree'] = true;
    }
    $etat['coupsAutorises'] = getCoupsValides($etat);
    $rep = ['succes' => true, 'etat' => $etat];
} else if ($action == 'jouer') {
    $who = (int)($_POST['joueur'] ?? 0);
    $case = (int)($_POST['case'] ?? -1);
    if ($who && $case >= 0 && $case <= 13) {
        $etat['joueurs'][$who]['dernierPing'] = time();
        if (faireCoup($etat, $case, $who)) {
            $etat['coupsAutorises'] = getCoupsValides($etat);
            $rep = ['succes' => true, 'etat' => $etat];
        } else {
            $rep = ['succes' => false, 'message' => $etat['messageAlerte'] ?: 'Coup refusé'];
        }
    }
} else if ($action == 'reinitialiser') {
    $ancien = [
        '1' => $etat['joueurs']['1']['nom'],
        '2' => $etat['joueurs']['2']['nom']
    ];
    $con1 = $etat['joueurs']['1']['connecte'];
    $con2 = $etat['joueurs']['2']['connecte'];
    
    $etat = etatDefaut();
    $etat['joueurs']['1']['nom'] = $ancien['1'];
    $etat['joueurs']['2']['nom'] = $ancien['2'];
    $etat['joueurs']['1']['connecte'] = $con1;
    $etat['joueurs']['2']['connecte'] = $con2;
    if ($con1) $etat['joueurs']['1']['dernierPing'] = time();
    if ($con2) $etat['joueurs']['2']['dernierPing'] = time();
    
    $etat['coupsAutorises'] = getCoupsValides($etat);
    $rep = ['succes' => true, 'etat' => $etat];
} else if ($action == 'ajouter_graines') {
    $who = (int)($_POST['joueur'] ?? 0);
    if ($etat['partieDemarree'] && $who == $etat['joueurActif']) {
        $d = $who == 1 ? 0 : 7;
        $f = $who == 1 ? 6 : 13;
        for ($i = $d; $i <= $f; $i++) {
            if ($etat['plateau'][$i] > 0) { $etat['plateau'][$i] += 10; break; }
        }
        $etat['coupsAutorises'] = getCoupsValides($etat);
        $rep = ['succes' => true, 'etat' => $etat];
    }
}

// sauvegarde
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($etat));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode($rep);
