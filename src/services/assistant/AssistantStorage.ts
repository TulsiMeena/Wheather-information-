import { AssistantMessage } from '../../types/assistant';

const STORAGE_KEY = 'weather_assistant_history_v1';
const MAX_HISTORY = 20;

export class AssistantStorage {
  static getHistory(): AssistantMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_HISTORY);
      }
      return [];
    } catch {
      return [];
    }
  }

  static saveMessage(message: AssistantMessage): AssistantMessage[] {
    try {
      const current = this.getHistory();
      // Keep unique by id
      const updated = [message, ...current.filter((m) => m.id !== message.id)].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
