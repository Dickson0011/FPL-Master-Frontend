// src/pages/Insights.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  Eye,
  Calendar,
  Users,
  Target,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Filter,
  Clock
} from 'lucide-react';
import { fetchBootstrapData, fetchCurrentGameweek } from '../api/fplApi';
import { useUser } from '../contexts/UserContext';

const Insights = () => {
  const { getRiskTolerance, getFavoriteTeam } = useUser();
  const [data, setData] = useState(null);
  const [currentGW, setCurrentGW] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState('market');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fplData, gwData] = await Promise.all([
          fetchBootstrapData(),
          fetchCurrentGameweek()
        ]);
        
        setData(fplData);
        setCurrentGW(gwData);
      } catch (err) {
        setError('Failed to load insights data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Advanced analytics calculations
  const analytics = useMemo(() => {
    if (!data?.elements || !data?.teams) return null;

    const players = data.elements.map(p => ({
      ...p,
      team_name: data.teams.find(t => t.id === p.team)?.name || 'Unknown',
      position_name: data.element_types?.find(pos => pos.id === p.element_type)?.singular_name_short || 'Unknown',
      now_cost_millions: p.now_cost / 10,
      form_trend: parseFloat(p.form) - parseFloat(p.points_per_game),
      ownership_tier: parseFloat(p.selected_by_percent) > 50 ? 'template' : 
                     parseFloat(p.selected_by_percent) > 20 ? 'popular' :
                     parseFloat(p.selected_by_percent) > 5 ? 'moderate' : 'differential',
      value_efficiency: p.total_points / (p.now_cost / 10 || 1),
      momentum: parseFloat(p.form) * (p.transfers_in_event - p.transfers_out_event),
      injury_risk: p.chance_of_playing_next_round < 100 ? 'high' : p.news ? 'medium' : 'low'
    }));

    // Market Movement Analysis
    const transferTrends = {
      hottest: players
        .filter(p => p.transfers_in_event > 0)
        .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
        .slice(0, 5),
      coldest: players
        .filter(p => p.transfers_out_event > 0)
        .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
        .slice(0, 5),
      risingStars: players
        .filter(p => p.form_trend > 1 && parseFloat(p.selected_by_percent) < 15)
        .sort((a, b) => b.form_trend - a.form_trend)
        .slice(0, 5)
    };

    // Form vs Ownership Matrix
    const formOwnershipMatrix = {
      hiddenGems: players.filter(p => parseFloat(p.form) > 5 && parseFloat(p.selected_by_percent) < 5),
      bandwagons: players.filter(p => parseFloat(p.form) < 3 && parseFloat(p.selected_by_percent) > 30),
      consensusPicks: players.filter(p => parseFloat(p.form) > 5 && parseFloat(p.selected_by_percent) > 30),
      avoidList: players.filter(p => parseFloat(p.form) < 2 && parseFloat(p.selected_by_percent) < 5)
    };

    // Price vs Performance Clusters
    const pricePerformanceClusters = {
      premiumPerformers: players.filter(p => p.now_cost_millions > 10 && p.total_points > 80),
      midRangeValue: players.filter(p => p.now_cost_millions > 6 && p.now_cost_millions <= 10 && p.value_efficiency > 10),
      budgetGems: players.filter(p => p.now_cost_millions <= 6 && p.total_points > 40),
      overpriced: players.filter(p => p.now_cost_millions > 8 && p.value_efficiency < 8)
    };

    // Risk Assessment
    const riskAnalysis = {
      highRisk: players.filter(p => p.injury_risk === 'high' || p.form_trend < -2),
      moderateRisk: players.filter(p => p.injury_risk === 'medium' || Math.abs(p.form_trend) <= 2),
      lowRisk: players.filter(p => p.injury_risk === 'low' && p.form_trend >= 0 && p.total_points > 50)
    };

    // Position-specific insights
    const positionInsights = data.element_types?.map(position => {
      const positionPlayers = players.filter(p => p.element_type === position.id);
      const avgPrice = positionPlayers.reduce((sum, p) => sum + p.now_cost_millions, 0) / positionPlayers.length;
      const topPerformer = positionPlayers.reduce((max, p) => p.total_points > max.total_points ? p : max, positionPlayers[0]);
      
      return {
        ...position,
        avgPrice: avgPrice.toFixed(1),
        totalPlayers: positionPlayers.length,
        topPerformer,
        priceRange: {
          min: Math.min(...positionPlayers.map(p => p.now_cost_millions)),
          max: Math.max(...positionPlayers.map(p => p.now_cost_millions))
        }
      };
    }) || [];

    return {
      transferTrends,
      formOwnershipMatrix,
      pricePerformanceClusters,
      riskAnalysis,
      positionInsights,
      totalPlayers: players.length,
      marketCap: players.reduce((sum, p) => sum + p.now_cost_millions, 0).toFixed(0)
    };
  }, [data]);

  // AI Recommendations based on user preferences
  const aiRecommendations = useMemo(() => {
    if (!analytics || !data) return null;

    const riskProfile = getRiskTolerance();
    const favoriteTeamId = getFavoriteTeam();
    
    const recommendations = [];

    // Risk-based recommendations
    if (riskProfile === 'high') {
      recommendations.push({
        type: 'opportunity',
        title: 'High-Risk, High-Reward Plays',
        description: 'These differential picks could provide massive rank gains',
        players: analytics.formOwnershipMatrix.hiddenGems.slice(0, 3),
        confidence: 'medium'
      });
    } else if (riskProfile === 'low') {
      recommendations.push({
        type: 'safe',
        title: 'Conservative Consensus Plays',
        description: 'Reliable picks that most successful managers own',
        players: analytics.formOwnershipMatrix.consensusPicks.slice(0, 3),
        confidence: 'high'
      });
    }

    // Market timing recommendations
    if (analytics.transferTrends.risingStars.length > 0) {
      recommendations.push({
        type: 'timing',
        title: 'Beat the Market',
        description: 'Get ahead of the crowd with these trending players',
        players: analytics.transferTrends.risingStars.slice(0, 2),
        confidence: 'medium'
      });
    }

    // Avoid recommendations
    if (analytics.formOwnershipMatrix.bandwagons.length > 0) {
      recommendations.push({
        type: 'avoid',
        title: 'Potential Traps',
        description: 'High ownership players with declining form - consider alternatives',
        players: analytics.formOwnershipMatrix.bandwagons.slice(0, 2),
        confidence: 'high'
      });
    }

    return recommendations;
  }, [analytics, getRiskTolerance, getFavoriteTeam]);

  const insightTabs = [
    { id: 'market', label: 'Market Analysis', icon: TrendingUp, color: 'bg-blue-500' },
    { id: 'matrix', label: 'Form vs Ownership', icon: BarChart3, color: 'bg-purple-500' },
    // { id: 'value', label: 'Value Analysis', icon: PieChart, color: 'bg-green-500' },
    // { id: 'risk', label: 'Risk Assessment', icon: Shield, color: 'bg-yellow-500' },
    { id: 'positions', label: 'Position Intel', icon: Users, color: 'bg-indigo-500' },
    { id: 'ai', label: 'AI Recommendations', icon: Brain, color: 'bg-pink-500' }
  ];

  const StatCard = ({ title, value, trend, icon: Icon, color = 'text-blue-600' }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-opacity-10 flex items-center justify-center ${color.replace('text-', 'bg-')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center">
          {trend > 0 ? (
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
          ) : trend < 0 ? (
            <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
          ) : (
            <Minus className="h-4 w-4 text-gray-400 mr-1" />
          )}
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {Math.abs(trend)}% vs last GW
          </span>
        </div>
      )}
    </div>
  );

  const PlayerInsightCard = ({ player, insight, showOwnership = true }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{player.web_name}</h4>
          <p className="text-sm text-gray-600">{player.team_name} • {player.position_name}</p>
          <p className="text-xs text-gray-500 mt-1">£{player.now_cost_millions}m</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{player.total_points}</div>
          <div className="text-xs text-gray-500">pts</div>
          {showOwnership && (
            <div className="text-xs text-gray-600 mt-1">{player.selected_by_percent}% owned</div>
          )}
        </div>
      </div>
      {insight && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-700">{insight}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Analyzing Market Data</h3>
              <p className="text-gray-600">Processing advanced analytics and AI insights...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-4" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Unable to Load Insights</h3>
                  <p className="text-gray-600 mt-2">{error}</p>
                </div>
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
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">AI Insights</h1>
              <p className="text-gray-600 text-lg">Advanced analytics and market intelligence</p>
            </div>
          </div>
          
          {currentGW && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Current Analysis: Gameweek {currentGW.id}</span>
                </div>
                <div className="text-sm opacity-90">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Market Overview Stats */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Total Market Cap"
              value={`£${analytics.marketCap}M`}
              icon={PieChart}
              color="text-black-600"
            />
            <StatCard
              title="Active Players"
              value={analytics.totalPlayers}
              icon={Users}
              color="text-green-600"
            />
            <StatCard
              title="Hot Transfers"
              value={analytics.transferTrends.hottest.length}
              trend={5}
              icon={TrendingUp}
              color="text-black-600"
            />
            <StatCard
              title="Risk Alerts"
              value={analytics.riskAnalysis.highRisk.length}
              icon={AlertTriangle}
              color="text-yellow-600"
            />
          </div>
        )}

        {/* Insight Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-100">
            <div className="flex flex-wrap gap-2">
              {insightTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedInsight(tab.id)}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      selectedInsight === tab.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Insight Content */}
        {analytics && (
          <div className="space-y-8">
            {selectedInsight === 'market' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                      <h3 className="text-2xl font-bold text-gray-900">Hottest Transfers In</h3>
                    </div>
                    <div className="space-y-4">
                      {analytics.transferTrends.hottest.map((player, index) => (
                        <PlayerInsightCard
                          key={player.id}
                          player={player}
                          insight={`+${player.transfers_in_event.toLocaleString()} transfers this GW`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                      <h3 className="text-2xl font-bold text-gray-900">Biggest Sell-Offs</h3>
                    </div>
                    <div className="space-y-4">
                      {analytics.transferTrends.coldest.map((player, index) => (
                        <PlayerInsightCard
                          key={player.id}
                          player={player}
                          insight={`-${player.transfers_out_event.toLocaleString()} transfers this GW`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <Star className="h-6 w-6 text-purple-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Rising Stars</h3>
                    <span className="text-sm text-gray-500">Players trending upward before the crowd notices</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.transferTrends.risingStars.map((player) => (
                      <PlayerInsightCard
                        key={player.id}
                        player={player}
                        insight={`Form trending up: ${player.form_trend.toFixed(1)} improvement`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedInsight === 'matrix' && (
              <div className="space-y-8">
                <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <Eye className="h-6 w-6 text-purple-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Form vs Ownership Matrix</h3>
                    <span className="text-sm text-gray-500">Discover hidden gems and avoid traps</span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Hidden Gems (High Form, Low Ownership)
                      </h4>
                      <div className="space-y-3">
                        {analytics.formOwnershipMatrix.hiddenGems.slice(0, 5).map((player) => (
                          <PlayerInsightCard
                            key={player.id}
                            player={player}
                            insight={`Form: ${player.form} | Only ${player.selected_by_percent}% owned`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Potential Traps (Poor Form, High Ownership)
                      </h4>
                      <div className="space-y-3">
                        {analytics.formOwnershipMatrix.bandwagons.slice(0, 5).map((player) => (
                          <PlayerInsightCard
                            key={player.id}
                            player={player}
                            insight={`Form: ${player.form} | ${player.selected_by_percent}% owned - Consider alternatives`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* {selectedInsight === 'value' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                    <h4 className="text-lg font-semibold text-blue-700 mb-4">Premium Performers</h4>
                    <div className="space-y-3">
                      {analytics.pricePerformanceClusters.premiumPerformers.slice(0, 3).map((player) => (
                        <PlayerInsightCard
                          key={player.id}
                          player={player}
                          showOwnership={false}
                          insight={`Value: ${player.value_efficiency.toFixed(1)} pts/£M`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                    <h4 className="text-lg font-semibold text-green-700 mb-4">Mid-Range Value</h4>
                    <div className="space-y-3">
                      {analytics.pricePerformanceClusters.midRangeValue.slice(0, 3).map((player) => (
                        <PlayerInsightCard
                          key={player.id}
                          player={player}
                          showOwnership={false}
                          insight={`Value: ${player.value_efficiency.toFixed(1)} pts/£M`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                    <h4 className="text-lg font-semibold text-purple-700 mb-4">Budget Gems</h4>
                    <div className="space-y-3">
                      {analytics.pricePerformanceClusters.budgetGems.slice(0, 3).map((player) => (
                        <PlayerInsightCard
                          key={player.id}
                          player={player}
                          showOwnership={false}
                          insight={`Value: ${player.value_efficiency.toFixed(1)} pts/£M`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )} */}

            {/* {selectedInsight === 'risk' && (
              <div className="space-y-8">
                <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <Shield className="h-6 w-6 text-yellow-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Risk Assessment</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="p-6 bg-red-50 rounded-xl border border-red-100">
                      <h4 className="text-lg font-semibold text-red-700 mb-4">High Risk</h4>
                      <p className="text-sm text-red-600 mb-4">Injury concerns or poor form trend</p>
                      <div className="space-y-3">
                        {analytics.riskAnalysis.highRisk.slice(0, 3).map((player) => (
                          <div key={player.id} className="text-sm">
                            <div className="font-medium">{player.web_name}</div>
                            <div className="text-red-600">{player.team_name} • {player.position_name}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-100">
                      <h4 className="text-lg font-semibold text-yellow-700 mb-4">Moderate Risk</h4>
                      <p className="text-sm text-yellow-600 mb-4">Monitor closely for changes</p>
                      <div className="text-center py-8 text-yellow-600">
                        {analytics.riskAnalysis.moderateRisk.length} players to monitor
                      </div>
                    </div>

                    <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                      <h4 className="text-lg font-semibold text-green-700 mb-4">Low Risk</h4>
                      <p className="text-sm text-green-600 mb-4">Reliable options for your team</p>
                      <div className="text-center py-8 text-green-600">
                        {analytics.riskAnalysis.lowRisk.length} safe options available
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )} */}

            {selectedInsight === 'positions' && (
              <div className="space-y-8">
                <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <Users className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Position Intelligence</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {analytics.positionInsights.map((position) => (
                      <div key={position.id} className="p-6 border border-gray-200 rounded-xl">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">{position.plural_name}</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-gray-600">Average Price</div>
                            <div className="text-xl font-bold text-gray-900">£{position.avgPrice}m</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Price Range</div>
                            <div className="text-sm font-medium">£{position.priceRange.min}m - £{position.priceRange.max}m</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Top Performer</div>
                            <div className="text-sm font-medium">{position.topPerformer?.web_name}</div>
                            <div className="text-xs text-gray-500">{position.topPerformer?.total_points} pts</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedInsight === 'ai' && aiRecommendations && (
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-black bg-opacity-20 rounded-2xl flex items-center justify-center">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">AI-Powered Recommendations</h3>
                      <p className="text-lg opacity-90">
                        Personalized insights based on your risk profile: {getRiskTolerance().toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {aiRecommendations.map((rec, index) => {
                    const getRecommendationStyle = (type) => {
                      switch (type) {
                        case 'opportunity':
                          return {
                            bg: 'bg-green-50 border-green-200',
                            icon: 'text-green-600',
                            iconBg: 'bg-green-100',
                            IconComponent: Zap
                          };
                        case 'safe':
                          return {
                            bg: 'bg-blue-50 border-blue-200',
                            icon: 'text-blue-600',
                            iconBg: 'bg-blue-100',
                            IconComponent: Shield
                          };
                        case 'timing':
                          return {
                            bg: 'bg-purple-50 border-purple-200',
                            icon: 'text-purple-600',
                            iconBg: 'bg-purple-100',
                            IconComponent: Clock
                          };
                        case 'avoid':
                          return {
                            bg: 'bg-red-50 border-red-200',
                            icon: 'text-red-600',
                            iconBg: 'bg-red-100',
                            IconComponent: AlertTriangle
                          };
                        default:
                          return {
                            bg: 'bg-gray-50 border-gray-200',
                            icon: 'text-gray-600',
                            iconBg: 'bg-gray-100',
                            IconComponent: Lightbulb
                          };
                      }
                    };

                    const style = getRecommendationStyle(rec.type);
                    const IconComponent = style.IconComponent;

                    return (
                      <div key={index} className={`rounded-2xl p-8 border-2 ${style.bg}`}>
                        <div className="flex items-start space-x-4 mb-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                            <IconComponent className={`h-6 w-6 ${style.icon}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-xl font-bold text-gray-900">{rec.title}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                rec.confidence === 'high' ? 'bg-green-200 text-green-800' :
                                rec.confidence === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {rec.confidence} confidence
                              </span>
                            </div>
                            <p className="text-gray-700">{rec.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {rec.players.map((player) => (
                            <div key={player.id} className="bg-white rounded-xl p-4 border border-gray-100">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h5 className="font-semibold text-gray-900">{player.web_name}</h5>
                                  <p className="text-sm text-gray-600">{player.team_name} • {player.position_name}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">£{player.now_cost_millions}m</div>
                                  <div className="text-xs text-gray-500">{player.total_points} pts</div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Form:</span>
                                  <span className="font-medium">{player.form}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Ownership:</span>
                                  <span className="font-medium">{player.selected_by_percent}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Value:</span>
                                  <span className="font-medium">{player.value_efficiency?.toFixed(1) || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Summary */}
                <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <Lightbulb className="h-6 w-6 text-yellow-600" />
                    <h3 className="text-2xl font-bold text-gray-900">AI Summary</h3>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
                    <p className="text-gray-800 leading-relaxed">
                      Based on current market conditions and your {getRiskTolerance()} risk tolerance, 
                      the optimal strategy this gameweek is to {
                        getRiskTolerance() === 'high' 
                          ? 'focus on differential picks with upside potential. Look for players with improving form but low ownership - these could provide significant rank gains if they perform well.'
                          : getRiskTolerance() === 'medium'
                          ? 'balance popular picks with selective differentials. Target players with good fixtures and consistent form while avoiding high-risk options.'
                          : 'prioritize template players and avoid unnecessary risks. Focus on established performers with good upcoming fixtures and stable returns.'
                      }
                      {analytics.transferTrends.risingStars.length > 0 && 
                        ` Pay special attention to the ${analytics.transferTrends.risingStars.length} rising stars identified - these players are showing positive momentum before mainstream adoption.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Market Intelligence Footer */}
        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Activity className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold">Market Intelligence Active</h3>
                <p className="opacity-90">Real-time analysis of {analytics?.totalPlayers || 0} players</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-black bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
