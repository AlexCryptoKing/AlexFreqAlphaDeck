/**
 * Global keyboard shortcuts hook.
 */

import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toggleTheme } from '../styles/theme';

interface KeyboardShortcutOptions {
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions = {}) {
  const { enabled = true } = options;
  const navigate = useNavigate();
  const location = useLocation();

  // Track 'g' key for navigation shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Theme toggle: Ctrl+Shift+T
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // Quick navigation with 'g' prefix (vim-style)
      // g+d = Go to Dashboard
      // g+s = Go to Settings
      // g+a = Go to Alerts
      // g+c = Go to Compare
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Set up listener for next key
        const handleNextKey = (nextE: KeyboardEvent) => {
          document.removeEventListener('keydown', handleNextKey);

          // Ignore if modifier keys are pressed
          if (nextE.ctrlKey || nextE.metaKey || nextE.altKey) return;

          switch (nextE.key) {
            case 'd':
              nextE.preventDefault();
              if (location.pathname !== '/') navigate('/');
              break;
            case 's':
              nextE.preventDefault();
              if (location.pathname !== '/settings') navigate('/settings');
              break;
            case 'a':
              nextE.preventDefault();
              if (location.pathname !== '/alerts') navigate('/alerts');
              break;
            case 'c':
              nextE.preventDefault();
              if (location.pathname !== '/compare') navigate('/compare');
              break;
          }
        };

        // Listen for the next key for 500ms
        document.addEventListener('keydown', handleNextKey);
        setTimeout(() => {
          document.removeEventListener('keydown', handleNextKey);
        }, 500);
        return;
      }

      // Quick actions
      // ? = Show keyboard shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Dispatch custom event that can be listened to by a help modal
        window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
        return;
      }
    },
    [navigate, location.pathname]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Keyboard shortcuts reference for display in UI.
 */
export const keyboardShortcuts = [
  { keys: ['Ctrl', 'K'], description: 'Search bots' },
  { keys: ['Ctrl', 'Shift', 'T'], description: 'Toggle theme' },
  { keys: ['g', 'd'], description: 'Go to Dashboard' },
  { keys: ['g', 'a'], description: 'Go to Alerts' },
  { keys: ['g', 's'], description: 'Go to Settings' },
  { keys: ['g', 'c'], description: 'Go to Compare' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close dialogs' },
];
