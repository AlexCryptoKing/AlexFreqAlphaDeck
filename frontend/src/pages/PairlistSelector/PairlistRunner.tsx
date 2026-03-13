import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { strategyLabApi } from '../../services/strategyLabApi';
import { Monitor, ExternalLink, RefreshCw } from 'lucide-react';

const API_BASE = 'http://192.168.0.210:8000/api/v1';

const MODES = [
  { id: 'ml_training', label: '🤖 ML Training', description: 'Train ML models on each pair' },
  { id: 'fullbacktest_batch', label: '⚡ Full Backtest (Batch)', description: 'Fast batch backtest all pairs at once' },
  { id: 'fullbacktest_individual', label: '🔬 Full Backtest (Individual)', description: 'Detailed individual backtest per pair (slower)' },
];

export function PairlistRunner() {
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [selectedMode, setSelectedMode] = useState('fullbacktest_batch');
  const [nPairs, setNPairs] = useState(50);
  const [downloadDays, setDownloadDays] = useState(60);
  const [backtestDays, setBacktestDays] = useState('');
  const [configFile, setConfigFile] = useState('config-pairlist.json');
  const [maxPairs, setMaxPairs] = useState(500);
  const [message, setMessage] = useState('');
  
  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategyLabApi.getStrategies(),
  });
  
  const { data: jobs, refetch: refetchJobs } = useQuery({
    queryKey: ['pairlist-jobs'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/pairlist-selector/jobs`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      return res.json();
    },
    refetchInterval: 5000,
  });
  
  const runMutation = useMutation({
    mutationFn: async (params: any) => {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/pairlist-selector/run`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error('Failed to start');
      return res.json();
    },
    onSuccess: () => {
      setMessage('✅ Pairlist optimizer started!');
      refetchJobs();
    },
    onError: (err: any) => {
      setMessage(`❌ Error: ${err.message}`);
    }
  });
  
  const handleRun = () => {
    if (!selectedStrategy) {
      setMessage('❌ Please select a strategy');
      return;
    }
    runMutation.mutate({
      strategy: selectedStrategy,
      mode: selectedMode,
      n_pairs: nPairs,
      download_days: downloadDays,
      backtest_days: backtestDays ? parseInt(backtestDays) : null,
      config_file: configFile,
      max_pairs: maxPairs
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Strategy & Mode */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Strategy</label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-[#30363d] rounded-lg text-white"
            >
              <option value="">-- Select strategy --</option>
              {strategies?.map((s: any) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Evaluation Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODES.map((mode) => (
                <label
                  key={mode.id}
                  className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedMode === mode.id
                      ? 'bg-blue-900/20 border-blue-500'
                      : 'bg-[#0f1419] border-[#30363d] hover:bg-[#1a2332]'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={mode.id}
                    checked={selectedMode === mode.id}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="mb-2"
                  />
                  <span className="font-medium text-white">{mode.label}</span>
                  <p className="text-sm text-gray-400 mt-1">{mode.description}</p>
                </label>
              ))}
            </div>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Config File</label>
            <input
              type="text"
              value={configFile}
              onChange={(e) => setConfigFile(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-[#30363d] rounded-lg text-white"
            />
          </div>
        </div>
        
        {/* Parameters */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-6">Parameters</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Target Pairs: {nPairs}</label>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={nPairs}
                onChange={(e) => setNPairs(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Max Pairs to Evaluate: {maxPairs}</label>
              <input
                type="range"
                min="100"
                max="1000"
                step="100"
                value={maxPairs}
                onChange={(e) => setMaxPairs(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Download Days</label>
              <input
                type="number"
                min="30"
                max="365"
                value={downloadDays}
                onChange={(e) => setDownloadDays(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-[#0f1419] border border-[#30363d] rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Backtest Days (optional)</label>
              <input
                type="number"
                placeholder="All available data"
                value={backtestDays}
                onChange={(e) => setBacktestDays(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1419] border border-[#30363d] rounded-lg text-white"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Run Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRun}
          disabled={runMutation.isPending || !selectedStrategy}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold rounded-lg text-lg"
        >
          {runMutation.isPending ? '🚀 Starting...' : '🚀 Run Pairlist Optimizer'}
        </button>
        
        {message && (
          <span className={message.startsWith('✅') ? 'text-green-400' : 'text-red-400'}>{message}</span>
        )}
      </div>
      
      {/* Running Jobs */}
      {jobs?.length > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Running Jobs</h3>
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <div
                key={job.job_id}
                className={`p-4 rounded-lg border ${
                  job.status === 'running' ? 'bg-orange-900/20 border-orange-500' :
                  job.status === 'completed' ? 'bg-green-900/20 border-green-500' :
                  'bg-red-900/20 border-red-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{job.strategy}</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    job.status === 'running' ? 'bg-orange-600' :
                    job.status === 'completed' ? 'bg-green-600' : 'bg-red-600'
                  } text-white`}>{job.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
