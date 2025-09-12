// src/hooks/useFplConfig.js
import { useState, useEffect, useCallback } from 'react';
import configManager from '../utils/configManager';

/**
 * React hook for managing FPL configuration data
 * Provides easy access to positions, teams, game rules, etc.
 */
export const useFplConfig = (autoLoad = true) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(configManager.getStatus());

  // Load configuration
  const loadConfig = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const configData = await configManager.getConfig(forceRefresh);
      setConfig(configData);
      setStatus(configManager.getStatus());
    } catch (err) {
      setError(err.message);
      console.error('Failed to load FPL config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh configuration
  const refreshConfig = useCallback(async () => {
    return await loadConfig(true);
  }, [loadConfig]);

  // Get specific configuration sections
  const getPositions = useCallback(async (forceRefresh = false) => {
    try {
      return await configManager.getPositions(forceRefresh);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getTeams = useCallback(async (forceRefresh = false) => {
    try {
      return await configManager.getTeams(forceRefresh);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getGameRules = useCallback(async (forceRefresh = false) => {
    try {
      return await configManager.getGameRules(forceRefresh);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getPositionLimits = useCallback(async (forceRefresh = false) => {
    try {
      return await configManager.getPositionLimits(forceRefresh);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getFixtureDifficulty = useCallback(async (forceRefresh = false) => {
    try {
      return await configManager.getFixtureDifficulty(forceRefresh);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadConfig();
    }
  }, [autoLoad, loadConfig]);

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(configManager.getStatus());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    // Data
    config,
    positions: config?.positions,
    teams: config?.teams,
    gameRules: config?.gameRules,
    positionLimits: config?.positionLimits,
    fixtureDifficulty: config?.fixtureDifficulty,
    
    // State
    loading,
    error,
    status,
    
    // Actions
    loadConfig,
    refreshConfig,
    getPositions,
    getTeams,
    getGameRules,
    getPositionLimits,
    getFixtureDifficulty,
    
    // Utilities
    clearError: () => setError(null),
    isLoaded: !!config,
    isValid: status.isValid,
    isFallback: status.isFallback,
  };
};