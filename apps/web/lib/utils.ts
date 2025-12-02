// Fonctions utilitaires pour les projets

/**
 * Retourne la classe de couleur Tailwind pour un statut donné
 */
export function getStatusColor(status: string | undefined): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    validation: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    archived: 'bg-red-100 text-red-800'
  };
  
  // ✅ SOLUTION : Vérification stricte avec assertion de type
  if (!status) return colors.draft;
  
  // ✅ Utilisation de l'assertion de type pour dire à TypeScript que c'est sûr
  const color = colors[status as keyof typeof colors];
  return color || colors.draft;
}

/**
 * Retourne le badge d'un rôle avec emoji
 */
export function getRoleBadge(role: string | undefined): string {
  const roles: Record<string, string> = {
    owner: '👑 Propriétaire',
    editor: '✏️ Éditeur', 
    viewer: '👀 Observateur'
  };
  
  // ✅ SOLUTION : Même approche
  if (!role) return 'Rôle inconnu';
  
  const badge = roles[role as keyof typeof roles];
  return badge || role;
}

/**
 * Formate une date en français
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'Date non disponible';
  
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Date invalide';
  }
}

/**
 * Combine les classes CSS en gérant les valeurs falsy
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Convertit une valeur en string sécurisée
 */
export function safeString(value: string | undefined | null): string {
  return value || '';
}

/**
 * Convertit une valeur en nombre sécurisé
 */
export function safeNumber(value: number | undefined | null): number {
  return value || 0;
}

/**
 * Valide un email
 */
export function isValidEmail(email: string | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Tronque un texte avec une limite de caractères
 */
export function truncateText(text: string | undefined, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(value: number | undefined | null): string {
  const safeValue = value || 0;
  return `${Math.round(safeValue)}%`;
}

/**
 * Génère un identifiant unique simple
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Débounce une fonction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Copie du texte dans le clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback pour les anciens navigateurs
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (fallbackError) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Télécharge un fichier
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convertit une taille de fichier en format lisible
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Capitalise la première lettre d'une string
 */
export function capitalizeFirst(str: string | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(number: number | undefined): string {
  if (!number && number !== 0) return '0';
  return number.toLocaleString('fr-FR');
}

/**
 * Vérifie si un objet est vide
 */
export function isEmpty(obj: Record<string, any> | undefined | null): boolean {
  if (!obj) return true;
  return Object.keys(obj).length === 0;
}

/**
 * Deep clone d'un objet simple
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Retourne l'emoji pour une méthodologie
 */
export function getMethodologyEmoji(methodology: string | undefined): string {
  const emojis: Record<string, string> = {
    TRIZ: '🔧',
    DFX: '🎯',
    DT: '👥',
    VE: '💰'
  };
  
  if (!methodology) return '📝';
  
  const emoji = emojis[methodology as keyof typeof emojis];
  return emoji || '📝';
}

/**
 * Retourne le nom complet d'une méthodologie
 */
export function getMethodologyName(methodology: string | undefined): string {
  const names: Record<string, string> = {
    TRIZ: 'TRIZ - Résolution Inventive',
    DFZ: 'Design for X - Optimisation',
    DT: 'Design Thinking - Centré Utilisateur',
    VE: 'Value Engineering - Optimisation Valeur'
  };
  
  if (!methodology) return 'Méthodologie non définie';
  
  const name = names[methodology as keyof typeof names];
  return name || methodology;
}

/**
 * Calcule la progression moyenne d'une liste de projets
 */
export function calculateAverageProgress(projects: Array<{ progress?: number }>): number {
  if (!projects.length) return 0;
  
  const total = projects.reduce((sum, project) => {
    return sum + (project.progress || 0);
  }, 0);
  
  return Math.round(total / projects.length);
}

/**
 * Filtre les projets par statut
 */
export function filterProjectsByStatus(
  projects: Array<{ status?: string }>, 
  status: string
): Array<{ status?: string }> {
  return projects.filter(project => project.status === status);
}

/**
 * Trie les projets par date de mise à jour
 */
export function sortProjectsByUpdateDate(
  projects: Array<{ updated_at?: string }>,
  order: 'asc' | 'desc' = 'desc'
): Array<{ updated_at?: string }> {
  return [...projects].sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

// ✅ VERSION ULTRA-SÉCURISÉE SANS ASSERTIONS (Alternative)
export function getStatusColorStrict(status: string | undefined): string {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    validation: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    archived: 'bg-red-100 text-red-800'
  } as const;

  if (!status) return colors.draft;
  
  // Vérification stricte sans assertion
  switch (status) {
    case 'draft':
      return colors.draft;
    case 'in_progress':
      return colors.in_progress;
    case 'validation':
      return colors.validation;
    case 'completed':
      return colors.completed;
    case 'archived':
      return colors.archived;
    default:
      return colors.draft;
  }
}

export function getRoleBadgeStrict(role: string | undefined): string {
  const roles = {
    owner: '👑 Propriétaire',
    editor: '✏️ Éditeur', 
    viewer: '👀 Observateur'
  } as const;

  if (!role) return 'Rôle inconnu';
  
  switch (role) {
    case 'owner':
      return roles.owner;
    case 'editor':
      return roles.editor;
    case 'viewer':
      return roles.viewer;
    default:
      return role;
  }
}

// Export par défaut pour faciliter l'import
const utils = {
  getStatusColor,
  getRoleBadge,
  formatDate,
  cn,
  safeString,
  safeNumber,
  isValidEmail,
  truncateText,
  formatPercentage,
  generateId,
  debounce,
  copyToClipboard,
  downloadFile,
  formatFileSize,
  capitalizeFirst,
  formatNumber,
  isEmpty,
  deepClone,
  getMethodologyEmoji,
  getMethodologyName,
  calculateAverageProgress,
  filterProjectsByStatus,
  sortProjectsByUpdateDate,
  // Versions strictes sans assertions
  getStatusColorStrict,
  getRoleBadgeStrict
};

export default utils;