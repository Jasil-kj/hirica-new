import React, { useMemo } from 'react';

export interface MalpracticeEvent {
  type: string;
  timestamp: string;
  details: string;
  severity?: 'high' | 'medium' | 'low';
}

interface IntegrityDashboardProps {
  events: MalpracticeEvent[];
  tabSwitches?: number;
  faceCount?: number;
  cameraStatus?: string;
  trustScore?: number;
}

export const MalpracticeIntegrityDashboard: React.FC<IntegrityDashboardProps> = ({
  events = [],
  tabSwitches = 0,
  faceCount = 1,
  trustScore = 95
}) => {
  // Aggregate event breakdowns
  const metrics = useMemo(() => {
    let multiFaces = 0;
    let noFaces = 0;
    let tabSwitchCount = tabSwitches;
    let clipboardAttempts = 0;

    events.forEach(e => {
      const t = (e.type || '').toLowerCase();
      if (t.includes('multi')) multiFaces++;
      else if (t.includes('no_face') || t.includes('missing')) noFaces++;
      else if (t.includes('tab') || t.includes('blur')) tabSwitchCount++;
      else if (t.includes('copy') || t.includes('paste')) clipboardAttempts++;
    });

    const totalIncidents = multiFaces + noFaces + tabSwitchCount + clipboardAttempts;
    const computedTrust = Math.max(10, 100 - (multiFaces * 20 + noFaces * 10 + tabSwitchCount * 8 + clipboardAttempts * 12));

    return {
      multiFaces,
      noFaces,
      tabSwitchCount,
      clipboardAttempts,
      totalIncidents,
      trustScore: trustScore !== undefined && trustScore < 100 ? trustScore : computedTrust
    };
  }, [events, tabSwitches, trustScore]);

  // Telemetry event timeline points (last 10 minutes or points)
  const timelinePoints = useMemo(() => {
    if (events.length === 0) {
      return [
        { time: '0m', trust: 100, incident: null },
        { time: '2m', trust: 100, incident: null },
        { time: '4m', trust: 98, incident: null },
        { time: '6m', trust: 95, incident: null },
        { time: 'Now', trust: metrics.trustScore, incident: null }
      ];
    }
    let currentTrust = 100;
    return events.slice(-8).map((evt, idx) => {
      const t = (evt.type || '').toLowerCase();
      let drop = 2;
      if (t.includes('multi')) drop = 18;
      else if (t.includes('no_face')) drop = 8;
      else if (t.includes('tab')) drop = 6;
      else if (t.includes('paste')) drop = 10;
      currentTrust = Math.max(15, currentTrust - drop);
      return {
        time: evt.timestamp.split(':').slice(0, 2).join(':') || `#${idx + 1}`,
        trust: currentTrust,
        incident: evt.details || evt.type
      };
    });
  }, [events, metrics.trustScore]);

  const riskLevel = metrics.trustScore >= 85 ? 'LOW' : metrics.trustScore >= 60 ? 'MODERATE' : 'CRITICAL';
  const riskColor = riskLevel === 'LOW' ? '#15803d' : riskLevel === 'MODERATE' ? '#b45309' : '#dc2626';
  const riskBg = riskLevel === 'LOW' ? '#f0fdf4' : riskLevel === 'MODERATE' ? '#fffbeb' : '#fef2f2';

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* TOP LIVE STATUS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Trust Score */}
        <div className="p-3 rounded-xl border border-olive-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">TRUST INDEX</span>
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase"
              style={{ background: riskBg, color: riskColor }}
            >
              {riskLevel} RISK
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono" style={{ color: riskColor }}>
              {metrics.trustScore}%
            </span>
            <span className="text-[10px] text-slate-500">Integrity Score</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${metrics.trustScore}%`,
                backgroundColor: riskColor
              }}
            />
          </div>
        </div>

        {/* Metric 2: Detected Faces */}
        <div className="p-3 rounded-xl border border-olive-200 bg-white shadow-xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold block">
            VISION AUDIT
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-2xl font-black font-mono ${faceCount >= 2 ? 'text-red-600' : faceCount === 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {faceCount} {faceCount === 1 ? 'Face' : 'Faces'}
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              faceCount === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600 animate-pulse'
            }`}>
              {faceCount === 1 ? 'VERIFIED' : faceCount >= 2 ? 'COLLUSION ALERT' : 'ABSENCE'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {metrics.multiFaces} multi-face incidents recorded
          </p>
        </div>

        {/* Metric 3: Tab Focus & Screen */}
        <div className="p-3 rounded-xl border border-olive-200 bg-white shadow-xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold block">
            FOCUS TELEMETRY
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-2xl font-black font-mono ${metrics.tabSwitchCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {metrics.tabSwitchCount}
            </span>
            <span className="text-[10px] font-mono text-slate-500">Tab Switches</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {metrics.tabSwitchCount === 0 ? '100% window locked' : 'Window defocus detected'}
          </p>
        </div>

        {/* Metric 4: Clipboard & Malpractice */}
        <div className="p-3 rounded-xl border border-olive-200 bg-white shadow-xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold block">
            CLIPBOARD LOCK
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-2xl font-black font-mono ${metrics.clipboardAttempts > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {metrics.clipboardAttempts}
            </span>
            <span className="text-[10px] font-mono text-slate-500">Copy/Paste</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {metrics.clipboardAttempts === 0 ? 'Zero external code imports' : 'External paste intercepted'}
          </p>
        </div>
      </div>

      {/* GRAPH 1: REAL-TIME TRUST & ANOMALY TIMELINE */}
      <div className="p-4 rounded-xl border border-olive-200 bg-white shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Real-Time Integrity & Malpractice Risk Curve
            </h4>
            <p className="text-[11px] text-slate-500">
              Live continuous telemetry plot tracking candidate adherence during evaluation.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
            60 FPS TELEMETRY
          </span>
        </div>

        {/* SVG Sparkline / Area Chart */}
        <div className="relative pt-2 pb-1">
          <div className="h-28 w-full flex items-end">
            <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15803d" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Polygon Area Fill */}
              {(() => {
                const step = 500 / Math.max(1, timelinePoints.length - 1);
                const points = timelinePoints.map((p, idx) => {
                  const x = idx * step;
                  const y = 100 - p.trust; // inverted for SVG coordinates (100 trust -> y=0)
                  return `${x},${y}`;
                });
                const areaPoints = `0,100 ${points.join(' ')} 500,100`;
                return (
                  <>
                    <polygon points={areaPoints} fill="url(#trustGradient)" />
                    <polyline
                      fill="none"
                      stroke={riskColor}
                      strokeWidth="2.5"
                      points={points.join(' ')}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {timelinePoints.map((p, idx) => {
                      const x = idx * step;
                      const y = 100 - p.trust;
                      return (
                        <g key={idx}>
                          <circle
                            cx={x}
                            cy={y}
                            r={p.trust < 80 ? 4 : 3}
                            fill={p.trust < 80 ? '#dc2626' : '#15803d'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Time Labels */}
          <div className="flex justify-between text-[9px] font-mono text-slate-600 pt-2 px-1">
            {timelinePoints.map((p, i) => (
              <span key={i}>{p.time}</span>
            ))}
          </div>
        </div>
      </div>

      {/* GRAPH 2: ANOMALY CLASSIFICATION BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Malpractice category bars */}
        <div className="p-4 rounded-xl border border-olive-200 bg-white shadow-xs space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Malpractice Classification Breakdown
          </h4>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-600">Multiple Person Collusion</span>
                <span className="font-mono font-bold text-red-600">{metrics.multiFaces} detected</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, metrics.multiFaces * 33)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-600">Candidate Absence / Looking Away</span>
                <span className="font-mono font-bold text-amber-600">{metrics.noFaces} detected</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, metrics.noFaces * 25)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-600">Tab Switching / Unauthorized Browsing</span>
                <span className="font-mono font-bold text-orange-600">{metrics.tabSwitchCount} detected</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, metrics.tabSwitchCount * 20)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-600">External Code Paste Interception</span>
                <span className="font-mono font-bold text-purple-600">{metrics.clipboardAttempts} intercepted</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, metrics.clipboardAttempts * 50)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Audit Log */}
        <div className="p-4 rounded-xl border border-olive-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Audit Event Log
            </h4>
            <span className="text-[10px] font-mono text-slate-500">
              {events.length} Recorded
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs font-mono">
            {events.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                ✓ No malpractice flags. Candidate session clean.
              </div>
            ) : (
              events.slice(-6).reverse().map((ev, i) => (
                <div
                  key={i}
                  className="p-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      (ev.type || '').includes('multi') ? 'bg-red-500' :
                      (ev.type || '').includes('no_face') ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <span className="font-bold text-slate-800">{ev.type}</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">{ev.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MalpracticeIntegrityDashboard;
