import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Minimize2 } from 'lucide-react';
import { useSettings } from './settings';
import { useUI } from './ui';
import { COPY } from './copy';
import { applyTheme, getTheme } from '../themes/themes';
import { ensureFontLoaded, getFont } from '../fonts/fonts';
import { DEFAULT_PRINT_OPTIONS, type PrintOptions } from '../export/printDocument';
import { useKakuEditor } from '../editor/useKakuEditor';
import { Paper } from '../editor/Paper';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import { useWritingTimer } from '../hooks/useWritingTimer';
import { useTypewriterSound } from '../hooks/useTypewriterSound';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { useExporter } from '../hooks/useExporter';
import { formatDate } from '../utils/date';
import { MOD, shortcut } from '../utils/platform';
import { Header } from '../components/Header/Header';
import { Toolbar } from '../components/Toolbar/Toolbar';
import { FloatingToolbar } from '../components/FloatingToolbar/FloatingToolbar';
import { LinkEditor } from '../components/LinkEditor/LinkEditor';
import { MoodPanel } from '../components/MoodPanel/MoodPanel';
import { ExportMenu } from '../components/ExportMenu/ExportMenu';
import { StatusBar } from '../components/StatusBar/StatusBar';
import { WritingGoal } from '../components/WritingGoal/WritingGoal';
import { WritingTimer } from '../components/WritingTimer/WritingTimer';
import { Atmosphere } from '../components/Atmosphere/Atmosphere';
import { SlashMenu } from '../components/SlashMenu/SlashMenu';
import { CommandPalette } from '../components/CommandPalette/CommandPalette';
import { PrivacyNotice } from '../components/PrivacyNotice/PrivacyNotice';
import { Toasts } from '../components/Toasts/Toasts';
import { TooltipLayer } from '../components/ui/TooltipLayer';
import { buildCommands } from './commands';

const NUDGE_WORDS = 300;

export default function App() {
  const { settings, update, toggle } = useSettings();
  const { openPanel, setOpenPanel, togglePanel, closePanel, notify } = useUI();
  const reducedMotion = useReducedMotion();

  // Writing + export state. All of it is in-memory and ends with the tab.
  const [title, setTitle] = useState('Untitled');
  const [goal, setGoal] = useState<number | null>(null);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({ ...DEFAULT_PRINT_OPTIONS, paper: 'plain' });
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [flower, setFlower] = useState(false);
  const timer = useWritingTimer();
  const playKey = useTypewriterSound(settings.sound);

  const editorRef = useRef<Editor | null>(null);

  const onModK = useCallback(() => {
    const ed = editorRef.current;
    if (ed && (!ed.state.selection.empty || ed.isActive('link'))) setOpenPanel('link');
    else setOpenPanel('palette');
  }, [setOpenPanel]);

  const onKawaii = useCallback(() => {
    setFlower(true);
    window.setTimeout(() => setFlower(false), 2400);
  }, []);

  const { editor, stats, slash, setSlashIndex, runSlash } = useKakuEditor({
    onModK,
    onKeyDown: playKey,
    onKawaii,
    typewriterMode: settings.typewriterMode,
  });
  editorRef.current = editor;

  const dateLabel = formatDate(new Date(), settings.dateStyle);
  const exporter = useExporter({
    editor,
    title,
    fontFamily: getFont(settings.fontId).family,
    dateLabel: dateLabel || formatDate(new Date(), 'english'),
    printOptions: { ...printOptions, paper: settings.paper },
  });

  useBeforeUnload(stats.words > 0);

  useEffect(() => {
    if (stats.words > 0) setHasTyped(true);
  }, [stats.words]);

  // Theme: swap CSS variables with a short crossfade.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-fade');
    applyTheme(getTheme(settings.themeId));
    const id = window.setTimeout(() => root.classList.remove('theme-fade'), 520);
    return () => window.clearTimeout(id);
  }, [settings.themeId]);

  useEffect(() => {
    void ensureFontLoaded(settings.fontId);
    // Exposed globally so menus (rendered outside the paper) can preview it.
    document.documentElement.style.setProperty('--doc-font', getFont(settings.fontId).family);
  }, [settings.fontId]);

  // Global shortcuts. Capture phase so Mod+Shift+S beats the editor keymap.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && event.shiftKey && key === 's') {
        event.preventDefault();
        event.stopPropagation();
        togglePanel('export');
      } else if (mod && event.shiftKey && key === 'f') {
        event.preventDefault();
        toggle('focusMode');
      } else if (mod && event.shiftKey && key === 'p') {
        event.preventDefault();
        togglePanel('palette');
      } else if (mod && !event.shiftKey && key === 'k' && !editor.view.dom.contains(event.target as Node)) {
        event.preventDefault();
        togglePanel('palette');
      } else if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('.slash-menu')) {
        if (openPanel) {
          closePanel();
          if (openPanel === 'link') editor.commands.focus();
        } else if (settings.focusMode) {
          update({ focusMode: false });
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [editor, openPanel, closePanel, togglePanel, toggle, update, settings.focusMode]);

  const logoClicks = useRef<number[]>([]);
  const onLogoClick = () => {
    const now = Date.now();
    logoClicks.current = [...logoClicks.current.filter((t) => now - t < 2000), now];
    if (logoClicks.current.length >= 5) {
      logoClicks.current = [];
      notify(COPY.easterEgg);
    }
  };

  const commands = useMemo(
    () =>
      buildCommands({
        editor,
        exporter,
        update,
        toggle,
        openPanel: setOpenPanel,
        startTimer: timer.start,
      }),
    [editor, exporter, update, toggle, setOpenPanel, timer.start],
  );

  const effectsOn = !settings.reduceEffects && !reducedMotion;
  const showNudge = stats.words >= NUDGE_WORDS && !nudgeDismissed && !settings.focusMode;

  const appClasses = ['app', settings.focusMode ? 'is-focus' : '', settings.reduceEffects ? 'reduce-effects' : ''].filter(Boolean).join(' ');

  return (
    <div className={appClasses}>
      <a className="skip-link" href="#kaku-editor" onClick={(e) => (e.preventDefault(), editor.commands.focus())}>
        Skip to writing
      </a>
      <Atmosphere petals={effectsOn && settings.petals} sparkles={effectsOn && settings.sparkles} />

      <div className="chrome">
        <Header
          title={title}
          onTitleChange={setTitle}
          onLogoClick={onLogoClick}
          mood={<MoodPanel goal={goal} onGoalChange={setGoal} timer={timer} editor={editor} />}
          exportMenu={
            <ExportMenu
              exporter={exporter}
              printOptions={{ ...printOptions, paper: settings.paper }}
              onPrintOptionsChange={(patch) => setPrintOptions((o) => ({ ...o, ...patch }))}
            />
          }
        />
        <div className="toolbar-slot" aria-hidden={settings.focusMode}>
          {!settings.focusMode && <Toolbar editor={editor} onLink={() => setOpenPanel('link')} />}
        </div>
      </div>

      {settings.focusMode && (
        <button type="button" className="focus-exit" onClick={() => update({ focusMode: false })} data-tip="Exit focus" data-kbd="Esc">
          <Minimize2 size={13} strokeWidth={2} aria-hidden="true" />
          <span>exit focus</span>
        </button>
      )}

      <main className="desk" id="kaku-editor">
        {noticeOpen && !settings.focusMode && <PrivacyNotice onDismiss={() => setNoticeOpen(false)} />}
        <Paper editor={editor} settings={settings} title={title} onTitleChange={setTitle} dateLabel={dateLabel} />
        <p className={`welcome-hint ${hasTyped || settings.focusMode ? 'is-hidden' : ''}`} aria-hidden={hasTyped}>
          <kbd>{MOD}</kbd>
          <kbd>B</kbd> bold <span className="hint-dot">·</span> <kbd>{MOD}</kbd>
          <kbd>I</kbd> italic <span className="hint-dot">·</span> <kbd>/</kbd> commands <span className="hint-dot">·</span>{' '}
          <kbd>{shortcut('mod+k')}</kbd> palette
        </p>
      </main>

      <StatusBar
        stats={stats}
        showNudge={showNudge}
        onNudgeExport={() => setOpenPanel('export')}
        onNudgeDismiss={() => setNudgeDismissed(true)}
        flower={flower}
        goal={goal ? <WritingGoal words={stats.words} goal={goal} onClear={() => setGoal(null)} celebrate={effectsOn} /> : null}
        timer={<WritingTimer timer={timer} />}
      />

      <FloatingToolbar editor={editor} onLink={() => setOpenPanel('link')} />
      <LinkEditor editor={editor} />
      <SlashMenu editor={editor} slash={slash} onHover={setSlashIndex} onSelect={(item) => runSlash(editor, item)} />
      <CommandPalette open={openPanel === 'palette'} onClose={closePanel} commands={commands} />
      <Toasts />
      <TooltipLayer />
    </div>
  );
}

