# CarbonSense AI

CarbonSense AI is an intelligent sustainability and ESG platform for measuring, analyzing, and reducing carbon footprints. It combines a React/Vite app, Firebase-backed user data, OLS-based carbon scoring, gamified rewards, dataset analytics, and an AI sustainability coach.

Vision: Measure today. Reduce tomorrow. Sustain forever.

## Repository

GitHub: [Ranjeet7680/CarbonSense-AI](https://github.com/Ranjeet7680/CarbonSense-AI.git)

## Features

- Carbon footprint calculator with quick estimate and precise analysis modes
- OLS regression scoring using local coefficient data
- Dashboard for gross footprint, offsets, net footprint, climate rating, and category charts
- AI Sustainability Coach with profile-aware suggestions
- Multi-profile sandbox system with simulated users and custom profiles
- Rewards, badges, XP levels, and leaderboard comparisons
- Dataset analytics with emission distributions and lifestyle factor comparisons
- Learning hub for climate and sustainability education
- Offset tracking for reforestation, solar, wind, and clean energy projects
- Firebase Auth and Firestore support for authenticated logs and leaderboard data

## Tech Stack

- React 19
- Vite 8
- Firebase Auth and Firestore
- Chart.js and react-chartjs-2
- Material Symbols icons
- Vitest
- ESLint

## Project Structure

```text
CarbonSense AI Tracker/
├── Carbon Emission.csv/
│   ├── Carbon Emission.csv
│   └── model_coefficients.json
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── AICoach.jsx
│   │   ├── Auth.jsx
│   │   ├── Calculator.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DatasetAnalysis.jsx
│   │   ├── History.jsx
│   │   ├── LeaderboardRewards.jsx
│   │   ├── LearningHub.jsx
│   │   └── Offsets.jsx
│   ├── utils/
│   │   ├── avatar.jsx
│   │   ├── avatar.test.jsx
│   │   └── rewards.js
│   ├── coefficients.json
│   ├── dataset_summary.json
│   ├── firebase.js
│   ├── main.jsx
│   └── App.jsx
├── eslint.config.js
├── package.json
├── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open the local Vite URL shown in your terminal, usually:

```text
http://localhost:5173
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Firebase Setup

Create a `.env` file in the project root if you want to connect your own Firebase project:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Firestore collections used by the app:

```text
/users/{uid}/logs/{logId}
  timestamp: number
  score: number
  inputs: object

/users/{uid}/offsets/{offsetId}
  timestamp: number
  type: string
  amountKg: number
  provider: string
  cost: number

/leaderboard/{uid}
  userId: string
  name: string
  score: number
  timestamp: number
```

## Carbon Scoring Model

The footprint estimate is based on local OLS coefficient data in [src/coefficients.json](src/coefficients.json).

```text
Footprint = Intercept + sum(input_value * coefficient)
```

Key drivers include transportation, vehicle type, travel distance, diet, heating source, energy efficiency, waste generation, recycling, clothing purchases, groceries, internet usage, and screen time.

## Sustainability Levels

| Level | Title |
| :--- | :--- |
| Level 1 | Green Starter |
| Level 2 | Eco Learner |
| Level 3 | Sustainability Advocate |
| Level 4 | Eco Warrior |
| Level 5 | Climate Champion |
| Level 6 | Net-Zero Hero |

## Quality Checks

Current verification commands:

```bash
npm run lint
npm test
npm run build
```

The app includes focused tests for avatar generation, evolution levels, reward calculation, and SVG sanitization.

## Deployment

Any static hosting service that supports Vite builds can serve the app:

```bash
npm run build
```

Deploy the generated `dist/` directory.

## Developer

Ranjeet Kumar

AI, machine learning, sustainability, and climate technology.

GitHub: [Ranjeet7680](https://github.com/Ranjeet7680)

## License

MIT License
