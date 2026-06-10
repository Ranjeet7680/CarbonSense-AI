# CarbonSense AI - Sustainability Tracker & ESG Predictor

CarbonSense AI is an enterprise-grade personal sustainability portal that utilizes ordinary least squares (OLS) regression models trained on a dataset of 10,000 lifestyle observations to calculate, track, and optimize personal carbon footprint metrics. 

Designed with a premium Material 3 light-green aesthetic, the application features reactive widgets, automated scans, sandbox user simulations, interactive dataset analytics, and gamified level-badge progression.

---

## 📖 Table of Contents
1. [Core Features](#-core-features)
2. [OLS Model Coefficients](#%EF%B8%8F-ols-model-coefficients)
3. [Gamified Badges Matrix](#-gamified-badges-matrix)
4. [Sandbox User Profiles](#-sandbox-user-profiles)
5. [Codebase Architecture](#%EF%B8%8F-codebase-architecture)
6. [Technology Stack](#%EF%B8%8F-technology-stack)
7. [Installation & Local Setup](#-installation--local-setup)
8. [Firebase Schema Setup](#-firebase-schema-setup)

---

## 🌟 Core Features

### 1. Dual Calculator Modes
- **Quick Estimate**: A simplified 4-step mobile questionnaire covering transport, energy utility bills, food, and waste, matching unasked attributes with statistical baselines.
- **Precise Analysis**: Exposes all 16 variables of the underlying OLS model (including body parameters, clothing purchases, shower intervals, and cooking metrics) for granular tracking.
- **Live Score Badge**: Floating mobile-first emission scoring with circular dot-stepper progress.
- **Utility Bill Scanner**: Simulated optical scan that auto-scans monthly electricity kWh inputs.

### 2. Active Sandbox Profile Switcher
- Shift the active session state between:
  1. **You (Guest / Authenticated)** - Your own logs and offsets.
  2. **Krish (EV, Solar)** - Low emission profile (820 kg/mo) pre-filled with private EV travel and solar electricity.
  3. **Rahul (Transit, Vegetarian)** - Moderate emission profile (1,120 kg/mo) pre-filled with public transit and vegetarian diet.
- The switcher dynamically re-binds calculator values, AI Coach responses, offset targets, and dashboard widgets to the simulated user.

### 3. Gamified Rewards & Leaderboard
- **XP & Level Progression**: Earn 100 XP per badge, unlocking Level tiers (Level 1 to 6).
- **Interactive Leaderboard**: Real-time rank board. Clicking any user card opens a comparison modal highlighting their exact carbon traits, unlocked badges, and score compared to yours.

### 4. Interactive Dataset Analytics
- Full visual breakdown of the `Carbon Emission.csv` dataset (10,000 rows):
  - **Emissions Distribution**: A detailed histogram showing the frequency of users falling into different emission classes.
  - **Categorical Breakdown Tabs**: Dynamic comparisons for transport modes, diet choices, vehicle fuel, heating energy, and air travel.
  - **Pearson Correlation Table**: Displays correlation coefficients showing the direct mathematical impact of numerical lifestyle variables on total emissions.

### 5. Profile Customization
- Direct editing capability for the current user's profile:
  - Customize display name.
  - Choose from 6 environmental emoji avatar badges (`🌳`, `⚡`, `🚲`, `🥗`, `♻️`, `💧`).
  - Configure monthly carbon budget targets.

### 6. AI Sustainability Coach
- Interactive chatbot with personalized system prompts that adjust greetings and suggestions based on the active profile's habits. Offers quick-reply suggestions for recycling, goals, and transport.

### 7. Community Spotlight & Demo Showcase
- Integrated interactive LinkedIn live post embed showcasing demo video updates, community statistics, and social feedback right from the public landing page.

---

## 🧮 OLS Model Coefficients

The footprint score is calculated using standard linear regression weights:
$$\text{Footprint} = \text{Intercept} + \sum (\text{Value}_j \times \text{Weight}_j)$$

The unscaled intercept is **`1065.4816` kg CO₂/month**.

### Numerical Variables
| Variable | Weight | Description |
| :--- | :---: | :--- |
| **Vehicle Monthly Distance Km** | `+0.2055` | Emissions per kilometer driven |
| **Waste Bag Weekly Count** | `+82.7752` | Emissions per weekly garbage bag |
| **How Many New Clothes Monthly** | `+13.5993` | Production impact per item of clothing |
| **How Long Internet Daily Hour** | `+6.9502` | Server cooling impact per daily hour |
| **How Long TV PC Daily Hour** | `+2.8482` | Device power consumption per hour |
| **Monthly Grocery Bill** | `+0.9508` | Food transport impact per dollar spent |

### Categorical Factors (Selected Weights)
| Feature | Class / Choice | Weight (kg CO₂/mo) |
| :--- | :--- | :---: |
| **Vehicle Type** | Petrol <br> Diesel <br> LPG <br> Hybrid <br> Electric | `+829.4442` <br> `+224.9030` <br> `+346.1227` <br> `-228.2883` <br> `-1036.4802` |
| **Heating Energy** | Coal <br> Wood <br> Natural Gas <br> Electricity | `+205.4955` <br> `+10.3947` <br> `+6.5178` <br> `-220.4673` |
| **Diet** | Omnivore <br> Pescatarian <br> Vegetarian <br> Vegan | `+96.2494` <br> `+7.3534` <br> `-38.6445` <br> `-65.3566` |
| **Transport** | private <br> public <br> walk/bicycle | `+32.4831` <br> `-83.6144` <br> `+50.2155` |
| **Air Travel Frequency** | Very Frequently <br> Frequently <br> Rarely <br> Never | `+761.3340` <br> `+110.9019` <br> `-358.2474` <br> `-530.8092` |
| **Energy Efficiency** | No <br> Sometimes <br> Yes | `+27.4295` <br> `+0.1167` <br> `-27.1416` |

---

## 🏆 Gamified Badges Matrix

| Badge | Title | Unlock Requirement | Icon | Color |
| :---: | :--- | :--- | :---: | :---: |
| 🏃‍♂️ | **Transit Champion** | Commute via public transit, walking/biking, or an electric car. | `directions_run` | Emerald |
| 🥗 | **Plant Power** | Select Vegetarian or Vegan diet profiles. | `local_dining` | Green |
| ♻️ | **Recycling Pro** | Sort recycling for paper, plastic, glass, or metals. | `recycling` | Teal |
| ⚡ | **Power Saver** | Enable home energy efficiency measures. | `bolt` | Amber |
| 🔥 | **Clean Heating** | Upgrade heating energy sources to electricity or natural gas. | `heat_pump` | Purple |
| 👑 | **Net-Zero Hero** | Neutralize 100% of gross carbon footprint emissions with offsets. | `workspace_premium` | Yellow |

---

## 👥 Sandbox User Profiles

The switcher overrides standard database calls with reactively updated in-memory values:

```javascript
// Pre-configured profile states in App.jsx
const krishProfile = {
  name: "Krish (EV, Solar)",
  score: 820,
  inputs: {
    transport: "private",
    vehicleType: "electric",
    vehicleDistance: 500,
    heatingEnergy: "electricity", // Solar heating
    diet: "vegan",
    energyEfficiency: "Yes",
    recycling: ["Paper", "Plastic", "Glass", "Metal"]
  }
};

const rahulProfile = {
  name: "Rahul (Transit, Veg)",
  score: 1120,
  inputs: {
    transport: "public",
    vehicleType: "None",
    vehicleDistance: 0,
    heatingEnergy: "natural gas",
    diet: "vegetarian",
    energyEfficiency: "Sometimes",
    recycling: ["Paper", "Plastic"]
  }
};
```

---

## 📂 Codebase Architecture

```text
├── Carbon Emission.csv/        # Raw datasets & pre-calculated script
│   ├── Carbon Emission.csv
│   └── model_coefficients.json
├── public/
│   └── Carbon_Emission.csv     # Serves CSV downloads
├── src/
│   ├── assets/                 # App assets & images
│   ├── components/             # React components
│   │   ├── AICoach.jsx         # AI chat assistant with weekly stat bubbles
│   │   ├── Auth.jsx            # Sign-In/Register & guest controllers
│   │   ├── Calculator.jsx      # Stepper form using OLS linear formulas
│   │   ├── Dashboard.jsx       # Carbon ring gauges, category share donuts
│   │   ├── DatasetAnalysis.jsx # Visual analytics on Carbon Emission.csv
│   │   ├── History.jsx         # Carbon logs ledger with delete functions
│   │   ├── LeaderboardRewards.jsx # Badges grid & compare profiles modal
│   │   ├── LearningHub.jsx     # Curated educational articles library
│   │   └── Offsets.jsx         # Offset funding portal
│   ├── calculate_stats.py      # Python dataset aggregation script
│   ├── coefficients.json       # OLS linear regression weights
│   ├── dataset_summary.json    # Pre-calculated statistical summary
│   ├── firebase.js             # Initialized Google Firebase config
│   ├── main.jsx                # Vite mount root
│   └── App.jsx                 # Routing wrapper, sandbox profile switcher
├── index.html                  # Global HTML entry with Light-Green configuration
├── tailwind.config.js          # Material 3 Light-Green color configurations
└── vite.config.js              # Vite compiler config
```

---

## 🛠️ Technology Stack
- **Framework**: React 18, Vite
- **Styling**: Tailwind CSS
- **Icons**: Google Material Symbols Outlined
- **Charts**: Chart.js, react-chartjs-2
- **Database & Authentication**: Firebase Firestore & Firebase Auth (supporting standard register/login and Google Auth)

---

## 🚀 Installation & Local Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- NPM (v9.0.0 or higher)
- Python 3 (Optional: for running dataset recalculations)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Ranjeet7680/CarbonSense-AI.git
cd "CarbonSense AI Tracker"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Configure `src/firebase.js` to read credentials:
```javascript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to inspect the portal!

### Step 5: Production Build & Deployment
```bash
npm run build
```

---

## 📊 Firebase Schema Setup

For authenticated users, the application expects the following firestore collections:

```text
/users
  /{uid}
    /logs
      /{logId}
        timestamp: number
        score: number
        inputs: { ... }  # Raw OLS questionnaire inputs
    /offsets
      /{offsetId}
        timestamp: number
        type: string
        amountKg: number
        provider: string
        cost: number
/leaderboard
  /{uid}
    userId: string
    name: string
    score: number        # Latest monthly carbon footprint
    timestamp: number
```