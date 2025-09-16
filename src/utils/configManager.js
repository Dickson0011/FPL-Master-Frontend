// src/utils/configManager.js
import { 
  fetchPositions,
  fetchPositionLimits,
  fetchTeams,
  fetchGameRules,
  
} from '../api/fplApi';
import { STORAGE_KEYS, REFRESH_INTERVALS, FALLBACK_VALUES, TEAM_COLORS } from './constants';

class ConfigManager {
  constructor() {
    this.config = null;
    this.lastFetch = null;
    this.isLoading = false;
  }

  /**
   * Get cached configuration or fetch from API
   */
  async getConfig(forceRefresh = false) {
    // Return cached config if it's still valid
    if (!forceRefresh && this.config && this.isConfigValid()) {
      return this.config;
    }

    // Check localStorage cache
    if (!forceRefresh) {
      const cachedConfig = this.getCachedConfig();
      if (cachedConfig) {
        this.config = cachedConfig.data;
        this.lastFetch = new Date(cachedConfig.timestamp);
        return this.config;
      }
    }

    // Fetch fresh data
    return await this.fetchAndCacheConfig();
  }

  /**
   * Fetch configuration from API and cache it
   */
  async fetchAndCacheConfig() {
    if (this.isLoading) {
      // If already loading, wait for the current request
      await this.waitForLoad();
      return this.config;
    }

    this.isLoading = true;

    try {
      console.log('Fetching fresh FPL configuration...');
      const dynamicConfig = await fetchDynamicConfig();
      
      // Enhance teams with colors
      if (dynamicConfig.teams) {
        Object.keys(dynamicConfig.teams).forEach(teamId => {
          dynamicConfig.teams[teamId].color = TEAM_COLORS[teamId] || '#000000';
        });
      }

      this.config = dynamicConfig;
      this.lastFetch = new Date();
      
      // Cache in localStorage
      this.setCachedConfig({
        data: this.config,
        timestamp: this.lastFetch.toISOString(),
      });

      console.log('FPL configuration loaded successfully');
      return this.config;

    } catch (error) {
      // console.error('Failed to fetch FPL configuration:', error);
      
      // Try to use cached data even if expired
      const cachedConfig = this.getCachedConfig();
      if (cachedConfig) {
        console.warn('Using expired cached configuration');
        this.config = cachedConfig.data;
        this.lastFetch = new Date(cachedConfig.timestamp);
        return this.config;
      }

      // Fall back to default values
      console.warn('Using fallback configuration values');
      this.config = this.getFallbackConfig();
      return this.config;

    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get individual configuration sections
   */
  async getPositions(forceRefresh = false) {
    if (forceRefresh || !this.config?.positions) {
      try {
        const positions = await fetchPositions();
        if (this.config) {
          this.config.positions = positions;
        }
        return positions;
      } catch (error) {
        console.error('Failed to fetch positions:', error);
        return FALLBACK_VALUES.positions;
      }
    }
    return this.config.positions;
  }

  async getPositionLimits(forceRefresh = false) {
    if (forceRefresh || !this.config?.positionLimits) {
      try {
        const limits = await fetchPositionLimits();
        if (this.config) {
          this.config.positionLimits = limits;
        }
        return limits;
      } catch (error) {
        console.error('Failed to fetch position limits:', error);
        return FALLBACK_VALUES.positionLimits;
      }
    }
    return this.config.positionLimits;
  }

  async getTeams(forceRefresh = false) {
    if (forceRefresh || !this.config?.teams) {
      try {
        const teams = await fetchTeams();
        // Enhance with colors
        Object.keys(teams).forEach(teamId => {
          teams[teamId].color = TEAM_COLORS[teamId] || '#000000';
        });
        if (this.config) {
          this.config.teams = teams;
        }
        return teams;
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        return {};
      }
    }
    return this.config.teams;
  }

  async getGameRules(forceRefresh = false) {
    if (forceRefresh || !this.config?.gameRules) {
      try {
        const rules = await fetchGameRules();
        if (this.config) {
          this.config.gameRules = rules;
        }
        return rules;
      } catch (error) {
        console.error('Failed to fetch game rules:', error);
        return FALLBACK_VALUES.gameRules;
      }
    }
    return this.config.gameRules;
  }

  async getFixtureDifficulty(forceRefresh = false) {
    if (forceRefresh || !this.config?.fixtureDifficulty) {
      try {
        const difficulty = await fetchFixtureDifficulty();
        if (this.config) {
          this.config.fixtureDifficulty = difficulty;
        }
        return difficulty;
      } catch (error) {
        console.error('Failed to fetch fixture difficulty:', error);
        return FALLBACK_VALUES.fixtureDifficulty;
      }
    }
    return this.config.fixtureDifficulty;
  }

  /**
   * Check if current configuration is still valid
   */
  isConfigValid() {
    if (!this.lastFetch) return false;
    
    const now = new Date();
    const diffMinutes = (now - this.lastFetch) / (1000 * 60);
    
    return diffMinutes < REFRESH_INTERVALS.dynamicConfig;
  }

  /**
   * Get configuration from localStorage
   */
  getCachedConfig() {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.dynamicConfig);
      if (!cached) return null;

      const parsedCache = JSON.parse(cached);
      const cacheDate = new Date(parsedCache.timestamp);
      const now = new Date();
      const diffMinutes = (now - cacheDate) / (1000 * 60);

      // Return cached data if it's not too old
      if (diffMinutes < REFRESH_INTERVALS.dynamicConfig) {
        return parsedCache;
      }

      return null;
    } catch (error) {
      console.error('Failed to read cached config:', error);
      return null;
    }
  }

  /**
   * Save configuration to localStorage
   */
  setCachedConfig(configData) {
    try {
      localStorage.setItem(STORAGE_KEYS.dynamicConfig, JSON.stringify(configData));
    } catch (error) {
      console.error('Failed to cache config:', error);
    }
  }

  /**
   * Get fallback configuration when API is unavailable
   */
  getFallbackConfig() {
    return {
      positions: FALLBACK_VALUES.positions,
      positionLimits: FALLBACK_VALUES.positionLimits,
      teams: {},
      gameRules: FALLBACK_VALUES.gameRules,
      fixtureDifficulty: FALLBACK_VALUES.fixtureDifficulty,
      lastUpdated: new Date().toISOString(),
      isFallback: true,
    };
  }

  /**
   * Wait for current loading operation to complete
   */
  async waitForLoad() {
    return new Promise((resolve) => {
      const checkLoading = () => {
        if (!this.isLoading) {
          resolve();
        } else {
          setTimeout(checkLoading, 100);
        }
      };
      checkLoading();
    });
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.config = null;
    this.lastFetch = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.dynamicConfig);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Force refresh all configuration data
   */
  async refreshConfig() {
    this.clearCache();
    return await this.fetchAndCacheConfig();
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      isLoaded: !!this.config,
      lastFetch: this.lastFetch,
      isValid: this.isConfigValid(),
      isLoading: this.isLoading,
      isFallback: this.config?.isFallback || false,
    };
  }
}

// Create and export singleton instance
const configManager = new ConfigManager();

export default configManager;

// Export convenience functions
export const getPositions = () => configManager.getPositions();
export const getPositionLimits = () => configManager.getPositionLimits();
export const getTeams = () => configManager.getTeams();
export const getGameRules = () => configManager.getGameRules();
export const getFixtureDifficulty = () => configManager.getFixtureDifficulty();
export const getConfig = () => configManager.getConfig();
export const refreshConfig = () => configManager.refreshConfig();
export const getConfigStatus = () => configManager.getStatus();