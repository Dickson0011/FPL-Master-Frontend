// src/pages/Fixtures.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, TrendingUp, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchBootstrapData, fetchFixtures, fetchTeams } from '../api/fplApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const FIXTURE_DIFFICULTY = {
  1: { label: 'Very Easy', color: 'bg-green-500', textColor: 'text-green-700' },
  2: { label: 'Easy', color: 'bg-green-400', textColor: 'text-green-600' },
  3: { label: 'Medium', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
  4: { label: 'Hard', color: 'bg-orange-400', textColor: 'text-orange-600' },
  5: { label: 'Very Hard', color: 'bg-red-500', textColor: 'text-red-700' },
};

const Fixtures = () => {
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState({});
  const [gameweeks, setGameweeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGameweek, setSelectedGameweek] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [filterFinished, setFilterFinished] = useState(false);
  const [currentGameweek, setCurrentGameweek] = useState(null);

  useEffect(() => {
    loadFixturesData();
  }, []);

  const loadFixturesData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data with caching options
      const cacheOptions = { 
        forceRefresh, 
        useStaleWhileRevalidate: !forceRefresh 
      };

      const [fixturesData, bootstrapData, teamsData] = await Promise.all([
        fetchFixtures(),
        fetchBootstrapData(cacheOptions),
        fetchTeams(cacheOptions)
      ]);

      setFixtures(fixturesData);
      setTeams(teamsData);
      setGameweeks(bootstrapData.events || []);
      
      // Find current gameweek
      const current = bootstrapData.events?.find(gw => gw.is_current);
      setCurrentGameweek(current);
      
      // Set default filter to current gameweek if available
      if (current && selectedGameweek === 'all') {
        setSelectedGameweek(current.id.toString());
      }

    } catch (err) {
      console.error('Failed to load fixtures data:', err);
      setError(err.message || 'Failed to load fixtures data');
    } finally {
      setLoading(false);
    }
  };

  // Filter fixtures based on selected criteria
  const filteredFixtures = fixtures.filter(fixture => {
    // Filter by gameweek
    if (selectedGameweek !== 'all' && fixture.event !== parseInt(selectedGameweek)) {
      return false;
    }

    // Filter by team - Fixed: use team index (1-based) instead of id
    if (selectedTeam !== 'all') {
      const teamIndex = parseInt(selectedTeam);
      if (fixture.team_h !== teamIndex && fixture.team_a !== teamIndex) {
        return false;
      }
    }

    // Filter by finished status
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
    const opponentTeam = teams[opponent];
    const opponentStrength = opponentTeam?.strength || 3;
    
    // Convert strength to difficulty (inverse relationship)
    if (opponentStrength >= 5) return 5;
    if (opponentStrength >= 4) return 4;
    if (opponentStrength >= 3) return 3;
    if (opponentStrength >= 2) return 2;
    return 1;
  };

  const FixtureCard = ({ fixture }) => {
    const homeTeam = teams[fixture.team_h];
    const awayTeam = teams[fixture.team_a];
    const { date, time } = formatDateTime(fixture.kickoff_time);
    
    if (!homeTeam || !awayTeam) return null;

    const homeDifficulty = getFixtureDifficulty(fixture.team_h, fixture.team_a, true);
    const awayDifficulty = getFixtureDifficulty(fixture.team_h, fixture.team_a, false);

    return (
      <div className="bg-gradient-to-br from-rose-800 to-gray-900 rounded-lg shadow-card p-4 hover:shadow-md transition-shadow duration-200">
        {/* Match Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-sm text-white">
            <Calendar className="h-4 w-4 text-white" />
            <span>{date}</span>
            <Clock className="h-4 w-4 ml-2 text-white" />
            <span>{time}</span>
          </div>
          {fixture.finished && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              Finished
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: homeTeam.color || '#37003c' }}
              >
                {homeTeam.short || homeTeam.name?.substring(0, 3)}
              </div>
              <span className="font-medium text-white">{homeTeam.short}</span>
            </div>
            <div 
              className={`px-2 py-1 rounded text-xs font-medium ${FIXTURE_DIFFICULTY[homeDifficulty]?.color} text-white`}
              title={`Difficulty: ${FIXTURE_DIFFICULTY[homeDifficulty]?.label}`}
            >
              {homeDifficulty}
            </div>
          </div>

          {/* Score or VS */}
          <div className="flex items-center px-4">
            {fixture.finished ? (
              <div className="text-lg font-bold text-white">
                {fixture.team_h_score} - {fixture.team_a_score}
              </div>
            ) : (
              <div className="text-gray-300 font-medium">VS</div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center space-x-3 flex-1 justify-end">
            <div 
              className={`px-2 py-1 rounded text-xs font-medium ${FIXTURE_DIFFICULTY[awayDifficulty]?.color} text-white`}
              title={`Difficulty: ${FIXTURE_DIFFICULTY[awayDifficulty]?.label}`}
            >
              {awayDifficulty}
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-white">{awayTeam.short}</span>
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: awayTeam.color || '#37003c' }}
              >
                {awayTeam.short || awayTeam.name?.substring(0, 3)}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(fixture.stats?.length > 0 || fixture.finished) && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-300 text-center">
              {fixture.finished ? 'Match completed' : 'Upcoming fixture'}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const GameweekSection = ({ gameweekId, fixtures }) => {
    const gameweek = gameweeks.find(gw => gw.id === gameweekId);
    const isCurrentGW = currentGameweek?.id === gameweekId;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {gameweek ? gameweek.name : `Gameweek ${gameweekId}`}
            </h3>
            {isCurrentGW && (
              <span className="bg-fpl-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                Current
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {gameweek && formatDateTime(gameweek.deadline_time).date}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {fixtures
            .sort((a, b) => new Date(a.kickoff_time || 0) - new Date(b.kickoff_time || 0))
            .map(fixture => (
              <FixtureCard key={fixture.id} fixture={fixture} />
            ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Loading fixtures..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage 
          error={error}
          onRetry={() => loadFixturesData(true)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fixtures</h1>
          <p className="text-gray-600">
            View upcoming matches and results across all gameweeks
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-card p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gameweek Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gameweek
              </label>
              <select
                value={selectedGameweek}
                onChange={(e) => setSelectedGameweek(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fpl-primary focus:border-fpl-primary"
              >
                <option value="all">All Gameweeks</option>
                {gameweeks.map(gw => (
                  <option key={gw.id} value={gw.id.toString()}>
                    {gw.name} {gw.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Filter - Fixed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fpl-primary focus:border-fpl-primary"
              >
                <option value="all">All Teams</option>
                {Object.entries(teams)
                  .sort(([,a], [,b]) => a.name.localeCompare(b.name))
                  .map(([teamIndex, team]) => (
                    <option key={teamIndex} value={teamIndex}>
                      {team.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterFinished}
                  onChange={(e) => setFilterFinished(e.target.checked)}
                  className="rounded border-gray-300 text-fpl-primary focus:ring-fpl-primary"
                />
                <span className="text-sm text-gray-700">Show only finished matches</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Showing {filteredFixtures.length} fixtures
            </div>
            <button
              onClick={() => loadFixturesData(true)}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-fpl-primary text-white rounded-md hover:bg-fpl-primary/90 transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Difficulty Legend */}
        <div className="bg-white rounded-lg shadow-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficulty Rating</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(FIXTURE_DIFFICULTY).map(([rating, config]) => (
              <div key={rating} className="flex items-center space-x-2">
                <div 
                  className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${config.color}`}
                >
                  {rating}
                </div>
                <span className="text-sm text-gray-700">{config.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Difficulty is calculated based on opponent team strength. Lower numbers indicate easier fixtures.
          </p>
        </div>

        {/* Fixtures List */}
        {filteredFixtures.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No fixtures found</h3>
            <p className="text-gray-600">
              Try adjusting your filters to see more fixtures.
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