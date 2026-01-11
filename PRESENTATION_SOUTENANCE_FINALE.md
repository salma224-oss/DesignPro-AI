# Présentation de Soutenance : DesignPro AI
## Plateforme de Conception Industrielle Assistée par GenAI

---

# 1. Problématique

### Le Défi du Design Industriel Moderne
*   **Complexité & Coût** : Le processus de design traditionnel est long, itératif et coûteux. Passer de l'idée au concept visuel prend du temps.
*   **Barrière Technique** : La modélisation CAD/CAO requiert une expertise pointue dès les premières phases.
*   **Manque d'Inspiration Structurée** : Les designers ont souvent le "syndrome de la page blanche" et manquent de méthodologies guidées (TRIZ, DfX) intégrées à leurs outils.
*   **Fracture Idéation/Faisabilité** : Les concepts esthétiques sont souvent techniquement irréalisables, ce qui n'est découvert que tardivement.

---

# 2. Motivation du Projet

### La Vision : Un "Co-Pilote" pour Designers
*   **Accélérer l'Innovation** : Réduire le cycle "Idée -> Visuel" de quelques jours à quelques secondes.
*   **Démocratiser les Méthodologies** : Rendre accessibles des méthodes complexes (TRIZ, Value Engineering) via une assistance IA conversationnelle.
*   **Garantir la Faisabilité** : Intégrer dès la phase d'idéation des contraintes techniques (Matériaux, Fabrication) grâce à une boucle de feedback (Agent Q / R.E.A.L).
*   **Approche Hybride** : Combiner la créativité humaine (Sketches) avec la puissance générative de l'IA.

---

# 3. État de l'Art

### Solutions Existantes vs DesignPro AI
*   **Outils CAO Classiques (SolidWorks, Catia)** :
    *   *Avantage* : Précision technique absolue.
    *   *Limite* : Courbe d'apprentissage, lent pour l'exploration rapide.
*   **Générateurs d'Images (Midjourney, DALL-E)** :
    *   *Avantage* : Visuels époustouflants.
    *   *Limite* : "Boîte noire", manque de contrôle (pas de respect des dimensions ou des croquis utilisateurs), hallucination technique.
*   **L'Approche DesignPro AI** :
    *   Utilisation de **ControlNet** pour respecter la structure des croquis.
    *   Intégration de **LLM (Mistral)** pour le raisonnement technique (Prompt Engineering avancé).
    *   Architecture modulaire combinant **Next.js** et **Supabase**.

---

# 4. Architecture et Pipeline Technique

### Stack Technologique (D'après l'analyse du code)
*   **Frontend** : Next.js 15 (App Router), React 19, TailwindCSS 4, Lucide React.
*   **Backend & Data** : Supabase (PostgreSQL, Auth, RLS Policies), Edge Functions.
*   **Intelligence Artificielle (Service Centralisé `ai.ts`)** :
    *   **Logique & Texte** : Mistral AI (`mistral-large-latest`) pour la méthodologie et les prompts.
    *   **Image & Rendu** : Hugging Face Inference API (Stable Diffusion XL, Flux.1, ControlNet Scribble).
    *   **Visualisation** : Replicate (BLIP-2) pour l'analyse d'images (Agent Q).

### Workflow DFA-IA (Design for AI)
Le pipeline est orchestré par le fichier `lib/ai.ts` et les routes API :
1.  **Input** : Texte utilisateur ou Sketch (converti en Base64).
2.  **Enhancement (Mistral)** : Le LLM enrichit la demande via une méthodologie (ex: TRIZ) pour créer un prompt technique détaillé.
3.  **Génération (SDXL/ControlNet)** : Création de 4 variations visuelles respectant les contraintes.
4.  **Évaluation (Agent Q)** : Analyse du design généré sur 5 critères (Esthétique, Fonctionnel, etc.) via Mistral.
5.  **Simulation (R.E.A.L)** : Estimation (mock/IA) des contraintes physiques (Stress, Coût, Matériaux).

---

# 5. Démonstration de l'Interface

### Parcours Utilisateur (`ideation/page.tsx`)
1.  **Dashboard Projet** : Vue d'ensemble des projets en cours.
2.  **Sélection de la Méthode** :
    *   *Prompt* : Texte pur.
    *   *Sketch* : Upload d'un croquis à main levée (activé par ControlNet).
    *   *Image* : Itération sur une image existante (Img2Img).
3.  **Choix de la Méthodologie** : L'utilisateur sélectionne un cadre (ex: "Design Thinking") et définit ses paramètres (Personas, Contraintes).
4.  **Résultats & Itération** :
    *   Affichage d'une grille de 4 concepts générés.
    *   Sélection d'un concept favori.
5.  **Analyse "Expert"** :
    *   Affichage du score de l'**Agent Q**.
    *   Rapport de faisabilité (Désigné comme R.E.A.L dans le code).
    *   Export final (Tentative de génération de fichier STEP basique).

---

# 6. Discussion des Résultats

### Ce qui est accompli
*   **Intégration Fluide** : Le système connecte transparentement l'utilisateur à des modèles complexes (Mistral, SDXL) sans friction.
*   **Respect du Croquis** : L'utilisation de `ControlNet` (visible dans `ai.ts`) permet de transformer un gribouillage en produit fini photoréaliste, validant l'hypothèse du "Co-pilote".
*   **Architecture Robuste** : Utilisation de modèles de fallback (si SDXL échoue, passe à SD 1.5) et gestion d'erreurs fine dans les appels API.
*   **Persistance** : Sauvegarde automatique de l'état d'idéation dans Supabase (`project_states`), permettant de reprendre le travail n'importe quand.

---

# 7. Limitations et Axes de Développement

### Limitations Actuelles (Identifiées dans le code)
*   **Simulation R.E.A.L** : Actuellement simulée ou estimée par IA (`generateBasicSimulation` dans `ai.ts`), ce n'est pas encore un véritable solveur physique par éléments finis.
*   **Génération 3D (STEP)** : La génération de fichier STEP via LLM (`generateSTEPFileWithAI`) est expérimentale et produit souvent des fichiers géométriquement simples ou invalides pour des formes complexes.
*   **Dépendance API** : Forte dépendance à la disponibilité des APIs Hugging Face et Mistral (gestion des timeouts et cold starts implémentée mais perceptible).

### Axes de Développement
1.  **Vrai Noyau 3D** : Intégrer une librairie de géométrie (comme OpenCascade.js) pour générer de vrais fichiers 3D paramétriques.
2.  **Fine-Tuning** : Entraîner un modèle LoRA spécifique sur des designs industriels primés pour améliorer l'esthétique "Pro".
3.  **Mode Collaboratif** : Utiliser les capacités Temps Réel de Supabase pour permettre à plusieurs designers de travailler sur le même "board" d'idéation.
