// src/pages/Fixtures.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, TrendingUp, Filter, RefreshCw, AlertCircle } from 'lucide-react';


const FIXTURE_DIFFICULTY = {
  1: { label: 'Very Easy', gradient: 'from-emerald-400 to-green-600', bgGradient: 'from-green-100 to-emerald-50' },
  2: { label: 'Easy', gradient: 'from-green-400 to-emerald-600', bgGradient: 'from-green-100 to-emerald-50' },
  3: { label: 'Medium', gradient: 'from-yellow-300 to-amber-500', bgGradient: 'from-yellow-100 to-amber-50' },
  4: { label: 'Hard', gradient: 'from-orange-400 to-red-500', bgGradient: 'from-orange-100 to-red-50' },
  5: { label: 'Very Hard', gradient: 'from-red-400 to-rose-600', bgGradient: 'from-red-100 to-rose-50' },
};

const Fixtures = () => {
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState({});
  const [gameweeks, setGameweeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGameweek, setSelectedGameweek] = useState('2');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [filterFinished, setFilterFinished] = useState(false);
  const [currentGameweek, setCurrentGameweek] = useState(mockGameweeks[1]);

  const loadFixturesData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => setLoading(false), 1000);
  };

  // Filter fixtures based on selected criteria
  const filteredFixtures = fixtures.filter(fixture => {
    if (selectedGameweek !== 'all' && fixture.event !== parseInt(selectedGameweek)) {
      return false;
    }
    if (selectedTeam !== 'all') {
      const teamId = parseInt(selectedTeam);
      if (fixture.team_h !== teamId && fixture.team_a !== teamId) {
        return false;
      }
    }
    if (filterFinished && !fixture.finished) {
      return false;
    }
    return true;
  });

  // Group fixtures by gameweek
  const fixturesByGameweek = filteredFixtures.reduce((acc, fixture) => {
    const gw = fixture.event;
    if (!acc[gw]) {
      acc[gw] = [];
    }
    acc[gw].push(fixture);
    return acc;
  }, {});

  // Format date and time
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return { date: 'TBD', time: 'TBD' };
    
    const date = new Date(dateTimeStr);
    const dateStr = date.toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { date: dateStr, time: timeStr };
  };

  // Get fixture difficulty rating
  const getFixtureDifficulty = (homeTeam, awayTeam, isHomeTeam) => {
    const opponent = isHomeTeam ? awayTeam : homeTeam;
    const opponentStrength = teams[opponent]?.strength || 3;
    
    if (opponentStrength >= 5) return 5;
    if (opponentStrength >= 4) return 4;
    if (opponentStrength >= 3) return 3;
    if (opponentStrength >= 2) return 2;
    return 1;
  };

  // Check if it's a big match (both teams strength >= 4)
  const isBigMatch = (homeTeamId, awayTeamId) => {
    const homeStrength = teams[homeTeamId]?.strength || 0;
    const awayStrength = teams[awayTeamId]?.strength || 0;
    return homeStrength >= 4 && awayStrength >= 4;
  };

  const FixtureCard = ({ fixture }) => {
    const homeTeam = teams[fixture.team_h];
    const awayTeam = teams[fixture.team_a];
    const { date, time } = formatDateTime(fixture.kickoff_time);
    
    if (!homeTeam || !awayTeam) return null;

    const homeDifficulty = getFixtureDifficulty(fixture.team_h, fixture.team_a, true);
    const awayDifficulty = getFixtureDifficulty(fixture.team_h, fixture.team_a, false);
    const bigMatch = isBigMatch(fixture.team_h, fixture.team_a);

    return (
      <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100/50 p-4 sm:p-5 hover:shadow-lg hover:shadow-indigo-100/30 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
        {/* Big Match Indicator */}
        {bigMatch && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg animate-pulse">
            Big Match
          </div>
        )}

        {/* Match Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="flex items-center space-x-1.5 bg-gray-100/70 px-2.5 py-1 rounded-full">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">{date}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-gray-100/70 px-2.5 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{time}</span>
            </div>
          </div>
          {fixture.finished && (
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm">
              Finished
            </div>
          )}
        </div>

        {/* Teams Container */}
        <div className="flex items-center justify-between space-x-4">
          {/* Home Team */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex items-center space-x-2.5">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white/20"
                style={{ backgroundColor: homeTeam.color || '#37003c' }}
              >
                {homeTeam.short_name?.substring(0, 3) || homeTeam.name?.substring(0, 3)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {homeTeam.short_name}
                </div>
                <div className="text-xs text-gray-500 hidden sm:block">Home</div>
              </div>
            </div>
            
            {/* Difficulty Badge */}
            <div className={`relative overflow-hidden px-2.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-inner`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${FIXTURE_DIFFICULTY[homeDifficulty]?.gradient}`}></div>
              <div className="relative z-10 flex items-center space-x-1">
                <span>{homeDifficulty}</span>
              </div>
            </div>
          </div>

          {/* Gradient Divider */}
          <div className="flex-shrink-0 px-3 sm:px-4">
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* Score or VS */}
          <div className="flex-shrink-0 text-center px-2">
            {fixture.finished ? (
              <div className="text-xl sm:text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {fixture.team_h_score} - {fixture.team_a_score}
              </div>
            ) : (
              <div className="text-gray-400 font-bold text-sm bg-gray-100/70 px-3 py-1 rounded-full">VS</div>
            )}
          </div>

          {/* Gradient Divider */}
          <div className="flex-shrink-0 px-3 sm:px-4">
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* Away Team */}
          <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
            {/* Difficulty Badge */}
            <div className={`relative overflow-hidden px-2.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-inner`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${FIXTURE_DIFFICULTY[awayDifficulty]?.gradient}`}></div>
              <div className="relative z-10 flex items-center space-x-1">
                <span>{awayDifficulty}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2.5">
              <div className="min-w-0 text-right">
                <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {awayTeam.short_name}
                </div>
                <div className="text-xs text-gray-500 hidden sm:block">Away</div>
              </div>
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white/20"
                style={{ backgroundColor: awayTeam.color || '#37003c' }}
              >
                {awayTeam.short_name?.substring(0, 3) || awayTeam.name?.substring(0, 3)}
              </div>
            </div>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    );
  };
  
  const GameweekSection = ({ gameweekId, fixtures }) => {
    const gameweek = gameweeks.find(gw => gw.id === gameweekId);
    const isCurrentGW = currentGameweek?.id === gameweekId;

    return (
      <div className="mb-10">
        {/* Sticky Gameweek Header with Glass Effect */}
        <div className="sticky top-16 z-10 mb-6">
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/80 shadow-lg border border-white/20">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-indigo-50 to-white"></div>
            
            {/* Gradient Border Accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 to-blue-600 rounded-l-2xl"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent">
                  {gameweek ? gameweek.name : `Gameweek ${gameweekId}`}
                </h3>
                {isCurrentGW && (
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                    Current
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 bg-white/50 px-3 py-1.5 rounded-full">
                {gameweek && formatDateTime(gameweek.deadline_time).date}
              </div>
            </div>
          </div>
        </div>

        {/* Fixtures Grid */}
        <div className="grid gap-4 sm:gap-5 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {fixtures
            .sort((a, b) => new Date(a.kickoff_time || 0) - new Date(b.kickoff_time || 0))
            .map(fixture => (
              <FixtureCard key={fixture.id} fixture={fixture} />
            ))}
        </div>
      </div>
    );
  };

  const LoadingSpinner = ({ size = "medium", message = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 ${
        size === 'large' ? 'h-12 w-12' : 'h-8 w-8'
      }`}></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );

  const ErrorMessage = ({ error, onRetry }) => (
    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 text-center border border-red-100">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h3>
      <p className="text-red-700 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-full hover:from-red-700 hover:to-rose-700 transition-all duration-200 font-medium"
      >
        Try Again
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Loading fixtures..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
        <ErrorMessage 
          error={error}
          onRetry={loadFixturesData}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-3">
            Premier League Fixtures
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Discover upcoming matches with difficulty ratings and live results
          </p>
        </div>

        {/* Glassmorphic Filters */}
        <div className="sticky top-0 z-20 mb-8">
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-r from-white/90 via-indigo-50/80 to-white/90 shadow-xl border border-white/20">
            <div className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent">
                  Smart Filters
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Gameweek Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Gameweek
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGameweek}
                      onChange={(e) => setSelectedGameweek(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-200 font-medium text-gray-900 shadow-sm hover:shadow-md hover:bg-white/80"
                    >
                      <option value="all">All Gameweeks</option>
                      {gameweeks.map(gw => (
                        <option key={gw.id} value={gw.id.toString()}>
                          {gw.name} {gw.is_current ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                {/* Team Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Team
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-200 font-medium text-gray-900 shadow-sm hover:shadow-md hover:bg-white/80"
                    >
                      <option value="all">All Teams</option>
                      {Object.values(teams)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(team => (
                          <option key={team.id || team.name} value={team.id || team.name}>
                            {team.name}
                          </option>
                        ))}
                    </select>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-end">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filterFinished}
                        onChange={(e) => setFilterFinished(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                        filterFinished 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-600' 
                          : 'border-gray-300 bg-white/50 group-hover:border-indigo-400'
                      }`}>
                        {filterFinished && (
                          <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors duration-200">
                      Show only finished matches
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 pt-4 border-t border-white/30 space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-600 bg-white/50 px-3 py-1.5 rounded-full font-medium">
                  Showing {filteredFixtures.length} fixtures
                </div>
                <button
                  onClick={loadFixturesData}
                  disabled={loading}
                  className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 hover:scale-105"
                >
                  <div className="flex items-center space-x-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
                    <span>Refresh</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Legend */}
        <div className="mb-8 bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-white" />
            </div>
            <span>Difficulty Rating Guide</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {Object.entries(FIXTURE_DIFFICULTY).map(([rating, config]) => (
              <div key={rating} className="flex items-center space-x-2.5 bg-white/60 p-3 rounded-xl hover:bg-white/80 transition-all duration-200">
                <div className={`relative overflow-hidden w-8 h-8 rounded-lg shadow-inner`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient}`}></div>
                  <div className="relative z-10 w-full h-full flex items-center justify-center text-white text-sm font-bold">
                    {rating}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">{config.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 bg-gray-100/50 p-2 rounded-lg">
            💡 Difficulty is calculated based on opponent team strength. Lower numbers indicate easier fixtures.
          </p>
        </div>

        {/* Fixtures List */}
        {filteredFixtures.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 text-center border border-gray-100">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No fixtures found</h3>
            <p className="text-gray-600">
              Try adjusting your filters to discover more exciting matches.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(fixturesByGameweek)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(gameweekId => (
                <GameweekSection
                  key={gameweekId}
                  gameweekId={parseInt(gameweekId)}
                  fixtures={fixturesByGameweek[gameweekId]}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Fixtures;