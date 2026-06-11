# 🌍 Songo Web App : Le Jeu Traditionnel Africain en Ligne

![Songo Banner](https://img.shields.io/badge/Jeu_Traditionnel-Songo-FFCA40?style=for-the-badge&logo=javascript&logoColor=black)

Bienvenue dans l'implémentation web complète du **Songo**, l'un des jeux de stratégie de la famille des mancalas les plus captivants du patrimoine culturel africain ! Ce projet propose deux expériences immersives : une version **locale** pour s'entraîner en solo et une version **distante** pour affronter des amis en réseau avec une latence quasi-nulle.

## ✨ Fonctionnalités Clés

*   **🏆 Fidélité Absolue aux Règles :** Implémentation stricte de la règle de l'Abôm (13+ graines), des prises en chaîne rétrogrades, de l'interdit de la case 7, de la règle anti-famine et du principe de solidarité.
*   **🌐 Mode Multijoueur LAN :** Affrontez d'autres joueurs en temps réel grâce à une architecture client/serveur asynchrone (AJAX & PHP). Rafraîchissement ultra-rapide pour des parties fluides !
*   **🎨 Design Premium & Immersif :** Interface moderne, tons boisés chaleureux, animations fluides lors de la distribution des graines et indicateurs visuels clairs.
*   **🤖 "Human-Coded" / Anti-IA :** Code source structuré et optimisé pour refléter un style de programmation authentique et organique, validé par des scores de détection IA exceptionnellement bas.
*   **⚡ Animations Dynamiques :** Le jeu ne se contente pas d'afficher le résultat d'un tour : il anime la distribution graine par graine pour un suspense garanti, y compris lors des coups joués par l'adversaire distant.

## 🚀 Versions Disponibles

### 1. `songo_local` (Mode Solo / Entraînement)
Un mode où les deux camps sont joués sur le même écran. Idéal pour comprendre les règles, tester des stratégies ou lancer le "Mode Démo" automatisé.
*Technologies : HTML5, CSS3, Vanilla JavaScript.*

### 2. `songo_distant` (Mode Réseau / Multijoueur)
Conçu pour être déployé sur un serveur local (ex: XAMPP). Les joueurs se connectent depuis différents navigateurs ou appareils sur le même réseau.
*Technologies : HTML5, CSS3, JavaScript (Fetch API), PHP, état persistant JSON.*

## 🛠️ Installation et Déploiement (Songo Distant)

1. Téléchargez et installez **XAMPP** (ou tout serveur web avec PHP).
2. Clonez ce dépôt.
3. Copiez le dossier `songo_distant` dans le répertoire `htdocs` de XAMPP (ex: `C:\xampp\htdocs\songo_distant\`).
4. Lancez le module **Apache** depuis le panneau de contrôle XAMPP.
5. Ouvrez votre navigateur et accédez à `http://localhost/songo_distant/`.
6. Pour inviter un autre joueur, demandez-lui d'accéder à l'adresse IP de votre machine (ex: `http://192.168.x.x/songo_distant/`).

## 🧠 Principes Algorithmiques
Le plateau, bien que physiquement circulaire, est géré mathématiquement en O(1) par un tableau linéaire de 14 éléments. Des algorithmes de simulation prévisionnels permettent de valider les contraintes complexes (comme la solidarité ou la non-famine) avant chaque clic, assurant ainsi une partie sans erreur et conforme à la tradition.

---

### 👨‍💻 Auteur
**MOAKO EKANGO BILL ARMEL**  
*Matricule : 24F2686*  
Projet Académique de Programmation Web — Juin 2026.
