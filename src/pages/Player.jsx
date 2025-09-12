// src/pages/Players.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Star,
  DollarSign,
  Target,
} from "lucide-react";
import PlayerCard from "../components/PlayerCard";
import { fetchBootstrapData } from "../api/fplApi";
import { PERFORMANCE_THRESHOLDS } from "../utils/constants";

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [priceRange, setPriceRange] = useState([4.0, 15.0]);
  const [sortBy, setSortBy] = useState("total_points");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadPlayersData = async () => {
      try {
        setLoading(true);
        const data = await fetchBootstrapData();

        // Process players data with team names
        const playersWithTeams = data.elements.map((player) => ({
          ...player,
          team_name:
            data.teams.find((t) => t.id === player.team)?.name || "Unknown",
          position_name:
            data.element_types.find((p) => p.id === player.element_type)
              ?.singular_name_short || "Unknown",
          now_cost_millions: player.now_cost / 10,
          value_season:
            parseFloat(player.total_points) / (player.now_cost / 10) || 0,
        }));

        setPlayers(playersWithTeams);

        // Set teams lookup
        const teamsLookup = {};
        data.teams.forEach((team) => {
          teamsLookup[team.id] = team;
        });
        setTeams(teamsLookup);

        // Set positions lookup
        const positionsLookup = {};
        data.element_types.forEach((position) => {
          positionsLookup[position.id] = position;
        });
        setPositions(positionsLookup);
      } catch (err) {
        setError("Failed to load players data. Please try again later.");
        console.error("Error loading players:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPlayersData();
  }, []);

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter((player) => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !player.web_name.toLowerCase().includes(searchLower) &&
          !player.first_name.toLowerCase().includes(searchLower) &&
          !player.second_name.toLowerCase().includes(searchLower) &&
          !player.team_name.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Position filter
      if (
        selectedPosition !== "all" &&
        player.element_type !== parseInt(selectedPosition)
      ) {
        return false;
      }

      // Team filter
      if (selectedTeam !== "all" && player.team !== parseInt(selectedTeam)) {
        return false;
      }

      // Price range filter
      const price = player.now_cost_millions;
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }

      return true;
    });

    // Sort players
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle special sorting cases
      if (sortBy === "value_season") {
        aValue =
          parseFloat(a.total_points) / (a.now_cost / 10) ||
          0;
        bValue =
          parseFloat(b.total_points) / (b.now_cost / 10) ||
          0;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [
    players,
    searchTerm,
    selectedPosition,
    selectedTeam,
    priceRange,
    sortBy,
    sortOrder,
  ]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const getPerformanceColor = (value, type) => {
    const thresholds = PERFORMANCE_THRESHOLDS[type];
    if (!thresholds) return "text-gray-600";

    if (value >= thresholds.excellent) return "text-green-600";
    if (value >= thresholds.good) return "text-blue-600";
    if (value >= thresholds.average) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fpl-light flex items-center justify-center">
        <div className="text-xl font-semibold">Loading players...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-fpl-light flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fpl-light p-6">
      {/* Search & Filter Toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div className="flex items-center bg-white rounded-md shadow px-3 py-2 w-full md:w-1/2">
          <Search className="h-5 w-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search players by name or team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-fpl-purple text-white rounded shadow"
        >
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-md shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Position */}
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">All Positions</option>
            {Object.values(positions).map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.singular_name}
              </option>
            ))}
          </select>

          {/* Team */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">All Teams</option>
            {Object.values(teams).map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          {/* Price Range */}
          <div>
            <label className="block text-sm mb-1">Price Range (£m)</label>
            <input
              type="range"
              min="4.0"
              max="15.0"
              step="0.5"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([4.0, parseFloat(e.target.value)])}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>£4.0</span>
              <span>£{priceRange[1]}</span>
            </div>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="total_points">Total Points</option>
            <option value="now_cost_millions">Price</option>
            <option value="minutes">Minutes Played</option>
            <option value="goals_scored">Goals</option>
            <option value="assists">Assists</option>
            <option value="clean_sheets">Clean Sheets</option>
            <option value="value_season">Value (Points/£)</option>
          </select>
        </div>
      )}

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            team={teams[player.team]}
            position={positions[player.element_type]}
            performanceColor={getPerformanceColor}
          />
        ))}
      </div>
    </div>
  );
};

export default Players;
