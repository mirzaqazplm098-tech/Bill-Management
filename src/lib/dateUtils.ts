import { DateFilterType, DateFilterRange } from '../types';

export const DateUtils = {
  getRangeDates(filter: DateFilterRange): { start: Date; end: Date } | null {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter.type) {
      case 'today': {
        const start = new Date(today);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case 'this_week': {
        const day = today.getDay(); // 0 is Sunday
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const start = new Date(today.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
      }
      case 'last_month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { start, end };
      }
      case 'this_year': {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start, end };
      }
      case 'custom': {
        if (!filter.startDate) return null;
        const start = new Date(filter.startDate);
        start.setHours(0, 0, 0, 0);
        const end = filter.endDate ? new Date(filter.endDate) : new Date();
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case 'all':
      default:
        return null;
    }
  },

  isDateInRange(dateString: string, filter: DateFilterRange): boolean {
    if (filter.type === 'all') return true;
    const range = this.getRangeDates(filter);
    if (!range) return true;
    const d = new Date(dateString);
    return d >= range.start && d <= range.end;
  },

  formatFilterLabel(filter: DateFilterRange): string {
    switch (filter.type) {
      case 'today':
        return 'Today';
      case 'this_week':
        return 'This Week';
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'this_year':
        return 'This Year';
      case 'custom':
        return filter.startDate ? `${filter.startDate} to ${filter.endDate || 'Now'}` : 'Custom Range';
      case 'all':
      default:
        return 'All Time';
    }
  },
};
