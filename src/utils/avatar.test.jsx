import { describe, it, expect } from 'vitest';
import { generateAIAvatarSvg, getEvolutionLevel } from './avatar';
import { calculateRewards } from '../App';

describe('Avatar & Evolution Utils', () => {
  it('should generate valid SVG strings for different personas and styles', () => {
    const svg1 = generateAIAvatarSvg('User1', 'explorer', 'cosmic', 'gradient-cosmic', 0);
    const svg2 = generateAIAvatarSvg('User2', 'warrior', 'futuristic', 'gradient-forest', 600);
    const svg3 = generateAIAvatarSvg('User3', 'champion', 'minimalist', 'gradient-sunset', 1200);

    expect(svg1).toContain('<svg');
    expect(svg1).toContain('</svg>');
    expect(svg2).toContain('<svg');
    expect(svg2).toContain('</svg>');
    expect(svg3).toContain('<svg');
    expect(svg3).toContain('</svg>');
  });

  it('should accurately calculate evolution levels from points', () => {
    const l1 = getEvolutionLevel(50);
    expect(l1.title).toBe('Seedling');
    expect(l1.icon).toBe('spa');

    const l2 = getEvolutionLevel(120);
    expect(l2.title).toBe('Green Learner');
    expect(l2.icon).toBe('school');

    const l3 = getEvolutionLevel(600);
    expect(l3.title).toBe('Eco Warrior');
    expect(l3.icon).toBe('shield');

    const l4 = getEvolutionLevel(1200);
    expect(l4.title).toBe('Climate Champion');
    expect(l4.icon).toBe('stars');
  });

  it('should compute rewards based on carbon logs inputs', () => {
    const mockInputs = {
      transport: 'walk/bicycle',
      vehicleType: 'None',
      diet: 'vegan',
      recycling: ['Paper'],
      energyEfficiency: 'Yes',
      heatingEnergy: 'electricity'
    };

    const result = calculateRewards(mockInputs, 800, 1000);
    expect(result.unlockedCount).toBeGreaterThanOrEqual(5);
    expect(result.points).toBe(result.unlockedCount * 100);
    expect(result.list.find(r => r.id === 'transit_champion').unlocked).toBe(true);
    expect(result.list.find(r => r.id === 'green_diet').unlocked).toBe(true);
  });
});
