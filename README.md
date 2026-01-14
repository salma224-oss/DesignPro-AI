#  DesignPro AI - Plateforme de Conception Industrielle Intelligente

DesignPro AI est une application SaaS innovante qui révolutionne le processus de design industriel grâce à l'intelligence artificielle générative. Elle accompagne les créateurs de l'idéation à la validation technique, en passant par la visualisation haute fidélité.

![DesignPro AI Banner](DESIGN.png)

## Vision et Concept : Le Workflow DFA-IA

Le projet repose sur le paradigme **DFA-IA (Design For AI)**, une méthodologie qui remplace l'approche séquentielle traditionnelle par un processus unifié et circulaire.

L'objectif est de résorber la "Vallée de la Mort" de l'innovation industrielle, cette période critique où les concepts créatifs échouent par manque de validation technique précoce. DesignPro AI permet une co-création où l'IA ne se contente pas d'exécuter, mais propose des solutions viables basées sur des contraintes physiques et économiques.

## Fonctionnalités Détaillées

### 1. Module d'Idéation Cognitif
Ce module agit comme un catalyseur de créativité, structuré pour dépasser le syndrome de la page blanche.
*   **Prompt Engineering Sémantique** : Le système utilise **Mistral AI** pour analyser les besoins fonctionnels et générer des descriptions techniques précises (matériaux, finitions, environnement).
*   **Support Méthodologique** : Intégration native de cadres de réflexion avancés :
    *   **TRIZ** : Résolution de contradictions techniques.
    *   **Biomimétisme** : Inspiration des formes naturelles pour l'efficience structurelle.
    *   **Design Thinking** : Approche centrée utilisateur.

### 2. Moteur de Synthèse Visuelle (Visual Engine)
Le cœur graphique de la plateforme combine plusieurs modèles de pointe pour garantir fidélité et contrôlabilité.
*   **Text-to-Image Haute Fidélité** : Utilisation de **Stable Diffusion XL (SDXL)** pour générer des rendus photoréalistes avec une gestion fine de l'éclairage et des textures.
*   **Conditionnement Géométrique (ControlNet)** : Technologie permettant de transformer un croquis grossier ("napkin sketch") en rendu final sans perdre la géométrie originale.
*   **Raffinement Itératif** : Capacité à effectuer des variations subtiles sur un concept existant (Image-to-Image) pour explorer des alternatives de couleurs, de matériaux ou de formes.

### 3. Agent Q : L'Auditeur de Design
L'Agent Q est un système d'évaluation autonome qui simule le jugement d'un directeur artistique senior.
*   **Perception Visuelle** : Grâce au modèle **BLIP-2** (via Replicate), l'agent "voit" réellement l'image générée et ne se base pas uniquement sur le texte.
*   **Analyse Heuristique** : Il évalue les concepts selon les **10 principes du bon design de Dieter Rams** (Innovation, Utilité, Esthétique, Compréhension, Discrétion, Honnêteté, Durabilité, etc.).
*   **Scoring Multicritère** : Attribution d'une note globale et de recommandations textuelles pour améliorer le design.

### 4. Moteur R.E.A.L. (Robust Engineering Analysis Loop)
Ce module introduit une rupture technologique en apportant la simulation d'ingénierie au début du processus créatif.
*   **Simulation Prédictive** : Contrairement aux calculs par éléments finis (FEA) lents et coûteux, R.E.A.L. utilise une **approximation tensorielle** pour estimer instantanément les zones de faiblesse structurelle.
*   **Analyse de Manufacturabilité (DFM)** : Estimation de la faisabilité industrielle (ex: injection plastique, usinage CNC) en analysant la complexité des volumes et des courbures.
*   **Impact Économique et Écologique** : Estimation préliminaire du coût de production et de l'empreinte carbone basée sur le volume de matière et le type de matériau choisi.

## Architecture Technique Approfondie

La plateforme est construite sur une architecture Cloud-Native robuste, conçue pour l'évolutivité et la résilience.

### Stack Technologique
*   **Frontend & Application** : Développé en **Next.js 15 (App Router)** avec **TypeScript** et **React 19** pour une interface fluide et réactive. Le design system utilise **Tailwind CSS** avec une esthétique "Glassmorphism" pour une expérience utilisateur premium.
*   **Backend & Data** : **Supabase** fournit une infrastructure Serverless complète :
    *   Base de données **PostgreSQL** relationnelle pour les données structurées.
    *   Authentification sécurisée et Row Level Security (RLS) pour l'isolation des données utilisateurs.
    *   Stockage vectoriel (pgvector) préparé pour les futures fonctionnalités de recherche sémantique.
*   **Orchestration IA (`lib/ai.ts`)** : Un contrôleur central gère les appels aux différentes API d'IA, implémentant des mécanismes de :
    *   **Failover** : Bascule automatique vers des modèles plus légers (ex: SD 1.5) si les modèles principaux sont surchargés.
    *   **Retry Logic** : Gestion intelligente des erreurs (Cold Start, Timeout).

### Cartographie des Modèles IA
| Composant | Modèle Principal | Fournisseur | Rôle |
| :------- | :--------------- | :---------- | :--- |
| **Cerveau** | Mistral Large | Mistral AI | Raisonnement, Prompts, Analyse |
| **Rendu** | SDXL 1.0 | Hugging Face | Génération d'images HD |
| **Contrôle** | ControlNet Scribble | Hugging Face | Respect des contours du sketch |
| **Vision** | BLIP-2 | Replicate | Analyse visuelle pour l'Agent Q |
| **Texture** | FLUX.1-dev | Replicate | (Optionnel) Détails ultra-réalistes |

## Performance et Impact

Les benchmarks internes montrent une accélération drastique des phases préliminaires de conception :

*   **Cycle d'Idéation** : Réduit de 16h à **4 minutes** pour générer 4 concepts viables.
*   **Pré-validation Technique** : Analyse de stress et de coût obtenue en **30 secondes** contre 4 heures en processus classique.
*   **Gain de Productivité Global** : Estimé à un facteur **x20** sur la phase d'avant-projet.

## Installation et Démarrage

### Prérequis Système
*   **Runtime** : Node.js v18+
*   **Package Manager** : pnpm (fortement recommandé pour le support monorepo) ou npm
*   **Services** : Compte Supabase, Clés API (Mistral AI, Hugging Face)

### Procédure d'Installation

1.  **Clonage du Dépôt**
    ```bash
    git clone https://github.com/votre-username/mon-app-design.git
    cd mon-app-design
    ```

2.  **Installation des Dépendances**
    ```bash
    pnpm install
    ```

3.  **Configuration des Variables d'Environnement**
    Dupliquez le fichier `.env.example` en `.env.local` dans le dossier `apps/web` et renseignez vos clés :
    ```env
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-publique

    # AI Providers Keys
    MISTRAL_API_KEY=votre-cle-mistral-ai
    HF_API_TOKEN=votre-hugging-face-token (Droit 'Read' requis)
    # REPLICATE_API_TOKEN=si-utilisation-fonctionnalites-avancees
    ```

4.  **Initialisation de la Base de Données**
    Utilisez les fichiers SQL présents dans `packages/supabase/migrations` pour structurer votre base Supabase.
    *   `001_initial_schema.sql` : Tables utilisateurs et projets.
    *   `002_create_project_states.sql` : Gestion des états d'itération et JSONB complexe.

5.  **Lancement en Développement**
    ```bash
    pnpm dev
    ```
    L'application sera accessible à l'adresse `http://localhost:3000`.

## Contribution
Les contributions sont les bienvenues, notamment sur l'amélioration des algorithmes de scoring de l'Agent Q et l'optimisation des prompts de génération. Merci de respecter les conventions de code établies (ESLint).

## Licence
Ce projet est distribué sous licence MIT.
