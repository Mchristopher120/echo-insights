import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameWeek, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Entry {
  id: string;
  audio_url: string;
  duration: number;
  created_at: string;
  insights?: string | null;
  insights_audio_url?: string | null;
  user_id: string;
}

export interface GroupedEntries {
  [key: string]: {
    label: string;
    entries: Entry[];
  };
}

export const groupEntriesByMonth = (entries: Entry[]): GroupedEntries => {
  const grouped: GroupedEntries = {};

  entries.forEach((entry) => {
    const date = new Date(entry.created_at);
    const monthKey = format(date, 'yyyy-MM', { locale: ptBR });
    const monthLabel = format(date, "MMMM 'de' yyyy", { locale: ptBR });

    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        entries: [],
      };
    }

    grouped[monthKey].entries.push(entry);
  });

  return grouped;
};

export const groupEntriesByWeek = (entries: Entry[]): GroupedEntries => {
  const grouped: GroupedEntries = {};

  entries.forEach((entry) => {
    const date = new Date(entry.created_at);
    const weekStart = startOfWeek(date, { locale: ptBR });
    const weekEnd = endOfWeek(date, { locale: ptBR });
    const weekKey = format(weekStart, 'yyyy-ww', { locale: ptBR });
    const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`;

    if (!grouped[weekKey]) {
      grouped[weekKey] = {
        label: weekLabel,
        entries: [],
      };
    }

    grouped[weekKey].entries.push(entry);
  });

  return grouped;
};
