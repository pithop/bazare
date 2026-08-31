# CONTEXTE DU PROJET (LeBazare Manager)
Je développe une application React Native (Expo) 100% hors-ligne pour gérer l'inventaire et les commandes de ma boutique Etsy depuis mon garage (qui n'a pas d'internet).
- **Base de données :** `expo-sqlite` (SQLite local avec PRAGMA journal_mode = WAL).
- **Navigation :** `@react-navigation/bottom-tabs`
- **Téléphone cible :** Wiko / Android 10 (API 30).
- **Fonctionnalités déjà codées :** Wave Picking, Import CSV de commandes, Liste de courses, Gestion des stocks, UI sombre pro.

# LE PROBLÈME
Je n'ai pas l'environnement Java/Android installé sur mon PC. On a donc utilisé GitHub Actions pour compiler l'APK (Release). 
Le problème : l'APK s'installe, affiche le splash screen "LeBazare", puis **crashe instantanément (se ferme)** sur mon Android 10.

# CE QU'ON A DÉJÀ ESSAYÉ (Sans succès)
1. **Correction des Race Conditions SQLite :** On a encapsulé l'initialisation de la DB dans une Promise Singleton pour éviter que deux composants tentent d'ouvrir la DB en même temps.
2. **Error Boundary global :** On a mis des gros `try/catch` partout dans `App.js` pour afficher les erreurs à l'écran. Résultat : l'appli crashe quand même, ce qui prouve que c'est une erreur NATIVE fatale (ex: module manquant, JSI/Hermes) et non une erreur JavaScript interceptable.
3. **Suppression de React Navigation :** On a cru que `react-native-screens` faisait crasher l'appli, on a donc codé un routeur manuel 100% JS. L'APK a QUAND MÊME crashé.

# NOTRE DÉCISION ACTUELLE (URGENCE)
Je dois aller au garage dans quelques heures. J'abandonne temporairement l'idée de l'APK autonome pour aujourd'hui.
**On a remis React Navigation dans le code actuel.**
Je vais utiliser **Expo Go** sur mon téléphone pour faire tourner l'application aujourd'hui et pouvoir travailler.

# TA MISSION (CLAUDE)
1. **Urgence Absolue (Expo Go) :** Aide-moi à lancer le projet via l'application Expo Go sur mon téléphone (Android 10) pour que je puisse bosser aujourd'hui. Dis-moi exactement comment faire (sans internet dans le garage, je dois sûrement le charger en Wi-Fi avant de partir ?).
2. **Analyse du Crash APK (Pour plus tard) :** Sachant que l'app crashe sur Android 10 même sans React Navigation, le problème natif vient probablement d'ailleurs (peut-être `expo-sqlite` sur Android 10, un souci de SDK, ou Hermes ?). Aide-moi à diagnostiquer ça quand j'aurai le temps.
