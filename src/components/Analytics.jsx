import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Target, Flame, TrendingUp, CheckCircle2, BarChart2, ChevronDown, Calendar, ListChecks, Download } from 'lucide-react';
import { format as fmtDate, parseISO } from 'date-fns';
import {
  computeAnalytics, buildDailyData, getAvailableDates,
  computeDayAnalytics, CATEGORIES,
} from '../utils/analytics';
import { useTheme } from '../context/ThemeContext';
import { useBreakpoints } from '../hooks/useMediaQuery';

// ── helpers ───────────────────────────────────────────────────────────────────

function CircleProgress({ value, size = 120, strokeWidth = 10, color = '#7c3aed', label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
            strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 7px ${color}80)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.span key={value} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
            style={{ fontSize: size > 100 ? 24 : 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {value}%
          </motion.span>
        </div>
      </div>
      {label    && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>}
      {sublabel && <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{sublabel}</div>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: `0 8px 28px ${color}18` }}
      style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px 18px', border: `1px solid ${color}18`, flex: 1, minWidth: 120 }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, border: `1px solid ${color}28` }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '9px 13px', fontSize: 12, boxShadow: '0 8px 24px var(--shadow)' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 2 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.value}{p.name === 'Accuracy' ? '%' : ''}</span>
        </div>
      ))}
    </div>
  );
}

const RANGES = [
  { id: '7',  label: 'Last 7 days',  days: 7  },
  { id: '14', label: 'Last 14 days', days: 14 },
  { id: '30', label: 'Last 30 days', days: 30 },
];

// ── Day detail ────────────────────────────────────────────────────────────────

function DayDetail({ dayData, allTasks }) {
  const stats = useMemo(() => computeDayAnalytics(allTasks, dayData.date), [allTasks, dayData.date]);
  return (
    <motion.div key={dayData.date} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          { label: 'Total',       value: stats.total,          color: '#a855f7' },
          { label: 'Done',        value: stats.completed,      color: '#10b981' },
          { label: 'Pending',     value: stats.pending,        color: '#3b82f6' },
          { label: 'Accuracy',    value: `${stats.accuracy}%`, color: '#f59e0b' },
          { label: 'Concentrate', value: `${stats.concentration}%`, color: '#06b6d4' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 80, background: 'var(--surface-1)', borderRadius: 10, padding: '10px 12px', border: `1px solid ${s.color}18`, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Tasks */}
      {stats.tasks.length === 0
        ? <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>No tasks on this day</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {stats.tasks.map(t => {
            const cat = CATEGORIES.find(c => c.id === t.category) || CATEGORIES[0];
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 9, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                <div style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, background: t.completed ? cat.color : 'transparent', border: `1.5px solid ${cat.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.completed && <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, flex: 1, color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: t.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</span>
                <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: `${cat.color}18`, color: cat.color, flexShrink: 0 }}>{cat.icon} {cat.label}</span>
                {t.completedAt && <span style={{ fontSize: 10, color: '#10b98199', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDate(parseISO(t.completedAt), 'h:mm a')}</span>}
              </div>
            );
          })}
        </div>
      }
    </motion.div>
  );
}

// ── Export helpers ────────────────────────────────────────────────────────────

function exportJSON(todos, history) {
  const data = { todos, history, exportedAt: new Date().toISOString(), app: 'DailyFlow' };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `dailyflow-backup-${fmtDate(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(todos, history) {
  const all = [...todos, ...history.filter(h => !todos.find(t => t.id === h.id))];
  const headers = ['Text', 'Category', 'Priority', 'Recurring', 'Completed', 'Created At', 'Completed At', 'Due Date', 'Due Time', 'Notes'];
  const rows = all.map(t => [
    `"${(t.text || '').replace(/"/g, '""')}"`,
    t.category || '',
    t.priority || '',
    t.recurring || 'none',
    t.completed ? 'Yes' : 'No',
    t.createdAt ? fmtDate(parseISO(t.createdAt), 'yyyy-MM-dd HH:mm') : '',
    t.completedAt ? fmtDate(parseISO(t.completedAt), 'yyyy-MM-dd HH:mm') : '',
    t.dueDate || '',
    t.dueTime || '',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ].join(','));
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `dailyflow-tasks-${fmtDate(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ClearHistoryButton({ onClearHistory }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sure?</span>
      <button onClick={() => { onClearHistory(); setConfirming(false); }} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#ef4444', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Yes, clear</button>
      <button onClick={() => setConfirming(false)} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
    </motion.div>
  );
  return (
    <button onClick={() => setConfirming(true)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.22)', background: 'rgba(239,68,68,0.06)', color: 'rgba(239,68,68,0.65)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
      Clear History
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Analytics({ todos, history, onClearHistory }) {
  const { isDark }  = useTheme();
  const { isMobile } = useBreakpoints();
  const [rangeId,      setRangeId]      = useState('7');
  const [selectedDay,  setSelectedDay]  = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const allTasks = useMemo(() => {
    const liveIds        = new Set(todos.map(t => t.id));
    const filteredHistory = history.filter(t => !liveIds.has(t.id));
    return [...todos, ...filteredHistory];
  }, [todos, history]);

  const stats        = useMemo(() => computeAnalytics(allTasks), [allTasks]);
  const currentRange = RANGES.find(r => r.id === rangeId) || RANGES[0];
  const dailyData    = useMemo(() => buildDailyData(allTasks, currentRange.days), [allTasks, currentRange.days]);
  const availDates   = useMemo(() => getAvailableDates(allTasks), [allTasks]);

  const selectedLabel = selectedDay ? fmtDate(parseISO(selectedDay), 'EEE, MMM d yyyy') : currentRange.label;

  const handleSelect = (opt) => {
    if (opt.type === 'range') { setRangeId(opt.id); setSelectedDay(null); }
    else if (opt.type === 'day') { setSelectedDay(opt.id); setRangeId(null); }
    setDropdownOpen(false);
  };

  // Theme-aware chart colors
  const tickColor = isDark ? 'rgba(240,240,255,0.4)' : 'rgba(30,16,64,0.45)';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(109,40,217,0.06)';

  const circleSize  = isMobile ? 90 : 120;
  const circleStroke = isMobile ? 8 : 10;

  if (allTasks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px 20px', gap: 14, color: 'var(--text-muted)' }}>
        <BarChart2 size={52} strokeWidth={1} />
        <div style={{ fontSize: 17, fontWeight: 600 }}>No data yet</div>
        <div style={{ fontSize: 13 }}>Add and complete tasks to see analytics</div>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stat cards */}
      <div className="analytics-stat-cards">
        <StatCard icon={CheckCircle2} label="Total Tasks"  value={stats.total}  sub={`${stats.pending} pending`} color="#a855f7" delay={0} />
        <StatCard icon={Flame}        label="Day Streak"   value={stats.streak} sub="days in a row"              color="#f59e0b" delay={0.05} />
        <StatCard icon={Target}       label="Today"        value={`${stats.todayStats.completed}/${stats.todayStats.total}`} sub="completed today"      color="#3b82f6" delay={0.1} />
        <StatCard icon={TrendingUp}   label="This Week"    value={`${stats.weekStats.completed}/${stats.weekStats.total}`}  sub="completed this week"  color="#10b981" delay={0.15} />
      </div>

      {/* Performance panel */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', padding: isMobile ? '20px 16px' : '24px 28px' }}>
        <div className="perf-panel">
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Performance Overview</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, marginBottom: 18 }}>All-time quality metrics (includes deleted tasks)</div>
            {[
              { label: 'Overall Accuracy',    value: stats.accuracy,      color: '#a855f7', grad: 'linear-gradient(90deg,#7c3aed,#a855f7)', glow: 'rgba(168,85,247,0.5)' },
              { label: 'Concentration Score', value: stats.concentration, color: '#06b6d4', grad: 'linear-gradient(90deg,#0891b2,#06b6d4)', glow: 'rgba(6,182,212,0.5)' },
            ].map(m => (
              <div key={m.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{m.value}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div key={m.value} initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                    style={{ height: '100%', borderRadius: 3, background: m.grad, boxShadow: `0 0 6px ${m.glow}` }} />
                </div>
              </div>
            ))}
            <div style={{ padding: '9px 11px', background: 'var(--surface-1)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Accuracy</strong> = completed ÷ total &nbsp;·&nbsp;
              <strong style={{ color: 'var(--text-secondary)' }}>Concentration</strong> = on-time ÷ with-deadline
            </div>
          </div>
          <div className="perf-circles" style={{ display: 'flex', gap: isMobile ? 20 : 36, alignItems: 'center' }}>
            <CircleProgress value={stats.accuracy}      size={circleSize} strokeWidth={circleStroke} color="#a855f7" label="Accuracy"      sublabel="Completed" />
            <CircleProgress value={stats.concentration} size={circleSize} strokeWidth={circleStroke} color="#06b6d4" label="Concentrate"   sublabel="On-time" />
          </div>
        </div>
      </motion.div>

      {/* Charts section */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', padding: isMobile ? '18px 14px' : '22px 26px' }}>
        {/* Header with dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedDay ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ListChecks size={15} color="#a855f7" />Day Detail</span> : 'Daily Activity'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {selectedDay ? `Tasks on ${fmtDate(parseISO(selectedDay), 'MMMM d, yyyy')}` : `${currentRange.label.toLowerCase()} · task creation & completion`}
            </div>
          </div>

          {/* Dropdown trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <Calendar size={12} color="#a855f7" />
              {selectedLabel}
              <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.18 }}><ChevronDown size={12} /></motion.div>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 3 }} transition={{ duration: 0.16 }}
                  style={{ position: 'absolute', top: '108%', right: 0, zIndex: 50, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 5, minWidth: 195, maxHeight: 320, overflowY: 'auto', boxShadow: '0 18px 36px var(--shadow)' }}
                >
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', padding: '3px 9px 5px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Range</div>
                  {RANGES.map(r => (
                    <button key={r.id} onClick={() => handleSelect({ type: 'range', ...r })}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 11px', borderRadius: 7, border: 'none', background: rangeId === r.id && !selectedDay ? 'rgba(124,58,237,0.18)' : 'transparent', color: rangeId === r.id && !selectedDay ? '#a855f7' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: rangeId === r.id && !selectedDay ? 600 : 400 }}>
                      {r.label}
                    </button>
                  ))}
                  {availDates.length > 0 && (
                    <>
                      <div style={{ height: 1, background: 'var(--border)', margin: '5px 0' }} />
                      <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', padding: '3px 9px 5px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Browse a day</div>
                      {availDates.slice(0, 30).map(d => (
                        <button key={d} onClick={() => handleSelect({ type: 'day', id: d })}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '7px 11px', borderRadius: 7, border: 'none', background: selectedDay === d ? 'rgba(124,58,237,0.18)' : 'transparent', color: selectedDay === d ? '#a855f7' : 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>
                          <span>{fmtDate(parseISO(d), 'EEE, MMM d yyyy')}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{allTasks.filter(t => t.createdAt && fmtDate(parseISO(t.createdAt), 'yyyy-MM-dd') === d).length}</span>
                        </button>
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {dropdownOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setDropdownOpen(false)} />}
          </div>
        </div>

        {/* Chart or day detail */}
        <AnimatePresence mode="wait">
          {selectedDay ? (
            <DayDetail key={`day-${selectedDay}`} dayData={{ date: selectedDay }} allTasks={allTasks} />
          ) : (
            <motion.div key={`range-${rangeId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              <div className="chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total"     name="Total"     stroke="#7c3aed" strokeWidth={2} fill="url(#g1)" dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#g2)" dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Accuracy bar chart (range mode only) */}
      <AnimatePresence>
        {!selectedDay && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.05 }}
            style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', padding: isMobile ? '18px 14px' : '22px 26px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Daily Accuracy %</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>How accurate you were each day ({currentRange.label.toLowerCase()})</div>
            </div>
            <div className="chart-bar">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="accuracy" name="Accuracy" fill="url(#bg)" radius={[5, 5, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category + Priority row */}
      <div className="cat-pri-row">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          style={{ flex: 2, minWidth: 240, background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', padding: isMobile ? '18px 14px' : '22px 26px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>By Category</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>All-time completion rate</div>
          {stats.categoryData.length === 0
            ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.categoryData.map(cat => {
                const ci = CATEGORIES.find(c => c.id === cat.name) || { color: '#a855f7', icon: '📋', label: cat.name };
                return (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>{ci.icon}</span><span style={{ fontWeight: 500 }}>{ci.label}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{cat.completed}/{cat.total}</span>
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: ci.color }}>{cat.rate}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${cat.rate}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                        style={{ height: '100%', borderRadius: 2, background: ci.color, boxShadow: `0 0 5px ${ci.color}55` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          style={{ flex: 1, minWidth: 200, background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', padding: isMobile ? '18px 14px' : '22px 26px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Priority Mix</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>All-time distribution</div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={stats.priorityData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value" animationBegin={300} animationDuration={900}>
                {stats.priorityData.filter(d => d.value > 0).map((e, i) => (
                  <Cell key={i} fill={e.color} stroke="none" style={{ filter: `drop-shadow(0 0 5px ${e.color}55)` }} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
            {stats.priorityData.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Export + Danger zone */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        style={{ borderTop: '1px solid var(--border)', paddingTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Export Data</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Download a backup of all your tasks</div>
        </div>
        <div className="export-row">
          <button
            onClick={() => exportJSON(todos, history)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--surface-2)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
          >
            <Download size={12} /> Export JSON
          </button>
          <button
            onClick={() => exportCSV(todos, history)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--surface-2)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
          >
            <Download size={12} /> Export CSV
          </button>
          {history.length > 0 && <ClearHistoryButton onClearHistory={onClearHistory} />}
        </div>
      </motion.div>
    </div>
  );
}
