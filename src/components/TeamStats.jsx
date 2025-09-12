// src/components/TeamStats.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Shield, Target, TrendingUp, TrendingDown, Home, Plane } from 'lucide-react';


const TeamStats = ({ team, fixtures = [], className = '' }) => {
  if (!team) return null;

  // Calculate team metrics
  const calculateTeamMetrics = () => {
    const homeStrength = (team.strength_attack_home + team.strength_defence_home) / 2;
    const awayStrength = (team.strength_attack_away + team.strength_defence_away) / 2;
    const overallStrength = (homeStrength + awayStrength) / 2;
    
    return {
      overall: overallStrength,
      home: homeStrength,
      away: awayStrength,
      attack_home: team.strength_attack_home,
      attack_away: team.strength_attack_away,
      defence_home: team.strength_defence_home,
      defence_away: team.strength_defence_away,
    };
  };

  const metrics = calculateTeamMetrics();

  // Prepare chart data for strength comparison
  const strengthData = [
    {
      category: 'Attack (H)',
      value: team.strength_attack_home,
      color: '#10b981'
    },
    {
      category: 'Attack (A)', 
      value: team.strength_attack_away,
      color: '#06b6d4'
    },
    {
      category: 'Defence (H)',
      value: team.strength_defence_home,
      color: '#8b5cf6'
    },
    {
      category: 'Defence (A)',
      value: team.strength_defence_away,
      color: '#f59e0b'
    }
  ];

  // Calculate fixture difficulty trend
  const upcomingFixtures = fixtures.slice(0, 6).map((fixture, index) => ({
    gameweek: `GW${fixture.gameweek || index + 1}`,
    difficulty: fixture.difficulty || 3,
    opponent: fixture.opponent || 'TBD',
    isHome: fixture.is_home
  }));

  // Get strength rating color and label
  const getStrengthRating = (strength) => {
    if (strength >= 4.5) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (strength >= 4.0) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (strength >= 3.5) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Below Average', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const overallRating = getStrengthRating(metrics.overall);

  return (
    <div className={`bg-white rounded-lg shadow-card p-6 ${className}`}>
      {/* Team Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
            style={{ backgroundColor: team.color || '#37003c' }}
          >
            {team.short_name || team.name?.substring(0, 3)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${overallRating.bg} ${overallRating.color}`}>
              <Target className="h-4 w-4 mr-1" />
              {overallRating.label} Team
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{metrics.overall.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Overall Strength</div>
        </div>
      </div>

      {/* Strength Breakdown */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Team Strength Analysis
        </h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Home</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{metrics.home.toFixed(1)}</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Attack:</span>
                <span className="font-medium">{team.strength_attack_home}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Defence:</span>
                <span className="font-medium">{team.strength_defence_home}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Away</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{metrics.away.toFixed(1)}</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Attack:</span>
                <span className="font-medium">{team.strength_attack_away}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Defence:</span>
                <span className="font-medium">{team.strength_defence_away}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Strength Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strengthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px' 
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#37003c"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fixture Difficulty */}
      {upcomingFixtures.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Upcoming Fixtures
          </h4>
          
          <div className="grid grid-cols-6 gap-2 mb-3">
            {upcomingFixtures.map((fixture, index) => (
              <div key={index} className="text-center">
                <div 
                  className={`w-full h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                    FIXTURE_DIFFICULTY[fixture.difficulty]?.color || 'bg-gray-400'
                  }`}
                  title={`${fixture.gameweek}: vs ${fixture.opponent} ${fixture.isHome ? '(H)' : '(A)'}`}
                >
                  {fixture.opponent.substring(0, 3)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {fixture.gameweek}
                </div>
                <div className="text-xs text-gray-400">
                  {fixture.isHome ? '(H)' : '(A)'}
                </div>
              </div>
            ))}
          </div>

          {/* Fixture Difficulty Chart */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={upcomingFixtures}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="gameweek" 
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  domain={[1, 5]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px' 
                  }}
                  formatter={(value, name, props) => [
                    `Difficulty: ${value}/5`,
                    `vs ${props.payload.opponent} ${props.payload.isHome ? '(H)' : '(A)'}`
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="difficulty" 
                  stroke="#37003c" 
                  strokeWidth={3}
                  dot={{ fill: '#37003c', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Team Summary */}
      <div className="border-t border-gray-100 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Position</div>
            <div className="font-semibold text-gray-900">
              {team.position ? `${team.position}${team.position === 1 ? 'st' : team.position === 2 ? 'nd' : team.position === 3 ? 'rd' : 'th'}` : 'TBD'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Points</div>
            <div className="font-semibold text-gray-900">{team.points || 0}</div>
          </div>
          <div>
            <div className="text-gray-600">Form</div>
            <div className="font-semibold text-gray-900">{team.form || 'N/A'}</div>
          </div>
          <div>
            <div className="text-gray-600">Played</div>
            <div className="font-semibold text-gray-900">
              {team.played || 0}/{team.total_fixtures || 38}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStats;