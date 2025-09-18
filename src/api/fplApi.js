// src/api/fplApi.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with patient configuration
const fplApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes - longer than server timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// console.log("FPL API Base URL:", API_BASE_URL);

// Cache for bootstrap data
let bootstrapCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Add request interceptor for logging and progress tracking
fplApiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      // console.log(`FPL API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Add timestamp for request tracking
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    console.error('FPL API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor with better error handling
fplApiClient.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      // console.log(`FPL API Response: ${response.status} (${duration}ms)`);
    }
    return response;
  },
  (error) => {
    console.error('FPL API Response Error:', error);
    
    // Handle different types of errors with user-friendly messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('The FPL API is taking longer than usual to respond. This often happens during peak times. Please wait a moment and try again.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Too many requests - please wait a moment before trying again');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('The FPL API is temporarily unavailable. Please try again in a few minutes.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('The requested data could not be found');
    }
    
    // Network errors
    if (!error.response) {
      throw new Error('Unable to connect to the FPL API. Please check your internet connection.');
    }
    
    throw error;
  }
);

/**
 * Fetch bootstrap data with smart caching and loading callbacks
 */
export const fetchBootstrapData = async (options = {}) => {
  const { 
    forceRefresh = false, 
    onProgress = null,
    useStaleWhileRevalidate = true 
  } = options;

  try {
    // Return fresh cache if available and not forcing refresh
    if (!forceRefresh && bootstrapCache && cacheTimestamp && 
        (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      // console.log('Using cached bootstrap data');
      return bootstrapCache;
    }

    // If we have stale cache and using stale-while-revalidate pattern
    if (useStaleWhileRevalidate && bootstrapCache && !forceRefresh) {
      // Return stale data immediately, fetch fresh data in background
      setTimeout(() => {
        fetchBootstrapData({ forceRefresh: true, useStaleWhileRevalidate: false })
          .catch(err => console.log('Background refresh failed:', err.message));
      }, 100);
      
      // console.log('Using stale cache while revalidating');
      return bootstrapCache;
    }

    // Show progress updates
    if (onProgress) {
      onProgress('Connecting to FPL API...');
      
      // Set up progress timer
      const progressTimer = setInterval(() => {
        onProgress('FPL API is responding slowly, please wait...');
      }, 10000); // Update every 10 seconds
      
      // Clear timer when done
      setTimeout(() => clearInterval(progressTimer), 120000);
    }

    const response = await fplApiClient.get('/api/bootstrap');
    
    // Update cache
    bootstrapCache = response.data;
    cacheTimestamp = Date.now();
    
    if (onProgress) {
      onProgress('Data loaded successfully!');
    }
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch bootstrap data:', error);
    
    // If we have any cached data, return it as fallback
    if (bootstrapCache) {
      // console.log('Using fallback cache due to error');
      if (onProgress) {
        onProgress('Using cached data (FPL API temporarily slow)');
      }
      return {
        ...bootstrapCache,
        _cached: true,
        _error: error.message
      };
    }
    
    throw new Error(error.message || 'Unable to fetch FPL data. Please check your connection and try again.');
  }
};

/**
 * Get positions data with fallback
 */
export const fetchPositions = async (options = {}) => {
  try {
    const bootstrapData = await fetchBootstrapData(options);
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
 * Get position limits with fallback
 */
export const fetchPositionLimits = async (options = {}) => {
  try {
    const bootstrapData = await fetchBootstrapData(options);
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
 * Get teams data with fallback
 */
export const fetchTeams = async (options = {}) => {
  try {
    const bootstrapData = await fetchBootstrapData(options);
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
 * Get game rules with sensible fallbacks
 */
export const fetchGameRules = async (options = {}) => {
  try {
    const bootstrapData = await fetchBootstrapData(options);
    const settings = bootstrapData.game_settings;
    
    return {
      squadSize: settings.squad_squadsize,
      startingXI: settings.squad_squadplay,
      maxPlayersPerTeam: settings.squad_team_limit,
      budgetLimit: settings.squad_total_spend / 10,
      freeTransfers: settings.league_join_private_max,
      transferCost: settings.transfers_cost,
      currentGameweek: bootstrapData.events.find(e => e.is_current)?.id || null,
      captainMultiplier: 2,
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
 * Fetch current gameweek with fallback
 */
export const fetchCurrentGameweek = async (options = {}) => {
  try {
    const bootstrapData = await fetchBootstrapData(options);
    const currentEvent = bootstrapData.events.find(event => event.is_current);
    return currentEvent || bootstrapData.events.find(event => event.is_next);
  } catch (error) {
    console.error('Failed to fetch current gameweek:', error);
    throw new Error('Unable to fetch current gameweek information.');
  }
};

/**
 * Fetch player details with timeout handling
 */
export const fetchPlayerDetails = async (playerId) => {
  try {
    const response = await fplApiClient.get(`/api/element-summary/${playerId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch player details for ID ${playerId}:`, error);
    throw new Error('Unable to fetch player details. Please try again.');
  }
};

/**
 * Fetch fixtures with timeout handling
 */
export const fetchFixtures = async (gameweek = null) => {
  try {
    const response = await fplApiClient.get('/api/fixtures');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch fixtures:', error);
    throw new Error('Unable to fetch fixtures data. Please try again.');
  }
};

/**
 * Clear all caches
 */
export const clearCache = () => {
  bootstrapCache = null;
  cacheTimestamp = null;
};

/**
 * Check if we have cached data available
 */
export const hasCachedData = () => {
  return bootstrapCache !== null;
};

/**
 * Get cache age in seconds
 */
export const getCacheAge = () => {
  if (!cacheTimestamp) return null;
  return Math.floor((Date.now() - cacheTimestamp) / 1000);
};

// Export the configured axios instance
export { fplApiClient };