import { useSettings } from '../../app/settings';
import { Segmented, Toggle, PanelSection } from '../ui/Controls';

/** Compact preferences popover — no giant settings page. */
export function SettingsPanel() {
  const { settings, update } = useSettings();
  return (
    <div className="panel-body">
      <PanelSection title="Page width">
        <Segmented
          label="Page width"
          value={settings.width}
          onChange={(width) => update({ width })}
          options={[
            { value: 'narrow', label: 'Narrow' },
            { value: 'normal', label: 'Normal' },
            { value: 'wide', label: 'Wide' },
          ]}
        />
      </PanelSection>
      <PanelSection title="Text size">
        <Segmented
          label="Text size"
          value={settings.textSize}
          onChange={(textSize) => update({ textSize })}
          options={[
            { value: 'small', label: <span style={{ fontSize: 12 }}>Aa</span>, title: 'Small' },
            { value: 'medium', label: <span style={{ fontSize: 14 }}>Aa</span>, title: 'Medium' },
            { value: 'large', label: <span style={{ fontSize: 16 }}>Aa</span>, title: 'Large' },
          ]}
        />
      </PanelSection>
      <PanelSection title="Line height">
        <Segmented
          label="Line height"
          value={settings.lineHeight}
          onChange={(lineHeight) => update({ lineHeight })}
          options={[
            { value: 'snug', label: 'Snug' },
            { value: 'cozy', label: 'Cozy' },
            { value: 'airy', label: 'Airy' },
          ]}
        />
      </PanelSection>
      <PanelSection title="Date">
        <Segmented
          label="Date display"
          value={settings.dateStyle}
          onChange={(dateStyle) => update({ dateStyle })}
          options={[
            { value: 'off', label: 'Off' },
            { value: 'english', label: 'Oct 6' },
            { value: 'japanese', label: '10月6日' },
          ]}
        />
      </PanelSection>
      <div className="menu-divider" />
      <Toggle
        label="Reduce visual effects"
        hint="no petals, sparkles or flourishes"
        checked={settings.reduceEffects}
        onChange={(reduceEffects) => update({ reduceEffects })}
      />
      <p className="panel-foot">Preferences live only in this tab, just like your writing.</p>
    </div>
  );
}
