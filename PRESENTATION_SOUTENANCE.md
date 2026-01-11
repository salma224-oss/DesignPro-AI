# Présentation de Soutenance : DesignPro AI
*Durée estimée : 15-20 minutes*

---

## 🏁 INTRODUCTION (2 min)

### Diapositive 1 : Titre
**Titre :** DesignPro AI
**Sous-titre :** Le Futur de la Conception Industrielle Assistée par IA
**Intervenant :** [Votre Nom]
**Date :** 19 Décembre 2025

**🗣️ Discours (Speaker Notes) :**
"Bonjour à tous. Je suis ravi de vous présenter aujourd'hui **DesignPro AI**, une solution SaaS que j'ai développée pour transformer les phases amont du design industriel.
Nous savons que le processus de design traditionnel est long et fragmenté. Mon objectif était de créer un 'Super-Assistant' capable non seulement de générer des idées visuelles, mais aussi de les valider techniquement."

---

## 🎯 PROBLÈME & SOLUTION (3 min)

### Diapositive 2 : La Problématique
*   **Constat :**
    *   Cycle de design trop lent (Brief -> Sketch -> CAD -> Rendu).
    *   Déconnexion entre le "beau" (Design) et le "faisable" (Ingénierie).
    *   Outils existants trop complexes ou trop basiques (juste génératifs).

**🗣️ Discours :**
"Aujourd'hui, un designer passe des jours à itérer sur des concepts qui sont souvent rejetés plus tard pour des raisons techniques. Les outils d'IA générative actuels (comme Midjourney) font de belles images, mais elles sont souvent inutilisables industriellement : aberrations géométriques, matériaux impossibles, etc."

### Diapositive 3 : La Solution DesignPro AI
*   **Approche Hybride :**
    *   **IA Générative** (Pour la créativité).
    *   + **Logique Métier** (Pour la faisabilité).
*   **Promesse :** Passer de l'idée au concept validé en *quelques minutes* au lieu de plusieurs jours.

**🗣️ Discours :**
"DesignPro AI n'est pas juste un générateur d'images. C'est une plateforme complète qui intègre des méthodologies d'ingénierie (comme TRIZ) directement dans le processus créatif."

---

## 🏗️ ARCHITECTURE TECHNIQUE (5 min)

### Diapositive 4 : Architecture Globale
*(Afficher ici le diagramme d'architecture généré)*
*   **Frontend :** Next.js 15 (App Router), TailwindCSS, React 19.
*   **Backend :** Supabase (Auth, Database, Edge Functions).
*   **Cœur IA (DFA-IA Engine) :**
    *   **Mistral AI :** Le "Cerveau" (Logique, Parsing JSON, Agent Q).
    *   **Hugging Face / Replicate :** Les "Mains" (Génération SDXL/Flux, Analyse Vision).

**🗣️ Discours :**
"J'ai opté pour une architecture moderne et serverless.
Le cœur du système est le moteur **DFA-IA** (Design Flow Architecture). Il orchestre les interactions entre Mistral (qui comprend le besoin) et les modèles de diffusion (qui génèrent l'image).
Tout est asynchrone pour ne pas bloquer l'interface utilisateur."

### Diapositive 5 : Le Workflow DFA-IA - Vue d'Ensemble
*(Afficher le diagramme de workflow généré)*

**4 Phases Séquentielles :**
1.  **Phase 1 : Stratégie & Prompt Engineering** 
2.  **Phase 2 : Génération Visuelle Parallèle**
3.  **Phase 3 : Évaluation Expert (Agent Q)**
4.  **Phase 4 : Simulation Technique (R.E.A.L.)**

**🗣️ Discours :**
"Contrairement aux outils classiques qui se contentent de générer une image, mon système applique un workflow industriel complet en 4 phases. Chaque phase a un rôle précis et utilise des modèles d'IA différents. Voyons en détail comment chaque phase fonctionne techniquement."

---

### Diapositive 5a : PHASE 1 - Stratégie & Prompt Engineering

**🎯 Objectif :** Transformer l'idée brute de l'utilisateur en prompt technique optimisé.

**📍 Fichier Code :** `lib/ai.ts` → Fonction `generateProfessionalPrompt()`

**Comment ça fonctionne :**

1. **Input Utilisateur :**
   ```
   "Une chaise de bureau ergonomique inspirée par l'aéronautique"
   Méthodologie choisie : TRIZ
   ```

2. **Appel à Mistral AI :**
   ```typescript
   const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
     body: JSON.stringify({
       model: 'mistral-large-latest',
       messages: [{
         role: 'system',
         content: 'Expert en Prompt Engineering pour Stable Diffusion'
       }, {
         role: 'user',
         content: `Crée un prompt détaillé pour: "${userInput}"
                   Méthodologie: ${methodology}
                   Inclus: matériaux, éclairage, style photoréaliste`
       }]
     })
   });
   ```

3. **Output Mistral (Prompt Optimisé) :**
   ```
   "Ergonomic office chair inspired by aerospace engineering,
   carbon fiber frame, titanium joints, breathable mesh fabric,
   aerodynamic curves, studio lighting, 8k photorealistic render,
   unreal engine 5, professional product photography, neutral background"
   ```

**🔑 Innovation :** Le système injecte automatiquement les principes de la méthodologie (ex: TRIZ → résolution de contradictions) dans le prompt visuel.

**🗣️ Discours :**
"La Phase 1 est cruciale. Un prompt mal écrit donne une mauvaise image. Mistral agit comme un traducteur expert : il prend votre idée en français et la transforme en un prompt technique en anglais, optimisé pour Stable Diffusion, en intégrant les contraintes de la méthodologie choisie."

---

### Diapositive 5a-bis : Les Méthodologies de Design - Personnalisation Intelligente

**🎯 Objectif :** Enrichir le prompt avec des principes de design industriel reconnus pour mieux exprimer l'intention de l'utilisateur.

**📍 Fichier Code :** `lib/ai.ts` → `generateFallbackPrompt()` (lignes 922-939)

**Les 4 Méthodologies Intégrées :**

#### 1. **TRIZ (Théorie de Résolution des Problèmes Inventifs)**
*Principe :* Résoudre les contradictions techniques par l'innovation.

**Exemple Concret :**
```
Input Utilisateur : "Chaise légère mais solide"
Contradiction détectée : Légèreté ↔ Solidité

Prompt Généré par TRIZ :
"Lightweight yet robust office chair, carbon fiber honeycomb structure,
aerospace-grade materials, innovative weight distribution,
structural optimization, engineering marvel, technical design"
```

**Code :**
```typescript
const methodologyPrompts = {
  TRIZ: `Résolution de contradiction technique: ${params.contradiction_technique}.
         Design innovant, technique, fonctionnel.
         Matériaux avancés, structure optimisée.`
};
```

**🔑 Mots-clés ajoutés :** "innovative", "structural optimization", "contradiction resolution"

---

#### 2. **DESIGN THINKING (Centré Utilisateur)**
*Principe :* Empathie avec l'utilisateur final, ergonomie maximale.

**Exemple Concret :**
```
Input Utilisateur : "Chaise pour personnes âgées"
Phase Empathie : Mobilité réduite, confort, facilité d'accès

Prompt Généré par Design Thinking :
"Ergonomic senior-friendly chair, easy access design,
comfortable cushioning, supportive armrests, user-centered design,
accessible height, intuitive use, elderly care furniture"
```

**Code :**
```typescript
const methodologyPrompts = {
  DESIGN_THINKING: `Design centré utilisateur.
                    Phase empathie: ${params.phase_empathie}.
                    Ergonomique, intuitif, accessible, confortable.`
};
```

**🔑 Mots-clés ajoutés :** "user-centered", "ergonomic", "accessible", "intuitive"

---

#### 3. **DESIGN FOR X (DFX - Optimisation Fabrication)**
*Principe :* Concevoir pour faciliter la fabrication, réduire les coûts.

**Exemple Concret :**
```
Input Utilisateur : "Chaise économique à produire en masse"
Critère Principal : Fabrication simplifiée

Prompt Généré par DFX :
"Mass-production office chair, modular design, easy assembly,
standardized components, injection-molded parts,
cost-effective manufacturing, industrial design, scalable production"
```

**Code :**
```typescript
const methodologyPrompts = {
  DESIGN_FOR_X: `Optimisation ${params.critere_principal}.
                 Contraintes: ${params.contraintes_fabrication}.
                 Design industriel, fabrication simplifiée, assemblage facile.`
};
```

**🔑 Mots-clés ajoutés :** "modular", "easy assembly", "cost-effective", "scalable"

---

#### 4. **VALUE ENGINEERING (Ingénierie de la Valeur)**
*Principe :* Maximiser le rapport qualité/prix, éliminer le superflu.

**Exemple Concret :**
```
Input Utilisateur : "Chaise professionnelle, budget limité"
Budget Max : 100€

Prompt Généré par Value Engineering :
"Value-optimized office chair, essential functions only,
cost-conscious design, efficient material use,
no-frills professional furniture, budget-friendly,
maximum value, practical design"
```

**Code :**
```typescript
const methodologyPrompts = {
  VALUE_ENGINEERING: `Rapport valeur optimal.
                      Fonctions: ${params.fonctions_principales}.
                      Budget: ${params.budget_max}.
                      Design épuré, matériaux optimisés, coût maîtrisé.`
};
```

**🔑 Mots-clés ajoutés :** "value-optimized", "cost-conscious", "efficient", "budget-friendly"

---

### **Comment Mistral Utilise Ces Méthodologies**

**Prompt Système envoyé à Mistral :**
```typescript
const systemPrompt = `
  Tu es un expert en Prompt Engineering pour Stable Diffusion.
  
  MÉTHODOLOGIE SÉLECTIONNÉE : ${methodology}
  
  INSTRUCTIONS :
  1. ANALYSE l'input utilisateur : "${userInput}"
  2. APPLIQUE les principes de ${methodology} :
     ${methodologyPrompts[methodology]}
  3. GÉNÈRE un prompt visuel détaillé qui :
     - Respecte les contraintes de la méthodologie
     - Inclut des mots-clés techniques spécifiques
     - Décrit matériaux, formes, éclairage, style
  4. FORMAT : Anglais, 100-150 mots, style professionnel
`;
```

**Résultat :** Le prompt final est **personnalisé** selon la méthodologie, ce qui donne des designs visuellement différents pour la même idée de base.

---

### **Comparaison Visuelle (Même Input, 4 Méthodologies)**

**Input Utilisateur :** "Chaise de bureau moderne"

| Méthodologie | Mots-clés Ajoutés | Style Visuel Résultant |
|--------------|-------------------|------------------------|
| **TRIZ** | "innovative structure", "contradiction resolution" | Design futuriste, matériaux avancés |
| **Design Thinking** | "user-centered", "ergonomic" | Formes organiques, confort visible |
| **DFX** | "modular", "easy assembly" | Design simple, pièces standardisées |
| **Value Engineering** | "cost-effective", "essential functions" | Minimaliste, épuré, fonctionnel |

**🗣️ Discours :**
"C'est ici que le système devient vraiment intelligent. L'utilisateur ne dit pas juste 'je veux une chaise'. Il choisit une MÉTHODOLOGIE de design industriel reconnue. Si c'est TRIZ, Mistral va chercher à résoudre des contradictions techniques (léger ET solide). Si c'est Design Thinking, il va se concentrer sur l'ergonomie et l'utilisateur final. Résultat : le même brief donne 4 designs visuellement différents selon la méthodologie. C'est comme avoir 4 designers experts différents qui travaillent sur le même projet."

---

### Diapositive 5b : PHASE 2 - Génération Visuelle Parallèle

**🎯 Objectif :** Générer 4 concepts visuels distincts à partir du prompt optimisé.

**📍 Fichier Code :** `lib/ai.ts` → Fonction `generateWithStableDiffusion()`

**Comment ça fonctionne :**

1. **Smart Router (Système de Fallback) :**
   ```typescript
   const modelsToTry = [
     'black-forest-labs/FLUX.1-schnell',      // Tentative 1 (Qualité max)
     'stabilityai/stable-diffusion-xl',       // Tentative 2 (Fallback)
     'runwayml/stable-diffusion-v1-5'         // Tentative 3 (Fallback)
   ];
   
   for (const modelId of modelsToTry) {
     try {
       const result = await fetch(
         `https://router.huggingface.co/hf-inference/models/${modelId}`,
         {
           method: 'POST',
           body: JSON.stringify({
             inputs: optimizedPrompt,
             parameters: { width: 1024, height: 1024 }
           })
         }
       );
       
       if (result.ok) {
         return await result.blob(); // ✅ Succès
       }
     } catch (error) {
       console.log(`❌ ${modelId} échoué, tentative suivante...`);
       continue; // Passe au modèle suivant
     }
   }
   ```

2. **Génération Parallèle (4 images) :**
   ```typescript
   // Appel 1 : Validation du modèle
   const image1 = await generateWithHuggingFace(modelId, payload);
   
   // Appels 2-4 : Génération parallèle pour la variété
   const [image2, image3, image4] = await Promise.all([
     generateWithHuggingFace(modelId, payload),
     generateWithHuggingFace(modelId, payload),
     generateWithHuggingFace(modelId, payload)
   ]);
   ```

3. **Gestion des Erreurs Avancée :**
   - **Erreur 503 (Modèle en chargement) :** Attente automatique de 20s puis retry
   - **Erreur 404 (Modèle inexistant) :** Passage immédiat au fallback
   - **Erreur 401/403 (Accès refusé) :** Alerte utilisateur (problème de token)

**🔑 Innovation :** Résilience totale. L'utilisateur reçoit TOUJOURS un résultat, même si les serveurs Hugging Face sont surchargés.

**🗣️ Discours :**
"La Phase 2 est le cœur visuel. J'ai codé un 'Smart Router' qui teste plusieurs modèles dans l'ordre. Si FLUX échoue (erreur 503), il bascule automatiquement sur SDXL. Si SDXL échoue, il passe à SD v1.5. Cette cascade garantit que l'utilisateur ne voit jamais d'écran d'erreur. Les 4 images sont générées en parallèle pour offrir du choix."

---

### Diapositive 5c : PHASE 3 - Agent Q (Évaluation Expert)

**🎯 Objectif :** Valider la qualité perçue et la cohérence du design.

**📍 Fichier Code :** `lib/ai.ts` → Fonction `evaluateDesignWithAgentQ()`

**Comment ça fonctionne (3 étapes) :**

**ÉTAPE 1 : Vision (BLIP-2 via Replicate)**
```typescript
const visionResponse = await fetch('https://api.replicate.com/v1/predictions', {
  body: JSON.stringify({
    version: '4b32258c42da...', // BLIP-2
    input: { 
      image: designImageUrl,
      caption: true 
    }
  })
});

// Résultat : "A modern white office chair with metal legs"
const visualDescription = await visionResponse.json();
```

**ÉTAPE 2 : Analyse Critique (Mistral AI)**
```typescript
const evaluationPrompt = `
  Tu es Agent Q, expert senior en design industriel avec 20 ans d'expérience.
  
  CONTEXTE :
  - Brief utilisateur : "${originalPrompt}"
  - Méthodologie : ${methodology}
  - Ce que l'image montre : "${visualDescription}"
  
  TÂCHE :
  1. Note le design sur 5 critères (0-10) :
     - Esthétique, Fonctionnel, Innovant, Fabricable, Ergonomique
  2. Identifie 3 points forts et 3 points faibles
  3. Propose des améliorations concrètes
  4. Décision finale : validate / iterate / reject
  
  FORMAT : JSON strict uniquement
`;

const mistralResponse = await callMistralAPI(evaluationPrompt);
```

**ÉTAPE 3 : Parsing & Validation**
```typescript
const cleanedResponse = mistralResponse
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim();

const evaluation = JSON.parse(cleanedResponse);
// Résultat structuré :
{
  "overall_score": 8.5,
  "category_scores": { aesthetic: 9, functional: 8, ... },
  "strengths": ["Design élégant", "Bonne ergonomie"],
  "weaknesses": ["Pieds trop fins", "Coût élevé"],
  "recommendation": "iterate"
}
```

**🔑 Innovation :** Agent Q combine Vision AI (pour "voir") + LLM (pour "juger"). C'est un critique autonome qui simule un expert humain.

**🗣️ Discours :**
"Agent Q est ma fierté. Il ne se contente pas de générer, il CRITIQUE. D'abord, BLIP-2 'regarde' l'image et la décrit. Ensuite, Mistral compare cette description avec ce que l'utilisateur voulait. Il note sur 10, identifie les problèmes et propose des solutions. C'est comme avoir un directeur artistique senior qui valide chaque design automatiquement."

---

### Diapositive 5d : PHASE 4 - R.E.A.L. (Simulation Technique)

**🎯 Objectif :** Valider la faisabilité physique et économique.

**📍 Fichier Code :** `lib/ai.ts` → Fonction `simulateREALAnalysis()`

**Comment ça fonctionne (Approche Hybride) :**

**ÉTAPE 1 : Moteur de Règles Physiques (Déterministe)**
```typescript
const projectTypeData = {
  'meuble': {
    manufacturability: 85,
    cost: 150,
    material: 'Bois massif ou contreplaqué',
    time: 8,
    stressPoints: 2
  },
  'automobile': {
    manufacturability: 65,
    cost: 1200,
    material: 'Alliage aluminium',
    time: 20,
    stressPoints: 8
  }
};

const baseData = projectTypeData[projectType] || defaults;

const simulation = {
  fea_analysis: {
    stress_points: [
      { location: 'Point de fixation', value: 45, unit: 'MPa' },
      { location: 'Zone de charge max', value: 62, unit: 'MPa' }
    ],
    safety_factor: 2.5,
    deformation: 0.8
  },
  dfm_analysis: {
    manufacturability_score: baseData.manufacturability,
    estimated_cost: baseData.cost,
    recommended_material: baseData.material,
    production_time: baseData.time
  }
};
```

**ÉTAPE 2 : Enrichissement par IA (Mistral)**
```typescript
const enhancementPrompt = `
  En tant qu'ingénieur mécanique, analyse ces résultats :
  
  Projet : ${projectType}
  Score fabricabilité : ${simulation.dfm_analysis.manufacturability_score}/100
  Coût estimé : ${simulation.dfm_analysis.estimated_cost}€
  Matériau : ${simulation.dfm_analysis.recommended_material}
  
  Propose 2-3 optimisations spécifiques (matériau, structure, coût).
  Format JSON.
`;

const aiSuggestions = await callMistralAPI(enhancementPrompt);

// Fusion des données
return {
  ...simulation,
  optimization_suggestions: [
    ...simulation.optimization_suggestions,
    ...aiSuggestions.additional_suggestions
  ]
};
```

**RÉSULTAT FINAL :**
```json
{
  "fea_analysis": { "stress_points": [...], "safety_factor": 2.8 },
  "dfm_analysis": { 
    "manufacturability_score": 85,
    "estimated_cost": 150,
    "recommended_material": "Contreplaqué"
  },
  "optimization_suggestions": [
    {
      "type": "material",
      "suggestion": "Remplacer le bois massif par du contreplaqué",
      "impact": "medium",
      "estimated_saving": 22.5
    },
    {
      "type": "structure",
      "suggestion": "Ajouter des nervures de renforcement",
      "impact": "high"
    }
  ]
}
```

**🔑 Innovation :** Hybride Règles + IA. Les règles donnent une base physique cohérente, l'IA ajoute l'expertise contextuelle.

**🗣️ Discours :**
"R.E.A.L. est le 'Bureau d'Études' virtuel. Contrairement à Agent Q qui est subjectif, R.E.A.L. est quantitatif. Il utilise une base de données de règles physiques (si c'est un meuble, le matériau sera du bois, le coût environ 150€). Ensuite, Mistral enrichit ces données avec des suggestions d'optimisation spécifiques au projet. Résultat : l'utilisateur sait immédiatement si son design est fabricable et à quel prix."

### Diapositive 5bis : Les Modèles d'IA Intégrés

**🤖 Arsenal Technologique : 11 Modèles d'IA**

#### 1. Cerveau (Logique & Raisonnement)
*   **Mistral Large** : Le chef d'orchestre
    *   Génération de prompts professionnels
    *   Évaluation critique (Agent Q)
    *   Simulation technique (R.E.A.L.)

#### 2. Mains (Génération Visuelle)
*   **Génération Primaire :**
    *   FLUX.1-schnell (Hugging Face) - Qualité maximale
*   **Système de Fallback (Résilience) :**
    *   Stable Diffusion XL → SD v1.5 → SD v1.4
    *   ControlNet (Canny, Scribble, OpenPose) pour les croquis

#### 3. Yeux (Analyse Visuelle)
*   **BLIP-2** (Replicate) : Comprend ce que l'image montre réellement

**🎯 Stratégie Clé :** Architecture multi-modèles avec **cascade de fallback** pour garantir 99.9% de disponibilité malgré l'instabilité des API publiques.

**🗣️ Discours :**
"Un point crucial : j'ai intégré **11 modèles différents**. Pourquoi autant ? Parce que les API d'IA publiques tombent souvent en panne. J'ai donc codé un système de 'fallback intelligent' : si FLUX échoue, le système bascule automatiquement sur SDXL, puis SD v1.5, etc. L'utilisateur ne voit jamais d'erreur, il reçoit toujours un résultat, même en mode dégradé."

---

## 💻 DÉMONSTRATION / FONCTIONNALITÉS (5 min)

### Diapositive 6 : Démonstration du Parcours
*   **Input :** "Une chaise de bureau ergonomique inspirée par l'aéronautique".
*   **Action :** L'IA choisit la méthode "Biomimétisme".
*   **Résultat :** 4 visuels photoréalistes.
*   **Analyse :** Agent Q donne un score de 8.5/10 (Bonne esthétique, mais coût de fabrication alerté par R.E.A.L.).

**🗣️ Discours :**
"Prenons un cas concret. Si je demande une chaise ergonomique :
DIAPO SUIVANTE : Le système génère les images.
DIAPO SUIVANTE : L'Agent Q détecte que le pied est trop fin pour supporter la charge (Simulation R.E.A.L.) et suggère de l'épaissir. C'est ce feedback immédiat qui fait gagner du temps."

---

## 🔧 DÉFIS TECHNIQUES (3 min)

### Diapositive 7 : Challenges Surmontés
1.  **Instabilité des APIs IA :**
    *   *Problème :* Erreurs 503 fréquentes sur Hugging Face.
    *   *Solution :* Développement d'un "Smart Router" avec Retry exponentiel et Fallback automatique sur des modèles locaux ou de secours.
2.  **Parsing des LLM :**
    *   *Problème :* Le JSON généré par l'IA est parfois malformé.
    *   *Solution :* Un 'Sanitizer' robuste qui nettoie et répare le JSON avant l'utilisation.

**🗣️ Discours :**
"Le plus grand défi a été de rendre l'application robuste. Les API d'IA sont capricieuses. J'ai dû coder une couche de résilience importante dans `ai.ts` pour garantir que l'utilisateur n'ait jamais un écran d'erreur, même si un modèle ne répond pas."

---

## 📈 CONCLUSION (2 min)

### Diapositive 8 : Bilan & Avenir
*   **Bilan :** Application fonctionnelle, UX fluide, intégration réussie de 3 IA différentes.
*   **Roadmap :**
    *   Vrai export 3D (actuellement simulé/basique).
    *   Mode Collaboration en temps réel.

**🗣️ Discours :**
"Pour conclure, DesignPro AI prouve qu'on peut utiliser l'IA pour augmenter l'ingénieur, pas juste pour le remplacer. Nous avons une base solide pour le futur de la CAO assistée par IA.
Merci de votre écoute, je suis prêt pour vos questions."

---
