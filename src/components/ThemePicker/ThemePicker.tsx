import { useSettings } from '../../app/settings';
import { THEMES } from '../../themes/themes';

/** Small theme cards with three-colour previews. */
export function ThemePicker() {
  const { settings, update } = useSettings();
  return (
    <div className="panel-body">
      <p className="panel-label">Theme</p>
      <div className="theme-grid" role="radiogroup" aria-label="Theme">
        {THEMES.map((theme) => {
          const selected = settings.themeId === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`theme-card ${selected ? 'is-selected' : ''}`}
              onClick={() => update({ themeId: theme.id })}
            >
              <span className="theme-swatches" aria-hidden="true" style={{ background: theme.colors.background }}>
                {theme.preview.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </span>
              <span className="theme-text">
                <span className="theme-name">{theme.name}</span>
                <span className="theme-desc">{theme.description}</span>
              </span>
              {selected && (
                <span className="theme-sparkle" aria-hidden="true">
                  ✦
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
