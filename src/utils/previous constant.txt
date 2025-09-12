// src/utils/constants.js

// Application Information
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'FPL AI Insights',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.VITE_ENVIRONMENT,
};

// API Configuration
export const API_CONFIG = {
  fplBaseUrl: import.meta.env.VITE_FPL_API_BASE_URL,
  requestTimeout: 10000,
  maxRetries: 3,
};

// REMOVED: POSITIONS - Now fetched dynamically from API via fetchPositions()
// REMOVED: POSITION_LIMITS - Now fetched dynamically from API via fetchPositionLimits()
// REMOVED: FPL_RULES - Now fetched dynamically from API via fetchGameRules()
// REMOVED: SCORING - This should be derived from element_types in bootstrap data if needed
// REMOVED: PL_TEAMS - Now fetched dynamically from API via fetchTeams()
// REMOVED: FIXTURE_DIFFICULTY - Now fetched dynamically (though UI colors may need to remain static)

// Team colors mapping (since FPL API doesn't provide colors)
// This is the only team-related data we might need to keep hardcoded
export const TEAM_COLORS = {
  1: '#EF0107',   // Arsenal
  2: '#95BFE5',   // Aston Villa
  3: '#DA020E',   // Bournemouth
  4: '#E30613',   // Brentford
  5: '#0057B8',   // Brighton
  6: '#034694',   // Chelsea
  7: '#1B458F',   // Crystal Palace
  8: '#003399',   // Everton
  9: '#CC0000',   // Fulham
  10: '#C8102E',  // Liverpool
  11: '#6CABDD',  // Manchester City
  12: '#DA020E',  // Manchester Utd
  13: '#241F20',  // Newcastle
  14: '#DD0000',  // Nott'm Forest
  15: '#EE2737',  // Sheffield Utd (if still in PL)
  16: '#132257',  // Tottenham
  17: '#7A263A',  // West Ham
  18: '#FDB462',  // Wolves
  // Add more as teams change in PL
};

// Performance Thresholds (these are analytical constants, not API data)
export const PERFORMANCE_THRESHOLDS = {
  form: {
    excellent: 7.0,
    good: 5.5,
    average: 4.0,
    poor: 2.5,
  },
  pointsPerGame: {
    excellent: 6.0,
    good: 4.5,
    average: 3.0,
    poor: 2.0,
  },
  ownership: {
    differential: 5.0,    // Less than 5% ownership
    template: 50.0,       // More than 50% ownership
  },
  value: {
    excellent: 0.5,       // More than 0.5 points per £0.1m
    good: 0.35,
    average: 0.25,
    poor: 0.15,
  },
};

// Risk Tolerance Levels (analytical constants)
export const RISK_TOLERANCE = {
  conservative: {
    label: 'Conservative',
    description: 'Focus on safe, consistent picks',
    maxDifferentials: 2,
    minOwnership: 10.0,
  },
  medium: {
    label: 'Balanced',
    description: 'Mix of safe picks and differentials',
    maxDifferentials: 4,
    minOwnership: 5.0,
  },
  aggressive: {
    label: 'Aggressive', 
    description: 'High-risk, high-reward strategy',
    maxDifferentials: 6,
    minOwnership: 1.0,
  },
};

// UI Constants
export const UI_CONFIG = {
  animationDuration: 300,
  debounceDelay: 500,
  pagination: {
    defaultPageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
};

// Navigation Routes
export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  login: '/login',
  register: '/register',
  players: '/players',
  teams: '/teams',
  fixtures: '/fixtures',
  insights: '/insights',
  profile: '/profile',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  userPreferences: 'fpl_user_preferences',
  cachedData: 'fpl_cached_data',
  lastDataFetch: 'fpl_last_fetch',
  theme: 'fpl_theme_preference',
  dynamicConfig: 'fpl_dynamic_config', // For caching API-fetched config
};

// Data Refresh Intervals (in minutes)
export const REFRESH_INTERVALS = {
  playerData: 60,        // 1 hour
  fixtureData: 120,      // 2 hours
  liveData: 5,           // 5 minutes during gameweek
  userPreferences: 1440, // 24 hours
  dynamicConfig: 180,    // 3 hours for positions, teams, etc.
};

// AI Insight Categories
export const INSIGHT_CATEGORIES = {
  captaincy: {
    label: 'Captaincy Suggestions',
    description: 'AI-powered captain picks based on form, fixtures, and historical data',
    icon: 'Crown',
  },
  differentials: {
    label: 'Differential Picks',
    description: 'Low-ownership players with high potential returns',
    icon: 'TrendingUp',
  },
  transfers: {
    label: 'Transfer Recommendations',
    description: 'Smart transfer suggestions to maximize your team value',
    icon: 'ArrowLeftRight',
  },
  budget: {
    label: 'Budget Analysis',
    description: 'Optimize your squad value and identify bargain picks',
    icon: 'PiggyBank',
  },
  fixtures: {
    label: 'Fixture Analysis',
    description: 'Upcoming fixture difficulty and rotation planning',
    icon: 'Calendar',
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  fplApi: 'Unable to fetch FPL data. The service may be temporarily unavailable.',
  authentication: 'Authentication failed. Please log in and try again.',
  generic: 'Something went wrong. Please try again later.',
  validation: 'Please check your input and try again.',
  configLoad: 'Unable to load game configuration. Using default values.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  login: 'Successfully logged in!',
  register: 'Account created successfully!',
  logout: 'Successfully logged out.',
  profileUpdate: 'Profile updated successfully!',
  dataRefresh: 'Data refreshed successfully!',
  configLoaded: 'Game configuration loaded successfully!',
};

// Default/Fallback values (used when API is unavailable)
export const FALLBACK_VALUES = {
  positions: {
    GKP: { id: 1, name: 'Goalkeeper', short: 'GKP' },
    DEF: { id: 2, name: 'Defender', short: 'DEF' },
    MID: { id: 3, name: 'Midfielder', short: 'MID' },
    FWD: { id: 4, name: 'Forward', short: 'FWD' },
  },
  positionLimits: {
    GKP: { min: 2, max: 2 },
    DEF: { min: 5, max: 5 },
    MID: { min: 5, max: 5 },
    FWD: { min: 3, max: 3 },
  },
  gameRules: {
    squadSize: 15,
    startingXI: 11,
    maxPlayersPerTeam: 3,
    budgetLimit: 100.0,
    freeTransfers: 1,
    transferCost: 4,
    captainMultiplier: 2,
    viceCaptainMultiplier: 2,
  },
  fixtureDifficulty: {
    1: { label: 'Very Easy', color: 'bg-green-500', textColor: 'text-green-700' },
    2: { label: 'Easy', color: 'bg-green-400', textColor: 'text-green-600' },
    3: { label: 'Average', color: 'bg-yellow-400', textColor: 'text-yellow-700' },
    4: { label: 'Hard', color: 'bg-orange-400', textColor: 'text-orange-700' },
    5: { label: 'Very Hard', color: 'bg-red-500', textColor: 'text-red-700' },
  },
};