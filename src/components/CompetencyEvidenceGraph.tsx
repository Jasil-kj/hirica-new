import React, { useState } from 'react';

export interface CompetencyNode {
  name: string;
  category: 'core' | 'framework' | 'architecture' | 'database';
  status: 'verified' | 'emerging' | 'gap';
  evidenceSource: 'resume' | 'assessment' | 'interview';
  evidenceQuote: string;
  confidenceScore: number;
}

interface CompetencyEvidenceGraphProps {
  competencies: CompetencyNode[];
  candidateName: string;
  jobTitle: string;
}

export const CompetencyEvidenceGraph: React.FC<CompetencyEvidenceGraphProps> = ({
  competencies,
  candidateName,
  jobTitle
}) => {
  const [selectedNode, setSelectedNode] = useState<CompetencyNode | null>(
    competencies.length > 0 ? competencies[0] : null
  );

  return (
    <div className="card-enterprise p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">Competency Evidence Knowledge Graph</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/30">
              Innovation C
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Traceable mapping linking required role competencies to empirical resume claims, assessment questions, and interview quotes.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Verified ({competencies.filter(c => c.status === 'verified').length})
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Emerging ({competencies.filter(c => c.status === 'emerging').length})
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Gap ({competencies.filter(c => c.status === 'gap').length})
          </span>
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nodes Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Evaluated Competency Nodes (Click to Inspect Evidence Trace)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {competencies.map((node) => {
              const isSelected = selectedNode?.name === node.name;
              const statusColors = {
                verified: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:border-emerald-400',
                emerging: 'border-blue-500/40 bg-blue-950/20 text-blue-300 hover:border-blue-400',
                gap: 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:border-amber-400',
              };

              return (
                <button
                  key={node.name}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    statusColors[node.status]
                  } ${isSelected ? 'ring-2 ring-brand-500 shadow-md' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{node.category}</span>
                    <span className="text-[10px] font-mono font-bold">{node.confidenceScore}%</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">{node.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">Src: {node.evidenceSource}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Evidence Trace Inspector (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
          {selectedNode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] font-mono text-brand-400 uppercase">Selected Competency</span>
                  <h4 className="text-sm font-bold text-white">{selectedNode.name}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                  selectedNode.status === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : selectedNode.status === 'emerging'
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {selectedNode.status}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">Traceable Evidence Source</p>
                <p className="text-xs font-semibold text-slate-200 capitalize mt-0.5">
                  {selectedNode.evidenceSource === 'resume' && '📄 Extracted Resume Bullet / Project Claim'}
                  {selectedNode.evidenceSource === 'assessment' && '⚡ Proctored Assessment Performance'}
                  {selectedNode.evidenceSource === 'interview' && '🎙️ Adaptive AI Interview Transcript'}
                </p>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Empirical Citation</span>
                <p className="italic leading-relaxed">"{selectedNode.evidenceQuote}"</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Algorithmic Confidence</span>
                  <span className="text-white font-bold">{selectedNode.confidenceScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all"
                    style={{ width: `${selectedNode.confidenceScore}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              Select a competency node on the left to inspect evidence citations.
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Candidate: {candidateName}</span>
            <span>Target: {jobTitle}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
