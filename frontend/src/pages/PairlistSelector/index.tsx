import { useState } from 'react';
import { Play, BarChart3 } from 'lucide-react';
import { PairlistRunner } from './PairlistRunner';
import { PairlistResults } from '../../components/PairlistResults';

export function PairlistSelector() {
  const [activeTab, setActiveTab] = useState<'run' | 'results'>('run');
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">🎯 Pairlist Optimizer</h1>
        <p className="text-gray-400">Generate optimal pairlists using ML training or comprehensive backtests</p>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('run')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'run'
              ? 'bg-blue-600 text-white'
              : 'bg-[#161b22] text-gray-400 hover:text-white border border-[#30363d]'
          }`}
        >
          <Play className="w-5 h-5" />
          Run Optimizer
        </button>
        
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'results'
              ? 'bg-blue-600 text-white'
              : 'bg-[#161b22] text-gray-400 hover:text-white border border-[#30363d]'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          View Results
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'run' ? <PairlistRunner /> : <PairlistResults />}
    </div>
  );
}
