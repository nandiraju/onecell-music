import React from 'react';
import { Sparkles, Waves, BarChart2, Atom, Disc, Palette } from 'lucide-react';

export const VISUALIZER_MODE_OPTIONS = [
  { id: 'nebula', label: 'Nebula', icon: Sparkles },
  { id: 'liquid', label: 'Liquid', icon: Waves },
  { id: 'spectrum', label: 'Spectrum', icon: BarChart2 },
  { id: 'orbital', label: 'Orbital', icon: Atom },
  { id: 'radial', label: 'Radial', icon: Disc }
];

export const COLOR_SCHEME_OPTIONS = [
  { id: 'auto', label: 'Auto (per track)', primary: null, secondary: null },
  { id: 'cyan', label: 'Cyberpunk Cyan', primary: '#00f0ff', secondary: '#7000ff' },
  { id: 'magenta', label: 'Magenta Pulse', primary: '#ff007a', secondary: '#7000ff' },
  { id: 'violet', label: 'Violet Dream', primary: '#8b5cf6', secondary: '#00f0ff' },
  { id: 'emerald', label: 'Emerald Flow', primary: '#10b981', secondary: '#00f0ff' },
  { id: 'amber', label: 'Amber Heat', primary: '#f59e0b', secondary: '#ff007a' }
];

export default function SettingsScreen({ settings, onChangeVisualizerMode, onChangeColorScheme }) {
  return (
    <aside className="settings-panel">
      <div className="settings-header">
        <span className="playlist-title">
          <Palette size={16} />
          Settings
        </span>
        <span className="playlist-count">Saved automatically</span>
      </div>

      <div className="settings-body">
        <div className="settings-section">
          <div className="settings-section-title">Default Visualization</div>
          <div className="settings-mode-grid">
            {VISUALIZER_MODE_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`settings-mode-btn ${settings.visualizerMode === id ? 'active' : ''}`}
                onClick={() => onChangeVisualizerMode(id)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Color Scheme</div>
          <div className="settings-scheme-grid">
            {COLOR_SCHEME_OPTIONS.map((scheme) => (
              <button
                key={scheme.id}
                className={`settings-scheme-btn ${settings.colorScheme === scheme.id ? 'active' : ''}`}
                onClick={() => onChangeColorScheme(scheme.id)}
              >
                <span
                  className="settings-scheme-swatch"
                  style={
                    scheme.primary
                      ? { background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})` }
                      : { background: 'conic-gradient(from 0deg, #00f0ff, #ff007a, #8b5cf6, #10b981, #f59e0b, #00f0ff)' }
                  }
                />
                <span>{scheme.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
