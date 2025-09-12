// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Target, TrendingUp, Users, ArrowRight, Star, Crown, Zap } from 'lucide-react';
import { fetchBootstrapData } from '../api/fplApi';
import { useUser } from '../contexts/UserContext';
import PlayerCard from '../components/PlayerCard';
import { ROUTES, INSIGHT_CATEGORIES } from '../utils/constants';

const Home = () => {
  const { isAuthenticated } = useUser();
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentGameweek, setCurrentGameweek] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic FPL data
      const bootstrapData = await fetchBootstrapData();
      const currentEvent = bootstrapData.events.find(event => event.is_current) || 
                          bootstrapData.events.find(event => event.is_next);
      setCurrentGameweek(currentEvent);
      
      // Get top players across all positions
      const topPlayersData = await getTopPlayersByPosition(null, 6);
      setTopPlayers(topPlayersData);
      
    } catch (err) {
      // console.error('Error loading home data:', err);
      setError('Failed to load FPL data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Crown,
      title: 'Smart Captaincy',
      description: 'AI analyzes form, fixtures, and historical data to suggest optimal captain choices.',
      color: 'text-yellow-600'
    },
    {
      icon: Star,
      title: 'Differential Picks',
      description: 'Discover low-ownership players with high potential returns to gain rank.',
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Transfer Insights',
      description: 'Get personalized transfer recommendations based on your team and budget.',
      color: 'text-blue-600'
    },
    {
      icon: Target,
      title: 'Fixture Analysis',
      description: 'Plan ahead with detailed fixture difficulty ratings and team rotation.',
      color: 'text-green-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-fpl-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading FPL Data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="content-max-width container-padding">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Dominate Your{' '}
              <span className="text-fpl-secondary">Fantasy League</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Powered by artificial intelligence, get expert insights, player recommendations, 
              and winning strategies for Fantasy Premier League.
            </p>
            
            {currentGameweek && (
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full text-sm font-medium mb-8">
                <Zap className="h-4 w-4 mr-2 text-fpl-secondary" />
                Current: Gameweek {currentGameweek.id}
                {currentGameweek.is_current && (
                  <span className="ml-2 px-2 py-1 bg-fpl-secondary text-fpl-primary rounded-full text-xs font-bold">
                    LIVE
                  </span>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {isAuthenticated() ? (
                <Link
                  to={ROUTES.dashboard}
                  className="btn-secondary inline-flex items-center text-lg px-8 py-3"
                >
                  View Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to={ROUTES.register}
                    className="btn-secondary inline-flex items-center text-lg px-8 py-3"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to={ROUTES.login}
                    className="btn-outline inline-flex items-center text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-fpl-primary"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing bg-white">
        <div className="content-max-width container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI-Powered FPL Insights
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our advanced algorithms analyze millions of data points to give you 
              the competitive edge in Fantasy Premier League.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="card card-hover text-center animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 ${feature.color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Players Section */}
      {!error && topPlayers.length > 0 && (
        <section className="section-spacing bg-gray-50">
          <div className="content-max-width container-padding">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Top Performing Players
              </h2>
              <p className="text-xl text-gray-600">
                Current season standouts based on points, form, and value
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  showInsights={true}
                  className="animate-slide-up"
                />
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link
                to={ROUTES.players || '#'}
                className="btn-primary inline-flex items-center"
              >
                View All Players
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="section-spacing bg-fpl-primary text-white">
        <div className="content-max-width container-padding">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <BarChart3 className="h-12 w-12 text-fpl-secondary mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2">10M+</div>
              <div className="text-gray-200">Data Points Analyzed</div>
            </div>
            <div>
              <Users className="h-12 w-12 text-fpl-secondary mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-gray-200">Active Users</div>
            </div>
            <div>
              <TrendingUp className="h-12 w-12 text-fpl-secondary mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2">85%</div>
              <div className="text-gray-200">Improved Rank Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated() && (
        <section className="section-spacing bg-white">
          <div className="content-max-width container-padding">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Ready to Improve Your FPL Game?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Join thousands of managers who use AI insights to climb the rankings. 
                Start your journey to FPL success today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to={ROUTES.register}
                  className="btn-primary text-lg px-8 py-3 inline-flex items-center"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to={ROUTES.login}
                  className="btn-outline text-lg px-8 py-3"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error State */}
      {error && (
        <section className="section-spacing">
          <div className="content-max-width container-padding">
            <div className="text-center">
              <div className="alert alert-error max-w-md mx-auto">
                <p>{error}</p>
                <button 
                  onClick={loadHomeData}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;