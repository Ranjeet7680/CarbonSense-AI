import React, { useState, useRef, useEffect } from 'react';
import coefficients from '../coefficients.json';

export default function AICoach({ currentLog }) {
  const latestScore = currentLog ? currentLog.score : 0;
  const inputs = currentLog ? currentLog.inputs : null;

  // Weekly emission estimation from monthly score
  const weeklyEmissions = latestScore > 0 ? (latestScore / 4.3).toFixed(1) : '42.5';
  const pctDiff = latestScore > 0 
    ? Math.round(((latestScore - coefficients.mean_emission) / coefficients.mean_emission) * 100)
    : -12;
  const pctLabel = pctDiff < 0 ? `${pctDiff}% CO₂` : `+${pctDiff}% CO₂`;

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I'm your CarbonSense AI Coach. Ready to make a positive impact today? I can help you track emissions, find eco-friendly alternatives, or set new sustainability goals.",
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      id: Math.random().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');

    // Generate AI response
    setTimeout(() => {
      const aiReply = generateResponse(text);
      setMessages(prev => [...prev, aiReply]);
    }, 1000);
  };

  const generateResponse = (inputText) => {
    const text = inputText.toLowerCase();
    let replyText = "";

    if (text.includes('recycle') || text.includes('waste')) {
      replyText = "Sorting waste is one of the easiest ways to optimize your footprint. Based on OLS weights, active paper recycling saves -148 kg/mo, metal recycling saves -129 kg/mo, glass saves -91 kg/mo, and plastic saves -64 kg/mo. Start small by setting up separate sorting bins!";
    } else if (text.includes('energy') || text.includes('electricity') || text.includes('power')) {
      if (inputs) {
        replyText = `I see your primary home heating energy is ${inputs.heatingEnergy}. Upgrading to energy efficiency measures can cut down heating and gas load. Switching from natural gas/coal to clean electric heat pumps saves up to 220-425 kg CO₂ monthly.`;
      } else {
        replyText = "Powering a home consumes substantial energy. To save, switch to LED bulbs (uses 75% less electricity), install smart thermostats to automate heating profiles, and check insulation seals around attic floorboards.";
      }
    } else if (text.includes('goal') || text.includes('quota') || text.includes('progress')) {
      if (latestScore > 0) {
        replyText = `Your current gross monthly carbon score is ${latestScore} kg. To support the global net-zero pathway, aim to get below 1,500 kg/mo gross. You can lower this by contributions to carbon offsets or transitioning to an EV.`;
      } else {
        replyText = "Setting a carbon goal starts with logging your tracker inputs. Once you complete the questionnaire, we will build a personalized roadmap to hit net-zero targets.";
      }
    } else if (text.includes('transport') || text.includes('car') || text.includes('bus') || text.includes('drive')) {
      if (inputs && inputs.transport === 'private') {
        const fuelCost = inputs.vehicleType === 'petrol' ? 829 : inputs.vehicleType === 'lpg' ? 346 : 224;
        const electricSavings = Math.round(fuelCost - (-1036));
        replyText = `You currently commute via private ${inputs.vehicleType} car. Switching to an EV would reduce your transport footprint by ${electricSavings} kg CO₂/mo! Or, taking public transit saves around ${Math.round(fuelCost + 116)} kg CO₂/mo.`;
      } else {
        replyText = "Opting for public transportation or cycling is a major win. Public transport contributes -83 kg CO₂/mo offset, whereas active travel (walking/biking) is carbon-neutral and keeps you active!";
      }
    } else {
      replyText = "That's an interesting point! I'm analyzing how that impacts your daily carbon quota. Would you like to check some suggestions for more sustainable habits?";
    }

    return {
      id: Math.random().toString(),
      sender: 'ai',
      text: replyText,
      timestamp: 'Just now'
    };
  };

  return (
    <div className="flex-grow flex flex-col justify-between overflow-hidden bg-background h-full">
      {/* Scrollable Chat History Container */}
      <div 
        id="chat-history" 
        className="flex-1 overflow-y-auto px-margin-mobile py-lg flex flex-col gap-lg chat-scroll"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-xs">
            {msg.sender === 'ai' ? (
              // AI Message Bubble
              <div className="flex flex-col items-start gap-xs">
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">AI COACH</span>
                </div>
                <div className="max-w-[85%] bg-secondary-container text-on-secondary-container p-md rounded-xl rounded-tl-none shadow-sm">
                  <p className="font-body-md text-body-md text-left leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ) : (
              // User Message Bubble
              <div className="flex flex-col items-end gap-xs">
                <div className="max-w-[85%] bg-surface-container-highest text-on-surface p-md rounded-xl rounded-tr-none shadow-sm">
                  <p className="font-body-md text-body-md text-left leading-relaxed">{msg.text}</p>
                </div>
                <span className="font-label-md text-[10px] text-on-surface-variant">{msg.timestamp}</span>
              </div>
            )}
          </div>
        ))}

        {/* Inline Weekly Progress Stat Card (Mockup specific placement in history stream) */}
        <div className="flex flex-col items-start gap-xs mt-sm">
          <div className="bg-surface-container-lowest border-t-2 border-primary p-md rounded-xl shadow-sm w-full md:w-80 border border-outline-variant/30">
            <div className="flex items-center justify-between mb-xs">
              <span className="font-label-md text-label-md text-primary uppercase font-bold tracking-wider">Weekly Progress</span>
              <span className={`font-bold ${pctDiff <= 0 ? 'text-primary' : 'text-error'}`}>{pctLabel}</span>
            </div>
            <div className="text-data-display font-data-display text-primary mb-xs flex items-baseline">
              {weeklyEmissions}
              <span className="text-headline-md font-headline-md ml-1">kg</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {pctDiff <= 0 
                ? "Your carbon footprint this week is significantly lower than average. Keep it up!" 
                : "Your footprint is running higher than average. Let's find ways to offset this."}
            </p>
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Input Section */}
      <div className="bg-surface p-md shadow-[0px_-4px_20px_rgba(45,90,39,0.08)] border-t border-outline-variant/30 flex-shrink-0">
        {/* Suggested Quick Replies */}
        <div className="flex gap-xs overflow-x-auto pb-md no-scrollbar">
          {[
            'How to recycle better?',
            'Energy saving tips',
            'My Carbon Goal'
          ].map(reply => (
            <button
              key={reply}
              onClick={() => handleSend(reply)}
              className="whitespace-nowrap px-md py-xs bg-surface-container-high hover:bg-secondary-container text-on-surface rounded-full font-label-md text-label-md transition-all active:scale-95 duration-100"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <form 
          className="flex items-center gap-sm bg-stone-100 bg-opacity-50 border border-outline-variant rounded-full px-md py-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface font-body-md placeholder:text-outline outline-none"
            placeholder="Ask your AI coach anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit"
            className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-full hover:shadow-lg transition-transform active:scale-90 flex-shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
