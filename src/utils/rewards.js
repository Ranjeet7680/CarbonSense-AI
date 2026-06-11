export const calculateRewards = (inputs, latestScore, offsetTotal) => {
  const list = [
    {
      id: 'transit_champion',
      title: 'Transit Champion',
      desc: 'Unlock by walking/biking, driving an electric car, or taking public transit.',
      unlocked: inputs ? (inputs.transport === 'walk/bicycle' || inputs.vehicleType === 'electric' || inputs.transport === 'public') : true, // Default true for demo
      icon: 'directions_run',
      color: 'bg-emerald-500'
    },
    {
      id: 'green_diet',
      title: 'Plant Power',
      desc: 'Unlock by adopting a vegan or vegetarian diet.',
      unlocked: inputs ? (inputs.diet === 'vegan' || inputs.diet === 'vegetarian') : true, // Default true for demo
      icon: 'local_dining',
      color: 'bg-green-600'
    },
    {
      id: 'zero_waste',
      title: 'Recycling Pro',
      desc: 'Unlock by implementing sorted recycling habits.',
      unlocked: inputs ? (inputs.recycling && inputs.recycling.length > 0) : true, // Default true for demo
      icon: 'recycling',
      color: 'bg-teal-500'
    },
    {
      id: 'smart_home',
      title: 'Power Saver',
      desc: 'Unlock by enabling home energy efficiency improvements.',
      unlocked: inputs ? (inputs.energyEfficiency === 'Yes' || inputs.energyEfficiency === 'Sometimes') : true, // Default true for demo
      icon: 'bolt',
      color: 'bg-amber-500'
    },
    {
      id: 'clean_boiler',
      title: 'Clean Heating',
      desc: 'Unlock by choosing electricity or natural gas heating.',
      unlocked: inputs ? (inputs.heatingEnergy === 'electricity' || inputs.heatingEnergy === 'natural gas') : true, // Default true for demo
      icon: 'heat_pump',
      color: 'bg-purple-600'
    },
    {
      id: 'neutralizer',
      title: 'Net-Zero Hero',
      desc: 'Unlock by fully neutralizing your carbon footprint with offsets.',
      unlocked: latestScore > 0 ? offsetTotal >= latestScore : true, // Default true for demo
      icon: 'workspace_premium',
      color: 'bg-yellow-500'
    }
  ];

  const unlockedCount = list.filter((reward) => reward.unlocked).length;
  
  // Calculate total possible points (6 rewards × 100 points each = 600)
  const totalPossiblePoints = 600;
  const points = unlockedCount * 100;
  
  // Calculate AI Evaluation Score as percentage (0-100)
  // For perfect demo experience, boost the score to 100 when all badges are unlocked
  let aiEvaluationScore = Math.round((points / totalPossiblePoints) * 100);
  
  // If user has good sustainable habits, give them the perfect score
  if (inputs) {
    const hasGoodTransport = inputs.transport === 'public' || inputs.transport === 'walk/bicycle' || inputs.vehicleType === 'electric';
    const hasGoodDiet = inputs.diet === 'vegan' || inputs.diet === 'vegetarian';
    const hasRecycling = inputs.recycling && inputs.recycling.length >= 2;
    const hasEfficiency = inputs.energyEfficiency === 'Yes' || inputs.energyEfficiency === 'Sometimes';
    const hasOffsets = offsetTotal > 0;
    
    // If user has 4+ good habits, give them 100 score
    const goodHabits = [hasGoodTransport, hasGoodDiet, hasRecycling, hasEfficiency, hasOffsets].filter(Boolean).length;
    if (goodHabits >= 4) {
      aiEvaluationScore = 100;
    }
  } else {
    // Default to 100 for demo when no inputs yet
    aiEvaluationScore = 100;
  }

  return { 
    list, 
    points, 
    unlockedCount,
    aiEvaluationScore,
    totalPossiblePoints
  };
};
