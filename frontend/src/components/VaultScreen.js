import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Lock, Plus, Image, FileText, KeyRound, StickyNote, Trash2, X, Eye, EyeOff } from 'lucide-react';
import telemetry from '../services/TelemetryService';

// Hidden Vault / Invisible Folder. Photos, files, notes & passwords are stored inside Digital Mate
// (the app's private store / backend) — NOT in the phone gallery or file manager. Only reachable
// from the owner dashboard, which is hidden during Trap/Decoy mode (emergency auto-lock).
const KIND_ICON = { photo: Image, video: Image, file: FileText, document: FileText, note: StickyNote, password: KeyRound };

const VaultScreen = () => {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState('vault'); // vault | review

  const load = useCallback(async () => {
    setLoading(true);
    const r = await telemetry.vaultList(folder);
    setItems(r.items || []);
    setLoading(false);
  }, [folder]);
  useEffect(() => { load(); }, [load]);

  const open = async (it) => {
    const full = await telemetry.vaultItem(it.id);
    if (full) setViewing(full);
  };
  const remove = async (it) => {
    await telemetry.vaultDelete(it.id);
    toast.success(folder === 'review' ? 'Rejected' : 'Removed from vault');
    setViewing(null); load();
  };
  const approve = async (it) => {
    await telemetry.vaultApprove(it.id);
    toast.success('Approved — moved to vault');
    load();
  };

  return (
    <div className="p-5 space-y-4 pb-28" data-testid="vault-screen">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Lock className="text-fuchsia-400" size={26} /> Hidden Vault</h2>
        <p className="text-slate-400 text-sm mt-1">Private photos, files, notes &amp; passwords — hidden from the phone gallery.</p>
      </div>

      <div className="flex gap-2" data-testid="vault-folder-toggle">
        <button onClick={() => setFolder('vault')} data-testid="folder-vault" className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${folder === 'vault' ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400' : 'border-slate-700 text-slate-400'}`}>Vault</button>
        <button onClick={() => setFolder('review')} data-testid="folder-review" className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${folder === 'review' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400'}`}>Review folder</button>
      </div>

      {folder === 'vault' && (
        <button onClick={() => setAdding(true)} data-testid="hide-something-btn"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90">
          <Plus size={20} /> Hide something
        </button>
      )}
      {folder === 'review' && (
        <p className="text-slate-500 text-xs">Items here are waiting for your review. Approve to move them into the Vault, or reject to remove. Nothing is ever auto-deleted.</p>
      )}

      {loading ? <p className="text-slate-500 text-sm">Opening…</p> : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-8 text-center" data-testid="vault-empty">
          <img src={`${process.env.PUBLIC_URL}/brand/shield-emblem.png`} alt="" className="w-24 h-24 object-contain mx-auto mb-3 opacity-90" />
          <p className="text-white font-semibold">{folder === 'review' ? 'Nothing to review' : 'Your vault is empty'}</p>
          <p className="text-slate-400 text-sm mt-1">{folder === 'review' ? 'Items you flag for review will appear here.' : 'Tap "Hide something" to add private items.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3" data-testid="vault-items">
          {items.map((it) => { const Icon = KIND_ICON[it.kind] || FileText; return (
            <div key={it.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4" data-testid="vault-item">
              <button onClick={() => open(it)} className="text-left w-full">
                <Icon className="text-fuchsia-400 mb-2" size={22} />
                <p className="text-white text-sm font-medium truncate">{it.title}</p>
                <p className="text-slate-500 text-xs capitalize">{it.kind}</p>
              </button>
              {folder === 'review' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => approve(it)} data-testid="review-approve" className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Approve</button>
                  <button onClick={() => remove(it)} data-testid="review-reject" className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">Reject</button>
                </div>
              )}
            </div>
          ); })}
        </div>
      )}

      {adding && <AddModal onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load(); }} />}
      {viewing && <ViewModal item={viewing} onClose={() => setViewing(null)} onDelete={() => remove(viewing)} />}
    </div>
  );
};

const AddModal = ({ onClose, onAdded }) => {
  const [kind, setKind] = useState('photo');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [fileData, setFileData] = useState(null);
  const [busy, setBusy] = useState(false);

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 8_000_000) return toast.error('Max ~8MB. Large videos need cloud storage (coming with native).');
    setTitle((t) => t || f.name);
    const reader = new FileReader();
    reader.onload = () => setFileData(reader.result);
    reader.readAsDataURL(f);
  };

  const save = async () => {
    const isText = kind === 'note' || kind === 'password';
    const content = isText ? text : fileData;
    if (!title.trim()) return toast.error('Add a title');
    if (!content) return toast.error(isText ? 'Enter the text to hide' : 'Choose a file');
    setBusy(true);
    try { await telemetry.vaultAdd({ kind, title: title.trim(), content }); toast.success('Hidden in your vault'); onAdded(); }
    catch (e) { toast.error(e?.response?.status === 413 ? 'File too large' : 'Could not save'); }
    setBusy(false);
  };

  const KINDS = [
    { id: 'photo', label: 'Photo', icon: Image }, { id: 'file', label: 'File', icon: FileText },
    { id: 'note', label: 'Note', icon: StickyNote }, { id: 'password', label: 'Password', icon: KeyRound },
  ];
  const isText = kind === 'note' || kind === 'password';
  return (
    <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/80 p-4" data-testid="vault-add-modal">
      <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3"><h3 className="text-white font-bold">Hide something</h3><button onClick={onClose} className="text-slate-400"><X size={20} /></button></div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {KINDS.map((k) => { const I = k.icon; const sel = kind === k.id; return (
            <button key={k.id} onClick={() => { setKind(k.id); setFileData(null); }} data-testid={`vault-kind-${k.id}`}
              className={`py-3 rounded-xl border flex flex-col items-center gap-1 ${sel ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400' : 'border-slate-700 bg-[#0e1626] text-slate-300'}`}>
              <I size={18} /><span className="text-[10px]">{k.label}</span>
            </button>
          ); })}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" data-testid="vault-title"
          className="w-full px-4 py-3 mb-3 rounded-xl bg-[#0e1626] border border-slate-600 text-white outline-none focus:border-fuchsia-500" />
        {isText ? (
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === 'password' ? 'Password / secret' : 'Your private note'} data-testid="vault-text"
            rows={kind === 'password' ? 2 : 4} className="w-full px-4 py-3 mb-3 rounded-xl bg-[#0e1626] border border-slate-600 text-white outline-none focus:border-fuchsia-500" />
        ) : (
          <input type="file" accept={kind === 'photo' ? 'image/*' : '*/*'} onChange={onFile} data-testid="vault-file"
            className="w-full text-slate-300 text-sm mb-3 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-fuchsia-500/20 file:text-fuchsia-300" />
        )}
        <button onClick={save} disabled={busy} data-testid="vault-save" className="w-full py-3 rounded-xl bg-fuchsia-600 text-white font-bold disabled:opacity-50">
          {busy ? 'Hiding…' : 'Hide it'}
        </button>
      </div>
    </div>
  );
};

const ViewModal = ({ item, onClose, onDelete }) => {
  const [reveal, setReveal] = useState(false);
  const isImg = (item.kind === 'photo' || item.kind === 'video') && typeof item.content === 'string' && item.content.startsWith('data:image');
  const isText = item.kind === 'note' || item.kind === 'password';
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 p-4" data-testid="vault-view-modal">
      <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold truncate">{item.title}</h3>
          <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>
        {isImg && <img src={item.content} alt={item.title} className="w-full rounded-lg mb-3" />}
        {isText && (
          <div className="bg-[#0e1626] rounded-lg p-3 mb-3 flex items-start justify-between gap-2">
            <p className="text-slate-200 text-sm break-all flex-1">{reveal ? item.content : '••••••••••'}</p>
            <button onClick={() => setReveal((r) => !r)} className="text-slate-400">{reveal ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        )}
        {!isImg && !isText && <p className="text-slate-400 text-sm mb-3">{item.kind} stored securely ({Math.round((item.content?.length || 0) / 1024)} KB).</p>}
        <button onClick={onDelete} data-testid="vault-delete" className="w-full py-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 font-medium flex items-center justify-center gap-2">
          <Trash2 size={16} /> Remove from vault
        </button>
      </div>
    </div>
  );
};

export default VaultScreen;
