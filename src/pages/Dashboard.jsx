// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Star, 
  Target, 
  Users, 
  DollarSign,
  Calendar,
  Trophy,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  Sparkles,
  Flame,
  Award,
  Activity
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useFplConfig } from '../hooks/useFplConfig';
import { fetchBootstrapData, fetchCurrentGameweek } from '../api/fplApi';
import PlayerCard from '../components/PlayerCard';
import TeamStats from '../components/TeamStats';

const Dashboard = () => {
  const { user, getFavoriteTeam, getRiskTolerance } = useUser();
  const { 
    positions, 
    teams, 
    gameRules, 
    loading: configLoading, 
    error: configError,
    refreshConfig 
  } = useFplConfig();

  // State management
  const [fplData, setFplData] = useState(null);
  const [currentGameweek, setCurrentGameweek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');

  // Load FPL data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [bootstrapData, gameweekData] = await Promise.all([
          fetchBootstrapData({
            useStaleWhileRevalidate: true,
            onprogress: (msg) => console.log('Bootstrap progress:', msg)
          }),
          fetchCurrentGameweek()
        ]);

        setFplData(bootstrapData);
        setCurrentGameweek(gameweekData);
      } catch (err) {
        setError(err.message);
        console.error('Dashboard data loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Get user's favorite team data
  const favoriteTeamData = useMemo(() => {
    const favoriteTeamId = getFavoriteTeam();
    if (!favoriteTeamId || !teams) return null;
    return teams[favoriteTeamId];
  }, [getFavoriteTeam, teams]);

  // Calculate insights based on user preferences and data
  const insights = useMemo(() => {
    if (!fplData?.elements || !positions || !fplData?.teams) return null;

    // Process players data with team names - THIS FIXES THE "Unknown" ISSUE
    const playersWithTeams = fplData.elements.map((player) => ({
      ...player,
      team_name: fplData.teams.find((t) => t.id === player.team)?.name || "Unknown",
      position_name: fplData.element_types?.find((p) => p.id === player.element_type)?.singular_name_short || "Unknown",
      now_cost_millions: player.now_cost / 10,
      value_season: parseFloat(player.total_points) / (player.now_cost / 10) || 0,
    }));

    const players = playersWithTeams;
    const riskTolerance = getRiskTolerance();

    // Top performers by form
    const topForm = players
      .filter(p => parseFloat(p.form) > 0)
      .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
      .slice(0, 5);

    // Differential picks (low ownership, good form)
    const differentials = players
      .filter(p => parseFloat(p.selected_by_percent) < 10 && parseFloat(p.form) > 4)
      .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
      .slice(0, 5);

    // Value picks (good points per cost)
    const valuePicks = players
      .filter(p => p.total_points > 20 && p.now_cost > 40) // Minimum threshold
      .map(p => ({
        ...p,
        value: p.total_points / (p.now_cost / 10)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Captain candidates
    const captainCandidates = players
      .filter(p => parseFloat(p.form) > 4 && parseFloat(p.selected_by_percent) > 5)
      .sort((a, b) => parseFloat(b.form) * parseFloat(b.points_per_game) - parseFloat(a.form) * parseFloat(a.points_per_game))
      .slice(0, 5);

    // Template team (most selected players)
    const templateTeam = players
      .filter(p => parseFloat(p.selected_by_percent) > 20)
      .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
      .slice(0, 8);

    return {
      topForm,
      differentials,
      valuePicks,
      captainCandidates,
      templateTeam,
      totalPlayers: players.length,
      averagePrice: (players.reduce((sum, p) => sum + p.now_cost, 0) / players.length / 10).toFixed(1),
      mostExpensive: players.reduce((max, p) => p.now_cost > max.now_cost ? p : max, players[0])
    };
  }, [fplData, positions, getRiskTolerance]);

  // Filter players for search
  const filteredPlayers = useMemo(() => {
    if (!fplData?.elements || !fplData?.teams) return [];
    
    // Process players with team names for search as well
    const playersWithTeams = fplData.elements.map((player) => ({
      ...player,
      team_name: fplData.teams.find((t) => t.id === player.team)?.name || "Unknown",
    }));
    
    let filtered = playersWithTeams;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player =>
        player.web_name.toLowerCase().includes(query) ||
        player.first_name.toLowerCase().includes(query) ||
        player.second_name.toLowerCase().includes(query)
      );
    }
    
    // Apply position filter
    if (selectedPosition !== 'all') {
      filtered = filtered.filter(player => 
        String(player.element_type) === String(selectedPosition)
      );
    }
    
    return filtered.slice(0, 20); // Limit results
  }, [fplData, searchQuery, selectedPosition]);

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshConfig(),
        loadDashboardData()
      ]);
    } catch (err) {
      setError('Failed to refresh data');
    }
  };

  const loadDashboardData = async () => {
    const [bootstrapData, gameweekData] = await Promise.all([
      fetchBootstrapData(true), // Force refresh
      fetchCurrentGameweek()
    ]);
    setFplData(bootstrapData);
    setCurrentGameweek(gameweekData);
    setLoading(false);
  };

  // Insight sections configuration
  const insightSections = [
    { id: 'overview', label: 'Overview', icon: BarChart3, color: 'bg-blue-500' },
    { id: 'differentials', label: 'Differentials', icon: Star, color: 'bg-purple-500' },
    { id: 'captains', label: 'Captains', icon: Target, color: 'bg-red-500' },
    { id: 'value', label: 'Value Picks', icon: DollarSign, color: 'bg-green-500' },
    { id: 'template', label: 'Template Team', icon: Users, color: 'bg-indigo-500' },
    { id: 'search', label: 'Player Search', icon: Search, color: 'bg-gray-500' },
  ];

  if (loading || configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading Your Dashboard</h3>
              <p className="text-gray-600 max-w-md mx-auto">Fetching the latest FPL insights and analyzing player data for your personalized experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || configError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-6 flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Dashboard Error</h3>
                  <p className="text-gray-600 mt-2">{error || configError}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  className="ml-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Welcome back, {user?.displayName || 'Manager'}!
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Your personalized FPL insights and recommendations
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="self-start lg:self-auto bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-md border border-gray-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Gameweek Hero Section */}
        {currentGameweek && (
          <div className="mb-12">
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-3xl p-8">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between text-white">
                  <div className="mb-6 lg:mb-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-black bg-opacity-20 rounded-xl flex items-center justify-center">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <h2 className="text-3xl font-bold">Gameweek {currentGameweek.id}</h2>
                    </div>
                    <p className="text-xl opacity-90">{currentGameweek.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{insights.totalPlayers}</p>
                  <p className="text-gray-600 font-medium">Total Players</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">£{insights.averagePrice}m</p>
                  <p className="text-gray-600 font-medium">Average Price</p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{insights.differentials.length}</p>
                  <p className="text-gray-600 font-medium">Differentials Found</p>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Star className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    £{(insights.mostExpensive.now_cost / 10).toFixed(1)}m
                  </p>
                  <p className="text-gray-600 font-medium">Most Expensive</p>
                </div>
                <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center">
                  <Trophy className="h-7 w-7 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Favorite Team Section */}
        {favoriteTeamData && (
          <div className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Team Analysis</h2>
            </div>
            <TeamStats team={favoriteTeamData} className="mb-6" />
          </div>
        )}

        {/* Insights Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-100">
            <div className="flex flex-wrap gap-2">
              {insightSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedInsight(section.id)}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      selectedInsight === section.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Insights Content */}
        <div className="space-y-8">
          {selectedInsight === 'overview' && insights && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Flame className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Top Form Players</h3>
                </div>
                <div className="space-y-4">
                  {insights.topForm.slice(0, 5).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{player.web_name}</div>
                          <div className="text-gray-600">{player.team_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{player.form}</div>
                        <div className="text-sm text-gray-500">Form</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Captain Candidates</h3>
                </div>
                <div className="space-y-4">
                  {insights.captainCandidates.slice(0, 5).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{player.web_name}</div>
                          <div className="text-gray-600">{player.team_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{parseFloat(player.points_per_game).toFixed(1)}</div>
                        <div className="text-sm text-gray-500">PPG</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedInsight === 'differentials' && insights?.differentials && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Differential Picks</h3>
                    <p className="text-gray-600">Low ownership, high form players to give you an edge</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {insights.differentials.map(player => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    showInsights={true}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedInsight === 'captains' && insights?.captainCandidates && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Captain Candidates</h3>
                    <p className="text-gray-600">Top players to consider for your captaincy pick</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {insights.captainCandidates.map(player => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    showInsights={true}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedInsight === 'value' && insights?.valuePicks && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Value Picks</h3>
                    <p className="text-gray-600">Best points per million spent - maximize your budget</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {insights.valuePicks.map(player => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    showInsights={true}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedInsight === 'template' && insights?.templateTeam && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Template Team</h3>
                    <p className="text-gray-600">Most popular players that managers are picking</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {insights.templateTeam.map(player => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    showInsights={false}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedInsight === 'search' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Search className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Player Search</h3>
                    <p className="text-gray-600">Find and analyze any player in the Premier League</p>
                  </div>
                </div>
              </div>
              
              {/* Search Controls */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search players by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                    />
                  </div>
                  <div className="lg:w-64">
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                    >
                      <option value="all">All Positions</option>
                      {positions && Object.entries(positions).map(([key, position]) => (
                        <option key={position.id} value={position.id}>
                          {position.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPlayers.map(player => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    showInsights={true}
                  />
                ))}
              </div>
              
              {searchQuery && filteredPlayers.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No players found</h3>
                  <p className="text-gray-600 max-w-md mx-auto">Try adjusting your search terms or filters to find the players you're looking for</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Tips Section */}
        <div className="mt-16">
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
                <div className="flex-shrink-0 mb-6 lg:mb-0">
                  <div className="w-16 h-16 bg-black bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-white">
                  <h3 className="text-2xl font-bold mb-3">💡 AI Tip of the Day</h3>
                  <p className="text-lg opacity-90 leading-relaxed">
                    {getRiskTolerance() === 'high' 
                      ? "Consider differential captains from your current insights - they could provide big rank gains! Look for players with good form but low ownership percentage."
                      : "Focus on consistent performers with good fixtures for steady points accumulation. Template players might be safer but still effective choices."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;