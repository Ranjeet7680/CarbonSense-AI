export const calculateRewards = (inputs, latestScore, offsetTotal) => {
  const list = [
    {
      id: 'transit_champion',
      title: 'Transit Champion',
      desc: 'Unlock by walking/biking, driving an electric car, or taking public transit.',
      unlocked: inputs ? (inputs.transport === 'walk/bicycle' || inputs.vehicleType === 'electric' || inputs.transport === 'public') : false,
      icon: 'directions_run',
      color: 'bg-emerald-500'
    },
    {
      id: 'green_diet',
      title: 'Plant Power',
      desc: 'Unlock by adopting a vegan or vegetarian diet.',
      unlocked: inputs ? (inputs.diet === 'vegan' || inputs.diet === 'vegetarian') : false,
      icon: 'local_dining',
      color: 'bg-green-600'
    },
    {
      id: 'zero_waste',
      title: 'Recycling Pro',
      desc: 'Unlock by implementing sorted recycling habits.',
      unlocked: inputs ? (inputs.recycling && inputs.recycling.length > 0) : false,
      icon: 'recycling',
      color: 'bg-teal-500'
    },
    {
      id: 'smart_home',
      title: 'Power Saver',
      desc: 'Unlock by enabling home energy efficiency improvements.',
      unlocked: inputs ? (inputs.energyEfficiency === 'Yes' || inputs.energyEfficiency === 'Sometimes') : false,
      icon: 'bolt',
      color: 'bg-amber-500'
    },
    {
      id: 'clean_boiler',
      title: 'Clean Heating',
      desc: 'Unlock by choosing electricity or natural gas heating.',
      unlocked: inputs ? (inputs.heatingEnergy === 'electricity' || inputs.heatingEnergy === 'natural gas') : false,
      icon: 'heat_pump',
      color: 'bg-purple-600'
    },
    {
      id: 'neutralizer',
      title: 'Net-Zero Hero',
      desc: 'Unlock by fully neutralizing your carbon footprint with offsets.',
      unlocked: latestScore > 0 && offsetTotal >= latestScore,
      icon: 'workspace_premium',
      color: 'bg-yellow-500'
    }
  ];

  const unlockedCount = list.filter((reward) => reward.unlocked).length;
  const points = unlockedCount * 100;

  return { list, points, unlockedCount };
};
