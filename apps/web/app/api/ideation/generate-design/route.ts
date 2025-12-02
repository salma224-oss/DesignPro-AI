import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '~/lib/supabase';

// Configuration des modèles avec fallbacks
const MODEL_CONFIG = {
  SD: {
    primary: "runwayml/stable-diffusion-v1-5",
    fallbacks: [
      "stabilityai/stable-diffusion-2-1",
      "stabilityai/stable-diffusion-xl-base-1.0"
    ]
  },
  CONTROLNET: {
    primary: "lllyasviel/sd-controlnet-scribble",
    fallbacks: [
      "lllyasviel/sd-controlnet-canny",
      "lllyasviel/sd-controlnet-openpose"
    ]
  },
  IMG2IMG: {
    primary: "runwayml/stable-diffusion-v1-5",
    fallbacks: [
      "stabilityai/stable-diffusion-2-1"
    ]
  }
};

// Fonction pour générer des images de démonstration réalistes
async function generateRealisticFallbackImages(prompt: string, count: number = 4): Promise<string[]> {
  console.log('🎨 Génération images de démonstration réalistes');
  
  // Images plus variées pour la démo
  const demoImages = [
    'https://images.unsplash.com/photo-1581094794321-8410e6f0e61d?w=512&h=512&fit=crop', // Design industriel
    'https://images.unsplash.com/photo-1581094794321-8410e6f0e61d?w=512&h=512&fit=crop', 
    'https://images.unsplash.com/photo-1581094794321-8410e6f0e61d?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1581094794321-8410e6f0e61d?w=512&h=512&fit=crop'
  ];

  return demoImages.slice(0, count);
}

// Fonction pour vérifier la configuration Hugging Face
function checkHuggingFaceConfig(): { isConfigured: boolean; message: string } {
  const apiToken = process.env.HF_API_TOKEN;
  
  if (!apiToken) {
    return { 
      isConfigured: false, 
      message: 'HF_API_TOKEN non configurée dans les variables d\'environnement' 
    };
  }
  
  if (apiToken === 'votre_token_huggingface_ici' || !apiToken.startsWith('hf_')) {
    return { 
      isConfigured: false, 
      message: 'HF_API_TOKEN invalide. Configurez une clé valide.' 
    };
  }
  
  return { isConfigured: true, message: 'Configuration Hugging Face OK' };
}

// ✅ NOUVELLE FONCTION : Test d'accessibilité d'un modèle
async function testModelAccessibility(modelId: string): Promise<{ accessible: boolean; error?: string }> {
  try {
    const response = await fetch(`https://router.huggingface.co/models/${modelId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
      },
    });

    if (response.ok) {
      return { accessible: true };
    } else {
      const errorText = await response.text();
      return { 
        accessible: false, 
        error: `Modèle ${modelId} non accessible: ${response.status} ${errorText}` 
      };
    }
  } catch (error: any) {
    return { 
      accessible: false, 
      error: `Erreur de connexion pour ${modelId}: ${error.message}` 
    };
  }
}

// ✅ NOUVELLE FONCTION : Génération avec gestion d'erreurs robuste
async function generateWithHuggingFace(
  modelId: string, 
  payload: any, 
  options: { wait_for_model?: boolean } = {}
): Promise<{ imageBlob: Blob; modelUsed: string }> {
  
  const url = `https://router.huggingface.co/models/${modelId}`;
  
  // Ajouter wait_for_model si demandé
  const finalUrl = options.wait_for_model ? `${url}?wait_for_model=true` : url;
  
  console.log(`🔄 Tentative génération avec ${modelId}...`);
  
  const response = await fetch(finalUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Erreur API Hugging Face (${modelId}):`, {
      status: response.status,
      error: errorText
    });
    
    throw new Error(`Erreur ${modelId} (${response.status}): ${errorText}`);
  }

  const imageBlob = await response.blob();
  
  // Vérifier que c'est bien une image
  if (!imageBlob.type.startsWith('image/')) {
    throw new Error(`Réponse invalide de ${modelId}: attendu une image, reçu ${imageBlob.type}`);
  }

  return { imageBlob, modelUsed: modelId };
}

export async function POST(request: NextRequest) {
  let body: any = null;

  try {
    body = await request.json();
    const {
      projectId,
      generationMethod,
      prompt,
      sketch,
      image,
      methodology
    } = body;

    console.log('🎨 API Generate Design - Début:', {
      projectId,
      generationMethod,
      hasPrompt: !!prompt,
      hasSketch: !!sketch,
      hasImage: !!image,
      promptPreview: prompt?.substring(0, 100)
    });

    // Validation
    if (!projectId || !generationMethod) {
      return NextResponse.json(
        { error: 'Données manquantes: projectId et generationMethod requis' },
        { status: 400 }
      );
    }

    // Vérifier la configuration Hugging Face
    const hfConfig = checkHuggingFaceConfig();
    console.log('🔧 Configuration Hugging Face:', hfConfig);

    let images: string[] = [];
    let source = 'local-fallback';
    let model = 'demo-generator';
    let used_fallback = true;
    let fallback_reason = '';
    let model_attempts: string[] = [];

    if (hfConfig.isConfigured) {
      try {
        // Essayer Hugging Face avec gestion d'erreurs robuste
        let generationResult;
        
        switch (generationMethod) {
          case 'sdxl':
          case 'prompt':
            if (!prompt) {
              return NextResponse.json(
                { error: 'Prompt requis pour la génération' },
                { status: 400 }
              );
            }
            console.log('🚀 Tentative génération avec Stable Diffusion...');
            generationResult = await generateWithStableDiffusionWithFallback(prompt);
            break;

          case 'controlnet':
            if (!sketch) {
              return NextResponse.json(
                { error: 'Sketch requis pour ControlNet' },
                { status: 400 }
              );
            }
            console.log('✏️ Tentative génération ControlNet...');
            generationResult = await generateWithControlNetWithFallback(sketch, prompt);
            break;

          case 'img2img':
            if (!image) {
              return NextResponse.json(
                { error: 'Image requise pour Img2Img' },
                { status: 400 }
              );
            }
            console.log('🖼️ Tentative génération Img2Img...');
            generationResult = await generateWithImg2ImgWithFallback(image, prompt);
            break;

          default:
            return NextResponse.json(
              { error: 'Méthode de génération non supportée' },
              { status: 400 }
            );
        }

        images = generationResult.images;
        source = generationResult.source;
        model = generationResult.model;
        used_fallback = generationResult.used_fallback;
        fallback_reason = generationResult.fallback_reason || '';
        model_attempts = generationResult.model_attempts || [];

      } catch (hfError: any) {
        console.error('❌ Erreur Hugging Face après tous les fallbacks:', hfError);
        fallback_reason = hfError.message;
        used_fallback = true;
        
        // Générer des images de démonstration réalistes
        images = await generateRealisticFallbackImages(prompt || 'design industriel');
      }
    } else {
      console.log('⚠️ Hugging Face non configuré, utilisation du fallback');
      fallback_reason = hfConfig.message;
      images = await generateRealisticFallbackImages(prompt || 'design industriel');
    }

    // Sauvegarder les résultats dans Supabase
    if (images.length > 0) {
      try {
        await supabase
          .from('project_states')
          .upsert({
            project_id: projectId,
            generation_method: generationMethod,
            design_results: { 
              images, 
              source, 
              model,
              prompt_used: prompt,
              methodology,
              used_fallback,
              fallback_reason,
              model_attempts
            },
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'project_id'
          });
      } catch (dbError) {
        console.error('❌ Erreur sauvegarde Supabase:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      images: images,
      source: source,
      model: model,
      count: images.length,
      projectId: projectId,
      used_fallback: used_fallback,
      fallback_reason: fallback_reason,
      model_attempts: model_attempts,
      huggingface_configured: hfConfig.isConfigured
    });

  } catch (error: any) {
    console.error('❌ Erreur critique génération design:', error);
    
    const fallbackImages = await generateRealisticFallbackImages('design industriel');
    
    return NextResponse.json({
      success: true,
      images: fallbackImages,
      source: 'local-fallback-error',
      model: 'demo-generator',
      count: fallbackImages.length,
      projectId: body?.projectId || 'unknown',
      used_fallback: true,
      fallback_reason: 'Erreur critique: ' + error.message,
      huggingface_configured: false,
      warning: 'Service principal indisponible, images de démonstration générées'
    });
  }
}

// 🚀 Génération avec Stable Diffusion avec fallbacks
async function generateWithStableDiffusionWithFallback(prompt: string): Promise<{
  images: string[];
  source: string;
  model: string;
  used_fallback: boolean;
  fallback_reason?: string;
  model_attempts: string[];
}> {
  
  const modelsToTry = [MODEL_CONFIG.SD.primary, ...MODEL_CONFIG.SD.fallbacks];
  const modelAttempts: string[] = [];
  
  for (const modelId of modelsToTry) {
    try {
      modelAttempts.push(modelId);
      
      // Tester d'abord l'accessibilité du modèle
      const accessibility = await testModelAccessibility(modelId);
      if (!accessibility.accessible) {
        console.log(`⚠️ Modèle ${modelId} non accessible: ${accessibility.error}`);
        continue;
      }
      
      const payload = {
        inputs: prompt + ", professional industrial design, high quality, detailed, realistic materials, studio lighting, product design",
        parameters: {
          num_inference_steps: 25,
          guidance_scale: 7.5,
          width: 512,
          height: 512,
        }
      };
      
      const result = await generateWithHuggingFace(modelId, payload, { wait_for_model: true });
      const images = await convertBlobToBase64Array(result.imageBlob, 4);
      
      return {
        images,
        source: 'huggingface',
        model: result.modelUsed,
        used_fallback: false,
        model_attempts: modelAttempts
      };
      
    } catch (error: any) {
      console.log(`❌ Échec avec ${modelId}:`, error.message);
      // Continuer avec le modèle suivant
    }
  }
  
  // Si tous les modèles ont échoué
  const fallbackImages = await generateRealisticFallbackImages(prompt);
  return {
    images: fallbackImages,
    source: 'local-fallback',
    model: 'demo-generator',
    used_fallback: true,
    fallback_reason: `Tous les modèles Stable Diffusion ont échoué. Tentatives: ${modelAttempts.join(', ')}`,
    model_attempts: modelAttempts
  };
}

// ✏️ Génération avec ControlNet avec fallbacks
async function generateWithControlNetWithFallback(sketch: string, prompt?: string): Promise<{
  images: string[];
  source: string;
  model: string;
  used_fallback: boolean;
  fallback_reason?: string;
  model_attempts: string[];
}> {
  
  const cleanedSketch = sketch.replace(/^data:image\/\w+;base64,/, "");
  const controlnetPrompt = prompt || "professional industrial design, high quality, detailed product, realistic materials";
  
  const modelsToTry = [MODEL_CONFIG.CONTROLNET.primary, ...MODEL_CONFIG.CONTROLNET.fallbacks];
  const modelAttempts: string[] = [];
  
  for (const modelId of modelsToTry) {
    try {
      modelAttempts.push(modelId);
      
      // Tester l'accessibilité du modèle
      const accessibility = await testModelAccessibility(modelId);
      if (!accessibility.accessible) {
        console.log(`⚠️ Modèle ${modelId} non accessible: ${accessibility.error}`);
        continue;
      }
      
      const payload = {
        inputs: {
          image: `data:image/png;base64,${cleanedSketch}`,
          prompt: controlnetPrompt
        },
        parameters: {
          num_inference_steps: 20,
          guidance_scale: 7.5,
          width: 512,
          height: 512,
        }
      };
      
      const result = await generateWithHuggingFace(modelId, payload, { wait_for_model: true });
      const images = await convertBlobToBase64Array(result.imageBlob, 4);
      
      return {
        images,
        source: 'huggingface-controlnet',
        model: result.modelUsed,
        used_fallback: false,
        model_attempts: modelAttempts
      };
      
    } catch (error: any) {
      console.log(`❌ Échec avec ${modelId}:`, error.message);
      // Continuer avec le modèle suivant
    }
  }
  
  // Fallback vers Stable Diffusion normal si ControlNet échoue
  try {
    console.log('🔄 Fallback vers Stable Diffusion standard...');
    const sdResult = await generateWithStableDiffusionWithFallback(controlnetPrompt);
    return {
      ...sdResult,
      fallback_reason: `ControlNet échoué, utilisation de Stable Diffusion. Tentatives ControlNet: ${modelAttempts.join(', ')}`
    };
  } catch (sdError) {
    // Final fallback
    const fallbackImages = await generateRealisticFallbackImages(controlnetPrompt);
    return {
      images: fallbackImages,
      source: 'local-fallback',
      model: 'demo-generator',
      used_fallback: true,
      fallback_reason: `Tous les modèles ont échoué. Tentatives: ${modelAttempts.join(', ')}`,
      model_attempts: modelAttempts
    };
  }
}

// 🖼️ Génération avec Img2Img avec fallbacks (similaire à ControlNet)
async function generateWithImg2ImgWithFallback(inputImage: string, prompt?: string): Promise<{
  images: string[];
  source: string;
  model: string;
  used_fallback: boolean;
  fallback_reason?: string;
  model_attempts: string[];
}> {
  
  const cleanedImage = inputImage.replace(/^data:image\/\w+;base64,/, "");
  const img2imgPrompt = prompt || "professional product design variations, high quality, different styles and colors";
  
  const modelsToTry = [MODEL_CONFIG.IMG2IMG.primary, ...MODEL_CONFIG.IMG2IMG.fallbacks];
  const modelAttempts: string[] = [];
  
  for (const modelId of modelsToTry) {
    try {
      modelAttempts.push(modelId);
      
      const accessibility = await testModelAccessibility(modelId);
      if (!accessibility.accessible) {
        console.log(`⚠️ Modèle ${modelId} non accessible: ${accessibility.error}`);
        continue;
      }
      
      const payload = {
        inputs: {
          image: `data:image/png;base64,${cleanedImage}`,
          prompt: img2imgPrompt
        },
        parameters: {
          num_inference_steps: 25,
          strength: 0.8,
          guidance_scale: 7.5,
        }
      };
      
      const result = await generateWithHuggingFace(modelId, payload, { wait_for_model: true });
      const images = await convertBlobToBase64Array(result.imageBlob, 4);
      
      return {
        images,
        source: 'huggingface-img2img',
        model: result.modelUsed,
        used_fallback: false,
        model_attempts: modelAttempts
      };
      
    } catch (error: any) {
      console.log(`❌ Échec avec ${modelId}:`, error.message);
    }
  }
  
  // Fallback vers génération standard
  const fallbackResult = await generateWithStableDiffusionWithFallback(img2imgPrompt);
  return {
    ...fallbackResult,
    fallback_reason: `Img2Img échoué, utilisation de génération standard. Tentatives: ${modelAttempts.join(', ')}`
  };
}

// 🔄 Fonction utilitaire pour convertir Blob en base64
async function convertBlobToBase64Array(blob: Blob, expectedCount: number): Promise<string[]> {
  try {
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64}`;
    
    // Retourner la même image plusieurs fois (HF ne retourne qu'une image)
    return Array(expectedCount).fill(imageUrl);
  } catch (error) {
    console.error('❌ Erreur conversion blob vers base64:', error);
    throw new Error('Erreur lors de la conversion des images');
  }
}