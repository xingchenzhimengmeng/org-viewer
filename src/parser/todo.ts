/**
 * Org-mode TODO keyword scanner and state manager.
 */

export interface TodoConfig {
  activeStates: Set<string>;
  doneStates: Set<string>;
  allStates: Set<string>;
}

const DEFAULT_ACTIVE = ['TODO', 'NEXT', 'STARTED', 'WAITING', 'HOLD'];
const DEFAULT_DONE = ['DONE', 'CANCELLED', 'CANCELED'];

export function parseTodoKeywords(orgText: string): TodoConfig {
  const activeStates = new Set<string>();
  const doneStates = new Set<string>();

  // Look for #+TODO:, #+SEQ_TODO:, #+TYP_TODO:
  const todoRegex = /^[ \t]*#\+(?:TODO|SEQ_TODO|TYP_TODO):[ \t]*(.+)$/gim;
  let match: RegExpExecArray | null;
  let foundCustom = false;

  while ((match = todoRegex.exec(orgText)) !== null) {
    foundCustom = true;
    const line = match[1].trim();
    // In Org-mode, multiple state sequences can be separated by '|'
    const parts = line.split('|');
    const beforePipe = parts[0] || '';
    const afterPipe = parts[1] || '';

    // Extract words, removing hotkey shortcuts like (t) or (w@)
    const cleanWords = (str: string) =>
      str
        .split(/\s+/)
        .map(w => w.replace(/\([^)]*\)/g, '').trim())
        .filter(w => w.length > 0 && /^[A-Z0-9_\-]+$/i.test(w));

    cleanWords(beforePipe).forEach(k => activeStates.add(k));
    cleanWords(afterPipe).forEach(k => doneStates.add(k));
  }

  if (!foundCustom || (activeStates.size === 0 && doneStates.size === 0)) {
    DEFAULT_ACTIVE.forEach(k => activeStates.add(k));
    DEFAULT_DONE.forEach(k => doneStates.add(k));
  }

  const allStates = new Set<string>([...activeStates, ...doneStates]);

  return { activeStates, doneStates, allStates };
}

export function checkTodoKeyword(
  word: string,
  config: TodoConfig
): { isTodo: boolean; isDone: boolean; state: string } {
  const upper = word.toUpperCase();
  if (config.doneStates.has(upper)) {
    return { isTodo: true, isDone: true, state: upper };
  }
  if (config.activeStates.has(upper)) {
    return { isTodo: true, isDone: false, state: upper };
  }
  return { isTodo: false, isDone: false, state: '' };
}