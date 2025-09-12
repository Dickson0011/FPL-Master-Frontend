// src/components/PlayerCard.jsx
import React, { useEffect, useState } from "react";
import { Star, TrendingUp, Shield, Zap } from "lucide-react";
import { fetchPositions } from "../api/fplApi";

const PlayerCard = ({ player, showInsights = false, className = "" }) => {
  const [positions, setPositions] = useState({});
  const [loadingPositions, setLoadingPositions] = useState(true);

  useEffect(() => {
    const loadPositions = async () => {
      try {
        const data = await fetchPositions();
        setPositions(data);
      } catch (err) {
        console.error("Failed to fetch positions:", err);
      } finally {
        setLoadingPositions(false);
      }
    };

    loadPositions();
  }, []);

  if (!player) return null;

  const position =
    !loadingPositions && positions[player.element_type]
      ? positions[player.element_type].short
      : "–";

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black p-5 shadow-xl border border-gray-700 hover:scale-105 transition-transform ${className}`}
    >
      {/* Player Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{player.web_name}</h3>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {position} • {player.team_name ?? "Unknown"}
          </p>
        </div>
        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-fpl-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {player.web_name?.[0]}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-700/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-purple-700">
            {player.total_points}
          </p>
          <p className="text-xs text-gray-400">Total Points</p>
        </div>
        <div className="bg-gray-700/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-400">{player.form}</p>
          <p className="text-xs text-gray-400">Form</p>
        </div>
        <div className="bg-gray-700/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-400">
            £{(player.now_cost / 10).toFixed(1)}m
          </p>
          <p className="text-xs text-gray-400">Price</p>
        </div>
        <div className="bg-gray-700/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-yellow-400">
            {player.selected_by_percent}%
          </p>
          <p className="text-xs text-gray-400">Selected By</p>
        </div>
      </div>

      {/* Insights */}
      {showInsights && (
        <div className="bg-gray-800/70 rounded-lg p-3 space-y-2">
          <div className="flex items-center text-sm text-gray-200">
            <Star className="h-4 w-4 text-yellow-500 mr-2" />
            Ownership Trend: {player.selected_by_percent}%
          </div>
          <div className="flex items-center text-sm text-gray-200">
            <TrendingUp className="h-4 w-4 text-blue-400 mr-2" />
            Value: {(player.value_season / 10).toFixed(1)}m
          </div>
          <div className="flex items-center text-sm text-gray-200">
            <Shield className="h-4 w-4 text-purple-400 mr-2" />
            Minutes Played: {player.minutes}
          </div>
          <div className="flex items-center text-sm text-gray-200">
            <Zap className="h-4 w-4 text-green-400 mr-2" />
            Goals: {player.goals_scored} | Assists: {player.assists}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
