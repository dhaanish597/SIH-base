'use client';

import { useState } from 'react';
import { Copy, Check, Shield } from 'lucide-react';

type Credential = { label: string; value: string };

type Props = {
  title: string;
  credentials: Credential[];
  note?: string;
};

export default function CredentialTicket({ title, credentials, note }: Props) {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    const text = credentials.map((c) => `${c.label}: ${c.value}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-950/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">{title}</p>
        </div>
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-100 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/20"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy all'}</span>
        </button>
      </div>
      <div className="space-y-2">
        {credentials.map((c) => (
          <div key={c.label} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2.5">
            <span className="text-xs text-gray-400 w-24 shrink-0">{c.label}</span>
            <span className="font-mono text-sm font-bold text-white tracking-wider">{c.value}</span>
          </div>
        ))}
      </div>
      {note && (
        <p className="text-xs text-amber-400/80 flex items-start gap-1.5">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{note}</span>
        </p>
      )}
    </div>
  );
}
