// ══════════════════════════════════════════
// components/layout/AppErrorBoundary.tsx
// Dipecah dari AppShell.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { Component } from 'react';
import { RotateCcw } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

// ─── Static i18n helper untuk class component (tidak bisa pakai hook) ──────────
function tStatic(key: string): string {
  if (typeof window === 'undefined') return key;
  try {
    const s = localStorage.getItem('wp_settings');
    const lang = s ? JSON.parse(s)?.language : 'id';
    const msgs: Record<string, Record<string, string>> = {
      en: {
        'app.errorTitle': 'Oops, something went wrong',
        'app.errorDesc':  'The app encountered an unexpected error. Try reloading the page.',
        'app.reload':     'Reload',
      },
      id: {
        'app.errorTitle': 'Oops, ada yang error',
        'app.errorDesc':  'Aplikasi mengalami error tidak terduga. Coba muat ulang halaman.',
        'app.reload':     'Muat Ulang',
      },
    };
    return msgs[lang]?.[key] ?? msgs['id'][key] ?? key;
  } catch { return key; }
}

interface EBState { hasError: boolean; error?: Error }

export default class AppErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[WiFi Pay] Unhandled error:', error, info);
    // task 3.03: kirim ke Sentry di production
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          height:'100vh', gap:16, padding:24, background:'var(--bg)', textAlign:'center',
        }}>
          <div style={{
            width:56, height:56, borderRadius:'var(--r-lg)',
            background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <RotateCcw size={24} color="var(--c-belum)" strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:17, color:'var(--txt)' }}>
            {tStatic('app.errorTitle')}
          </div>
          <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:13, color:'var(--txt2)', maxWidth:280, lineHeight:1.55 }}>
            {tStatic('app.errorDesc')}
          </div>
          {this.state.error && (
            <div style={{
              fontFamily:"var(--font-mono),monospace", fontSize:10, color:'var(--txt4)',
              background:'var(--bg3)', border:'1px solid var(--border)',
              borderRadius:'var(--r-sm)', padding:'8px 12px',
              maxWidth:300, wordBreak:'break-all', textAlign:'left',
            }}>
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background:'var(--zc)', color:'#fff', border:'none',
              borderRadius:'var(--r-md)', padding:'10px 24px',
              fontFamily:"var(--font-sans),sans-serif", fontWeight:600,
              fontSize:13, cursor:'pointer',
            }}
          >
            {tStatic('app.reload')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
