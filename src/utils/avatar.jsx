// Evolution details helper
export function getEvolutionLevel(points) {
  if (points >= 1000) {
    return { title: 'Climate Champion', level: 'Champion', icon: 'stars', xp: points };
  } else if (points >= 500) {
    return { title: 'Eco Warrior', level: 'Warrior', icon: 'shield', xp: points };
  } else if (points >= 100) {
    return { title: 'Green Learner', level: 'Learner', icon: 'school', xp: points };
  } else {
    return { title: 'Seedling', level: 'Seedling', icon: 'spa', xp: points };
  }
}

// XSS Sanitizer for procedurally rendered or user-supplied SVG content
export function sanitizeSvg(svgString) {
  if (!svgString) return '';
  const trimmed = svgString.trim();
  
  // Ensure it is a valid SVG tag to prevent general HTML/script injection
  if (!trimmed.toLowerCase().startsWith('<svg')) {
    return '';
  }
  
  // 1. Remove script tags and their contents
  let sanitized = trimmed.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  
  // 2. Remove HTML event handlers (onload, onerror, onclick, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '');
  
  // 3. Remove inline javascript/data protocol URIs in href / xlink:href
  sanitized = sanitized.replace(/(href|xlink:href)\s*=\s*(['"]\s*javascript:[^'"]*['"]|javascript:[^\s>]+)/gi, '');
  sanitized = sanitized.replace(/(href|xlink:href)\s*=\s*(['"]\s*data:[^'"]*['"]|data:[^\s>]+)/gi, '');
  
  // 4. Remove other potentially dangerous embedded content tags
  sanitized = sanitized.replace(/<(iframe|object|embed|meta|link|style-not-needed)[^>]*>([\s\S]*?)<\/\1>/gi, '');
  sanitized = sanitized.replace(/<(iframe|object|embed|meta|link)[^>]*\/?>/gi, '');
  
  return sanitized;
}

// Render dynamic user DPs matching Hotstar / JioCinema
export function ProfileAvatar({ avatar, className = "w-12 h-12" }) {
  if (!avatar) return <span className={`text-2xl flex items-center justify-center rounded-full bg-surface-container-high ${className}`}>👤</span>;
  
  if (avatar.trim().startsWith('<svg')) {
    const safeSvg = sanitizeSvg(avatar);
    return (
      <div 
        className={`rounded-full overflow-hidden flex items-center justify-center ${className}`}
        dangerouslySetInnerHTML={{ __html: safeSvg }}
      />
    );
  }
  
  return (
    <div className={`rounded-full bg-secondary-container/30 border border-outline-variant/30 flex items-center justify-center text-2xl select-none ${className}`}>
      {avatar}
    </div>
  );
}

// Generate beautiful, deterministic SVG avatars based on seed, persona, style, background, and evolution level (XP)
export function generateAIAvatarSvg(seed, persona = 'explorer', style = 'cosmic', bg = 'gradient-cosmic', xp = 0) {
  let hash = 0;
  const safeSeed = seed || 'guest';
  for (let i = 0; i < safeSeed.length; i++) {
    hash = safeSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const getRand = (min, max, offset = 0) => {
    const r = Math.abs(Math.sin(hash + offset));
    return min + r * (max - min);
  };

  // Background Gradients
  const gradients = {
    'gradient-cosmic': { start: '#3b1d60', end: '#0d071a', mid: '#1f0d3d' }, // Cosmic Deep Purple
    'gradient-forest': { start: '#0b4f30', end: '#021a0e', mid: '#05331e' }, // Emerald Forest
    'gradient-ocean': { start: '#0a3d62', end: '#041624', mid: '#072b47' },  // Deep Ocean Blue
    'gradient-sunset': { start: '#78350f', end: '#290b00', mid: '#4d1e05' }, // Amber Sunset
    'gradient-cyber': { start: '#580847', end: '#0a0210', mid: '#2c0428' },  // Cyberpunk Pink-Purple
    // Style fallbacks
    'cosmic': { start: '#3b1d60', end: '#0d071a', mid: '#1f0d3d' },
    'nature': { start: '#0b4f30', end: '#021a0e', mid: '#05331e' },
    'cyber': { start: '#580847', end: '#0a0210', mid: '#2c0428' },
    'geometry': { start: '#0a3d62', end: '#041624', mid: '#072b47' }
  };

  const grad = gradients[bg] || gradients[style] || gradients['gradient-cosmic'];
  const uniqueId = `ai-grad-${safeSeed.replace(/[^a-zA-Z0-9]/g, '')}-${persona}-${style}-${Math.abs(hash % 1000)}`;

  // Animation configuration
  const animIndex = Math.abs(hash) % 4;
  let animCss;

  if (animIndex === 0) {
    animCss = `@keyframes pulse-glow { 0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); } 50% { opacity: 1; filter: drop-shadow(0 0 10px rgba(255,255,255,0.8)); } } .anim-element { animation: pulse-glow 3s infinite ease-in-out; }`;
  } else if (animIndex === 1) {
    animCss = `@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } } .anim-element { animation: float 4s infinite ease-in-out; transform-origin: center; }`;
  } else if (animIndex === 2) {
    animCss = `@keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .anim-element-spin { animation: spin-slow 16s infinite linear; transform-origin: 50px 50px; }`;
  } else {
    animCss = `@keyframes drift { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; } 50% { transform: translate(2px, -3px) scale(1.2); opacity: 0.8; } } .anim-particle { animation: drift 5s infinite ease-in-out; }`;
  }

  // Visual Styles Elements
  let styleMarkup = '';
  if (style === 'futuristic' || style === 'cyber') {
    styleMarkup += `
      <g opacity="0.3" class="anim-element-spin">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#00ffcc" stroke-width="0.75" stroke-dasharray="10, 5, 2, 5" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#00ffcc" stroke-width="0.5" stroke-dasharray="5, 15" />
        <path d="M50 5 L50 15 M50 85 L50 95 M5 50 L15 50 M85 50 L95 50" stroke="#00ffcc" stroke-width="1" />
      </g>
      <g opacity="0.15">
        <path d="M 10,10 L 90,10 L 90,90 L 10,90 Z" fill="none" stroke="#ffffff" stroke-width="0.5" />
        <path d="M 20,20 L 80,20 L 80,80 L 20,80 Z" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-dasharray="2, 4" />
      </g>
    `;
  } else if (style === 'anime' || style === 'cosmic') {
    const starCount = Math.floor(getRand(6, 12, 10));
    let stars = '';
    for (let i = 0; i < starCount; i++) {
      const cx = getRand(15, 85, i * 7);
      const cy = getRand(15, 85, i * 13);
      const r = getRand(1, 3.5, i * 19);
      const op = getRand(0.3, 0.9, i * 3);
      stars += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="${op}" class="anim-particle" style="animation-delay: ${getRand(0, 3, i).toFixed(1)}s" />`;
    }
    styleMarkup += `
      <g opacity="0.35">
        <path d="M50 50 L100 50 M50 50 L0 50 M50 50 L50 0 M50 50 L50 100" stroke="#ffffff" stroke-width="0.5" stroke-dasharray="2, 8" />
        <path d="M50 50 L85 85 M50 50 L15 15 M50 50 L15 85 M50 50 L85 15" stroke="#ffffff" stroke-width="0.5" stroke-dasharray="4, 6" />
      </g>
      ${stars}
    `;
  } else if (style === '3d' || style === 'nature') {
    styleMarkup += `
      <circle cx="50" cy="50" r="48" fill="url(#shading-${uniqueId})" opacity="0.4" />
      <ellipse cx="50" cy="22" rx="28" ry="12" fill="#ffffff" opacity="0.12" />
      <circle cx="30" cy="30" r="4" fill="#ffffff" opacity="0.2" filter="url(#blur-${uniqueId})" />
    `;
  } else if (style === 'professional' || style === 'geometry') {
    styleMarkup += `
      <g opacity="0.25">
        <line x1="10" y1="50" x2="90" y2="50" stroke="#ffffff" stroke-width="0.5" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="#ffffff" stroke-width="0.5" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="#ffffff" stroke-width="0.5" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-dasharray="2, 2" />
        <polygon points="50,15 80,50 50,85 20,50" fill="none" stroke="#ffffff" stroke-width="0.5" />
      </g>
    `;
  } else {
    styleMarkup += `
      <g opacity="0.15">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#ffffff" stroke-width="0.75" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff" stroke-width="0.25" />
      </g>
    `;
  }

  // Persona Central Icons
  let personaMarkup = '';
  const iconColor = (style === 'minimalist' || style === 'professional') ? '#ffffff' : '#45f3a3';
  
  if (persona === 'explorer') {
    personaMarkup += `
      <g class="anim-element" transform="translate(50, 48) scale(0.9) translate(-50, -48)">
        <path d="M50 25 C63 38, 63 58, 50 71 C37 58, 37 38, 50 25 Z" fill="${iconColor}" fill-opacity="0.8" stroke="#ffffff" stroke-width="1.5" />
        <path d="M50 71 L50 25" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.9" />
        <path d="M50 40 Q57 44 59 47" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.8" />
        <path d="M50 48 Q43 52 41 55" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.8" />
        <path d="M50 56 Q57 60 59 63" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.8" />
        <polygon points="50,18 52,24 58,24 53,28 55,34 50,30 45,34 47,28 42,24 48,24" fill="#ffffff" />
      </g>
    `;
  } else if (persona === 'scientist') {
    personaMarkup += `
      <g class="anim-element" transform="translate(50, 48) scale(0.85) translate(-50, -48)">
        <ellipse cx="50" cy="48" rx="28" ry="8" transform="rotate(30 50 48)" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.7" />
        <ellipse cx="50" cy="48" rx="28" ry="8" transform="rotate(-30 50 48)" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.7" />
        <ellipse cx="50" cy="48" rx="28" ry="8" transform="rotate(90 50 48)" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.5" />
        <circle cx="64" cy="40" r="3.5" fill="#ffffff" filter="url(#glow-${uniqueId})" />
        <circle cx="36" cy="56" r="3.5" fill="#ffffff" />
        <circle cx="50" cy="20" r="2.5" fill="#ffffff" />
        <path d="M44 32 L44 38 L34 58 C32 62, 35 68, 40 68 L60 68 C65 68, 68 62, 66 58 L56 38 L56 32 Z" fill="#1b2e3c" fill-opacity="0.6" stroke="#ffffff" stroke-width="2" />
        <path d="M38 62 C42 60, 58 60, 62 62" stroke="#ffffff" stroke-width="1.5" />
        <path d="M50 42 C54 48, 54 58, 50 64 C46 58, 46 48, 50 42 Z" fill="${iconColor}" />
      </g>
    `;
  } else if (persona === 'warrior') {
    personaMarkup += `
      <g class="anim-element" transform="translate(50, 48) scale(0.9) translate(-50, -48)">
        <path d="M50 20 C68 20, 72 32, 70 54 C68 70, 50 80, 50 80 C50 80, 32 70, 30 54 C28 32, 32 20, 50 20 Z" fill="${grad.mid}" stroke="#ffffff" stroke-width="2.5" />
        <path d="M50 25 C64 25, 67 35, 65 52 C63 65, 50 74, 50 74 C50 74, 37 65, 35 52 C33 35, 36 25, 50 25 Z" fill="${iconColor}" fill-opacity="0.75" />
        <path d="M50 30 L50 68" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
        <path d="M42 42 L58 42 M44 36 L56 36" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        <circle cx="50" cy="71" r="3" fill="#ffffff" />
      </g>
    `;
  } else if (persona === 'guardian') {
    personaMarkup += `
      <g class="anim-element" transform="translate(50, 48) scale(0.85) translate(-50, -48)">
        <circle cx="50" cy="40" r="16" fill="${iconColor}" fill-opacity="0.8" stroke="#ffffff" stroke-width="1.5" />
        <path d="M42 32 Q46 36, 44 42 Q48 44, 46 48" stroke="#ffffff" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M54 30 Q58 35, 54 42 Q58 46, 56 50" stroke="#ffffff" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M26 62 Q36 68, 44 58 C44 58, 41 54, 39 54 Q33 58, 28 54 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1" />
        <path d="M74 62 Q64 68, 56 58 C56 58, 59 54, 61 54 Q67 58, 72 54 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1" />
        <path d="M50 56 Q50 68, 50 68" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        <path d="M50 60 Q55 58, 58 59" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
        <path d="M50 63 Q45 61, 42 62" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
      </g>
    `;
  } else {
    personaMarkup += `
      <g class="anim-element" transform="translate(50, 48) scale(0.85) translate(-50, -48)">
        <path d="M30 55 C26 42, 32 28, 42 22 Q40 28, 40 36 C40 46, 45 50, 45 50" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" />
        <path d="M70 55 C74 42, 68 28, 58 22 Q60 28, 60 36 C60 46, 55 50, 55 50" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="31" cy="46" r="3" fill="#ffffff" />
        <circle cx="33" cy="35" r="3" fill="#ffffff" />
        <circle cx="39" cy="27" r="3" fill="#ffffff" />
        <circle cx="69" cy="46" r="3" fill="#ffffff" />
        <circle cx="67" cy="35" r="3" fill="#ffffff" />
        <circle cx="61" cy="27" r="3" fill="#ffffff" />
        <polygon points="36,65 39,45 46,53 50,40 54,53 61,45 64,65" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" />
        <circle cx="39" cy="42" r="2.5" fill="${iconColor}" />
        <circle cx="50" cy="37" r="2.5" fill="${iconColor}" />
        <circle cx="61" cy="42" r="2.5" fill="${iconColor}" />
        <rect x="34" y="66" width="32" height="4" rx="2" fill="#ffffff" />
      </g>
    `;
  }

  // Evolution Overlays
  let evolutionMarkup = '';
  if (xp >= 1000) {
    evolutionMarkup += `
      <g opacity="0.8">
        <ellipse cx="50" cy="50" rx="49" ry="18" transform="rotate(-15 50 50)" fill="none" stroke="#ffd700" stroke-width="2.5" stroke-dasharray="160 20 50 20" filter="url(#glow-${uniqueId})" />
        <ellipse cx="50" cy="50" rx="49" ry="18" transform="rotate(-15 50 50)" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="160 20 50 20" />
        <circle cx="94" cy="38" r="4.5" fill="#ffd700" filter="url(#glow-${uniqueId})" />
        <circle cx="6" cy="62" r="2.5" fill="#ffffff" />
      </g>
    `;
  } else if (xp >= 500) {
    styleMarkup += `
      <g opacity="0.16" transform="translate(50, 52) scale(1.15) translate(-50, -52)">
        <path d="M50 15 C58 15, 66 22, 66 32 C66 42, 60 48, 50 52 C40 48, 34 42, 34 32 C34 22, 42 15, 50 15 Z" fill="#000000" />
        <rect x="47" y="50" width="6" height="24" fill="#000000" />
        <path d="M42 60 L48 56 M58 64 L52 58" stroke="#000000" stroke-width="2" />
      </g>
    `;
  } else if (xp >= 100) {
    evolutionMarkup += `
      <circle cx="50" cy="50" r="45" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="12 4 4 4" opacity="0.85" />
      <g fill="#22c55e" opacity="0.9">
        <path d="M85 25 Q82 22, 79 24 Q80 27, 83 28 Z" />
        <path d="M15 75 Q18 78, 21 76 Q20 73, 17 72 Z" />
        <path d="M82 72 Q85 75, 88 73 Q86 70, 83 70 Z" />
        <path d="M18 28 Q15 25, 12 27 Q14 30, 17 30 Z" />
      </g>
    `;
  } else {
    evolutionMarkup += `
      <g transform="translate(74, 74) scale(0.24)" filter="url(#drop-shadow-${uniqueId})">
        <circle cx="50" cy="50" r="48" fill="#1b4d3e" stroke="#ffffff" stroke-width="6" />
        <path d="M50 22 C64 34, 64 54, 50 66 C36 54, 36 34, 50 22 Z" fill="#45f3a3" />
        <path d="M50 66 L50 22" stroke="#ffffff" stroke-width="4" />
        <path d="M50 35 Q58 39, 60 42" stroke="#ffffff" stroke-width="3" />
        <path d="M50 45 Q42 49, 40 52" stroke="#ffffff" stroke-width="3" />
      </g>
    `;
  }

  // Complete SVG String
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${grad.start}" />
          <stop offset="50%" stop-color="${grad.mid}" />
          <stop offset="100%" stop-color="${grad.end}" />
        </linearGradient>
        
        <radialGradient id="shading-${uniqueId}" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
          <stop offset="50%" stop-color="#000000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.8" />
        </radialGradient>

        <filter id="glow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <filter id="blur-${uniqueId}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        
        <filter id="drop-shadow-${uniqueId}" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.5" />
        </filter>

        <style>
          ${animCss}
        </style>
      </defs>
      
      ${xp >= 1000 ? `<circle cx="50" cy="50" r="49" fill="none" stroke="#ffd700" stroke-width="0.5" opacity="0.3" />` : ''}

      <circle cx="50" cy="50" r="47" fill="url(#${uniqueId})" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
      
      ${styleMarkup}

      ${personaMarkup}
      
      ${evolutionMarkup}
    </svg>
  `;

  return svg;
}
