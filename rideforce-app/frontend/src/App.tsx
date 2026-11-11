import { useState, useEffect, useCallback } from 'react';
import { Car, User, CheckCircle2, AlertCircle, RefreshCw, Compass, ArrowRight, Zap, RotateCcw } from 'lucide-react';

interface Driver {
  id: number;
  name: string;
  capacity: number;
  location: string;
  status: 'AVAILABLE' | 'BUSY';
}

interface Rider {
  id: number;
  name: string;
  pickupLocation: string;
  destination: string;
}

interface MatchRecommendation {
  riderId: number;
  riderName: string;
  pickupLocation: string;
  destination: string;
  driverId: number;
  driverName: string;
  driverLocation: string;
  driverCapacity: number;
  score: number;
}

interface ConfirmedMatch {
  id: number;
  riderId: number;
  driverId: number;
  riderName?: string;
  driverName?: string;
  status: string;
  createdAt: string;
}

interface HealthStatus {
  status: string;
  components?: {
    db?: {
      status: string;
      details?: {
        database?: string;
      };
    };
  };
}

export default function App() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [matches, setMatches] = useState<MatchRecommendation[]>([]);
  const [confirmedDispatches, setConfirmedDispatches] = useState<ConfirmedMatch[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [resetting, setResetting] = useState<boolean>(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [driversRes, ridersRes, matchesRes, confirmedRes, healthRes] = await Promise.all([
        fetch('/api/drivers').then(r => r.ok ? r.json() : []),
        fetch('/api/riders').then(r => r.ok ? r.json() : []),
        fetch('/api/matches').then(r => r.ok ? r.json() : []),
        fetch('/api/matches/confirmed').then(r => r.ok ? r.json() : []),
        fetch('/actuator/health').then(r => r.ok ? r.json() : null),
      ]);

      setDrivers(driversRes);
      setRiders(ridersRes);
      setMatches(matchesRes);
      setConfirmedDispatches(confirmedRes);
      setHealth(healthRes);
    } catch (err) {
      console.error('Failed to load platform data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDispatch = async (riderId: number, driverId: number) => {
    const key = `${riderId}-${driverId}`;
    setDispatchingId(key);
    setMessage(null);

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId, driverId }),
      });

      if (!res.ok) {
        throw new Error(`Dispatch failed with HTTP ${res.status}`);
      }

      const matchData = await res.json();
      setMessage({
        text: `Match #${matchData.id} Confirmed! Driver remaining capacity updated.`,
        type: 'success',
      });
      await fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessage({
        text: `Error dispatching match: ${errorMsg}`,
        type: 'error',
      });
    } finally {
      setDispatchingId(null);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(`Reset failed with HTTP ${res.status}`);
      }

      setMessage({
        text: 'Fleet, riders, and match pairings reset to initial showcase state!',
        type: 'success',
      });
      await fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessage({
        text: `Error resetting demo fleet: ${errorMsg}`,
        type: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  // Find dispatched status for each rider
  const matchedRiderMap = new Map<number, ConfirmedMatch>();
  confirmedDispatches.forEach(m => {
    matchedRiderMap.set(m.riderId, m);
  });

  const availableDriversCount = drivers.filter(d => d.status === 'AVAILABLE' && d.capacity > 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                RideForce Platform
              </h1>
              <p className="text-xs text-slate-400 font-mono">Greenfield Containerized Orchestration</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Health Badge */}
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
              <span className="text-slate-400">System:</span>
              {health?.status === 'UP' ? (
                <span className="flex items-center text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> UP
                  {health.components?.db?.status === 'UP' && (
                    <span className="ml-1 text-[10px] text-slate-400">(DB: UP)</span>
                  )}
                </span>
              ) : (
                <span className="flex items-center text-rose-400 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> DOWN
                </span>
              )}
            </div>

            {/* Reset Fleet Button */}
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition disabled:opacity-50"
              title="Reset Demo Fleet and Matches"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset Fleet</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
              title="Refresh State"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Active Drivers */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                <Car className="w-5 h-5 text-teal-400" />
                <h2>Fleet Drivers</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {availableDriversCount} available / {drivers.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {drivers.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No registered drivers</p>
              ) : (
                drivers.map(driver => (
                  <div
                    key={driver.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-200">{driver.name}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          driver.status === 'AVAILABLE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {driver.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center">
                        <Compass className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        {driver.location}
                      </span>
                      <span>
                        Capacity: <strong className={driver.capacity > 0 ? "text-slate-200" : "text-rose-400"}>{driver.capacity}</strong> seats
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Riders (Waiting vs Matched) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                <User className="w-5 h-5 text-indigo-400" />
                <h2>Roster of Riders</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {riders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {riders.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No registered riders</p>
              ) : (
                riders.map(rider => {
                  const matched = matchedRiderMap.get(rider.id);
                  return (
                    <div
                      key={rider.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-200">{rider.name}</span>
                        {matched ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Dispatched
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                            Waiting
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-400 space-x-1.5">
                        <span className="text-indigo-300 font-medium">{rider.pickupLocation}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-emerald-300 font-medium">{rider.destination}</span>
                      </div>
                      {matched && matched.driverName && (
                        <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60">
                          Matched with: <strong className="text-slate-300">{matched.driverName}</strong>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Live Ranked Match Dispatches */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2>Ranked Match Recommendations</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {matches.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {matches.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm space-y-3">
                  <p className="font-medium text-slate-300">No active pairings available.</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {availableDriversCount === 0
                      ? 'All drivers are currently BUSY (capacity full).'
                      : 'All waiting riders have already been matched and dispatched!'}
                  </p>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                    <span>Reset Showcase Data</span>
                  </button>
                </div>
              ) : (
                matches.map((match) => {
                  const isDispatching = dispatchingId === `${match.riderId}-${match.driverId}`;
                  return (
                    <div
                      key={`${match.riderId}-${match.driverId}`}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">
                          {match.riderName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          Score: {match.score}%
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 bg-slate-900/80 p-2 rounded-lg space-y-1">
                        <div>
                          Pair: <strong className="text-slate-300">{match.driverName}</strong> ({match.driverLocation})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Remaining Driver Capacity: {match.driverCapacity}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDispatch(match.riderId, match.driverId)}
                        disabled={isDispatching}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition flex items-center justify-center space-x-1.5 shadow-sm shadow-emerald-950 disabled:opacity-50"
                      >
                        {isDispatching ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Confirming...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dispatch Match</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Confirmed Dispatches History */}
        {confirmedDispatches.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirmed Ride Dispatches</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {confirmedDispatches.length} completed
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {confirmedDispatches.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-300 font-medium">
                    <span>Dispatch #{dispatch.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      {dispatch.status}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Rider: <strong className="text-slate-200">{dispatch.riderName || `Rider #${dispatch.riderId}`}</strong>
                  </div>
                  <div className="text-slate-400">
                    Driver: <strong className="text-slate-200">{dispatch.driverName || `Driver #${dispatch.driverId}`}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        RideForce Greenfield Containerized Platform • Docker-First Multi-Container Architecture
      </footer>
    </div>
  );
}
