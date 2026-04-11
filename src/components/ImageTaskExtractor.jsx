import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, X, Upload, CheckSquare, Square,
  Plus, AlertCircle, ScanLine,
} from 'lucide-react';
import { extractTasksFromImage } from '../utils/imageToTasks';
import { CATEGORIES } from '../utils/analytics';

export default function ImageTaskExtractor({ onAdd }) {
  const [open,     setOpen]     = useState(false);
  const [image,    setImage]    = useState(null);   // { dataUrl, name }
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [tasks,    setTasks]    = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [category, setCategory] = useState('personal');
  const [error,    setError]    = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  /* ── helpers ── */
  const reset = () => {
    setImage(null); setTasks([]); setSelected(new Set());
    setError(''); setProgress(0); setLoading(false);
  };
  const close = () => { setOpen(false); reset(); };

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image (JPG, PNG, WEBP …)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage({ dataUrl: e.target.result, name: file.name });
      setTasks([]); setSelected(new Set()); setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const runOCR = async () => {
    if (!image) return;
    setLoading(true); setError(''); setProgress(0);
    try {
      const found = await extractTasksFromImage(image.dataUrl, setProgress);
      setTasks(found);
      setSelected(new Set(found.map((_, i) => i)));
      if (found.length === 0)
        setError('No text found. Try a clearer / higher-contrast image.');
    } catch (err) {
      setError('OCR failed — ' + (err.message || 'unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const handleAdd = () => {
    tasks.filter((_, i) => selected.has(i))
         .forEach(text => onAdd({ text, category, priority: 'medium' }));
    close();
  };

  /* ── shared styles ── */
  const card = {
    background: 'var(--bg-card)', borderRadius: 20,
    border: '1px solid rgba(124,58,237,0.2)',
    boxShadow: '0 0 60px rgba(124,58,237,0.12), 0 24px 48px var(--shadow)',
    width: '100%', maxWidth: 480, maxHeight: '90vh',
    overflowY: 'auto', padding: 24,
  };

  return (
    <>
      {/* ── trigger button ── */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        title="Scan task list from image"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '0 16px', borderRadius: 14, width: '100%', height: '56px',
          border: '1.5px solid rgba(124,58,237,0.3)',
          background: 'rgba(124,58,237,0.07)',
          color: '#a855f7', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        <Camera size={14} /> Scan Image
      </motion.button>

      {/* ── modal overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && close()}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={card}
            >
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ScanLine size={15} color="white" />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Scan Tasks from Image
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 38 }}>
                    Upload a photo of your task list — works offline, no API key needed
                  </p>
                </div>
                <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0 }}>
                  <X size={18} />
                </button>
              </div>

              {/* drop zone (shown until image chosen) */}
              {!image ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? '#a855f7' : 'rgba(124,58,237,0.3)'}`,
                    borderRadius: 14, padding: '36px 16px', marginBottom: 16,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: dragging ? 'rgba(124,58,237,0.06)' : 'transparent',
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={22} color="#a855f7" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Drop image here or click to upload
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      JPG · PNG · WEBP · GIF · BMP
                    </div>
                  </div>
                  <input
                    ref={fileRef} type="file" accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => processFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {/* image preview */}
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 12 }}>
                    <img
                      src={image.dataUrl} alt="preview"
                      style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', background: 'var(--surface-1)' }}
                    />
                    <button
                      onClick={reset}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* scan button + progress (only before tasks appear) */}
                  {tasks.length === 0 && (
                    <>
                      {loading ? (
                        <div style={{ marginBottom: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>Reading text from image…</span>
                            <span>{progress}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
                            <motion.div
                              style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }}
                              animate={{ width: `${progress}%` }}
                              transition={{ ease: 'linear' }}
                            />
                          </div>
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.01, boxShadow: '0 0 22px rgba(124,58,237,0.35)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={runOCR}
                          style={{
                            width: '100%', padding: '11px', borderRadius: 11, border: 'none',
                            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}
                        >
                          <ScanLine size={15} /> Scan for Tasks
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#ef4444' }}
                >
                  <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </motion.div>
              )}

              {/* extracted tasks list */}
              <AnimatePresence>
                {tasks.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {/* header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''} found — select to add
                      </span>
                      <button
                        onClick={() =>
                          setSelected(
                            selected.size === tasks.length
                              ? new Set()
                              : new Set(tasks.map((_, i) => i))
                          )
                        }
                        style={{ background: 'none', border: 'none', fontSize: 11, color: '#a855f7', cursor: 'pointer', fontWeight: 500 }}
                      >
                        {selected.size === tasks.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>

                    {/* task checkboxes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, maxHeight: 220, overflowY: 'auto' }}>
                      {tasks.map((task, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => toggle(i)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                            transition: 'all 0.15s',
                            background: selected.has(i) ? 'rgba(124,58,237,0.08)' : 'var(--surface-1)',
                            border: `1px solid ${selected.has(i) ? 'rgba(124,58,237,0.25)' : 'var(--border)'}`,
                          }}
                        >
                          {selected.has(i)
                            ? <CheckSquare size={15} color="#a855f7" style={{ flexShrink: 0 }} />
                            : <Square size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          }
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{task}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* category picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>Add to:</span>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 8, padding: '5px 9px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* add button */}
                    <motion.button
                      whileHover={selected.size > 0 ? { scale: 1.01, boxShadow: '0 0 22px rgba(124,58,237,0.35)' } : {}}
                      whileTap={selected.size > 0 ? { scale: 0.98 } : {}}
                      onClick={handleAdd}
                      disabled={selected.size === 0}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 11, border: 'none',
                        background: selected.size > 0 ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'var(--surface-2)',
                        color: selected.size > 0 ? 'white' : 'var(--text-muted)',
                        fontSize: 13, fontWeight: 600,
                        cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <Plus size={14} />
                      Add {selected.size} Task{selected.size !== 1 ? 's' : ''}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
