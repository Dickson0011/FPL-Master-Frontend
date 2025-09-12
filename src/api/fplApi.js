// src/api/fplApi.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// fetch(`${API_BASE_URL}/api/bootstrap`);
// Create axios instance with default configuration
const fplApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});
console.log("FPL API Base URL:", API_BASE_URL);
// Cache for bootstrap data to avoid repeated API calls
let bootstrapCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Add request interceptor for logging in development
fplApiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`FPL API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('FPL API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
fplApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('FPL API Response Error:', error);
    
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - FPL API is taking too long to respond');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded - please try again later');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('FPL API is currently unavailable - please try again later');
    }
    
    throw error;
  }
);

/**
 * Fetch general FPL bootstrap data (players, teams, game settings) with caching
 * This is the main endpoint that contains most static data
 */
export const fetchBootstrapData = async (forceRefresh = false) => {
  try {
    // Return cached data if it's still valid and not forcing refresh
    if (!forceRefresh && bootstrapCache && cacheTimestamp && 
        (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return bootstrapCache;
    }

    // FIXED: Use the configured axios client instead of raw axios
    const response = await fplApiClient.get('/api/bootstrap');
    
    // Update cache
    bootstrapCache = response.data;
    cacheTimestamp = Date.now();
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch bootstrap data:', error);
    throw new Error('Unable to fetch FPL data. Please check your connection and try again.');
  }
};

/**
 * Get dynamic positions data from API
 */
export const fetchPositions = async () => {
  try {
    const bootstrapData = await fetchBootstrapData();
    const positions = {};
    
    bootstrapData.element_types.forEach(elementType => {
      const shortName = elementType.singular_name_short;
      positions[shortName] = {
        id: elementType.id,
        name: elementType.plural_name,
        short: elementType.singular_name_short,
        squad_select: elementType.squad_select,
        squad_min_play: elementType.squad_min_play,
        squad_max_play: elementType.squad_max_play,
      };
    });
    
    return positions;
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    throw new Error('Unable to fetch positions data.');
  }
};

/**
 * Get dynamic position limits from API
 */
export const fetchPositionLimits = async () => {
  try {
    const bootstrapData = await fetchBootstrapData();
    const limits = {};
    
    bootstrapData.element_types.forEach(elementType => {
      const shortName = elementType.singular_name_short;
      limits[shortName] = {
        min: elementType.squad_select,
        max: elementType.squad_select,
        minPlay: elementType.squad_min_play,
        maxPlay: elementType.squad_max_play,
      };
    });
    
    return limits;
  } catch (error) {
    console.error('Failed to fetch position limits:', error);
    throw new Error('Unable to fetch position limits.');
  }
};

/**
 * Get dynamic teams data from API
 */
export const fetchTeams = async () => {
  try {
    const bootstrapData = await fetchBootstrapData();
    const teams = {};
    
    bootstrapData.teams.forEach(team => {
      teams[team.id] = {
        name: team.name,
        short: team.short_name,
        code: team.code,
        strength: team.strength,
        played: team.played,
        win: team.win,
        draw: team.draw,
        loss: team.loss,
        points: team.points,
        position: team.position,
        form: team.form,
        strength_overall_home: team.strength_overall_home,
        strength_overall_away: team.strength_overall_away,
        strength_attack_home: team.strength_attack_home,
        strength_attack_away: team.strength_attack_away,
        strength_defence_home: team.strength_defence_home,
        strength_defence_away: team.strength_defence_away,
      };
    });
    
    return teams;
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    throw new Error('Unable to fetch teams data.');
  }
};

/**
 * Get game rules and settings from API
 */
export const fetchGameRules = async () => {
  try {
    const bootstrapData = await fetchBootstrapData();
    const settings = bootstrapData.game_settings;
    
    return {
      squadSize: settings.squad_squadsize,
      startingXI: settings.squad_squadplay,
      maxPlayersPerTeam: settings.squad_team_limit,
      budgetLimit: settings.squad_total_spend / 10, // Convert from 0.1m units
      freeTransfers: settings.league_join_private_max,
      transferCost: settings.transfers_cost,
      currentGameweek: bootstrapData.events.find(e => e.is_current)?.id || null,
      captainMultiplier: 2, // This seems to be hardcoded in FPL
      viceCaptainMultiplier: 2,
      timezone: settings.timezone,
      deadlines: settings.ui_currency_multiplier,
    };
  } catch (error) {
    console.error('Failed to fetch game rules:', error);
    // Return sensible defaults if API fails
    return {
      squadSize: 15,
      startingXI: 11,
      maxPlayersPerTeam: 3,
      budgetLimit: 100.0,
      freeTransfers: 1,
      transferCost: 4,
      captainMultiplier: 2,
      viceCaptainMultiplier: 2,
    };
  }
};

/**
 * Fetch current gameweek information
 */
export const fetchCurrentGameweek = async () => {
  try {
    const bootstrapData = await fetchBootstrapData();
    const currentEvent = bootstrapData.events.find(event => event.is_current);
    return currentEvent || bootstrapData.events.find(event => event.is_next);
  } catch (error) {
    console.error('Failed to fetch current gameweek:', error);
    throw new Error('Unable to fetch current gameweek information.');
  }
};

/**
 * Fetch player details by player ID
 */
export const fetchPlayerDetails = async (playerId) => {
  try {
    const response = await fplApiClient.get(`/api/element-summary/${playerId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch player details for ID ${playerId}:`, error);
    throw new Error('Unable to fetch player details.');
  }
};

/**
 * Fetch fixtures data
 */
export const fetchFixtures = async (gameweek = null) => {
  try {
    const response = await fplApiClient.get('/api/fixtures');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch fixtures:', error);
    throw new Error('Unable to fetch fixtures data.');
  }
};

/**
 * Clear bootstrap cache (useful for forcing refresh)
 */
export const clearCache = () => {
  bootstrapCache = null;
  cacheTimestamp = null;
};

// Export the configured axios instance for direct use if needed
export { fplApiClient };