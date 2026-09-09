export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    case 'partially_paid':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
    case 'overdue':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    case 'draft':
      return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    case 'active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    case 'inactive':
      return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

export function formatStatusLabel(status: string): string {
  switch (status) {
    case 'partially_paid':
      return 'Partially Paid';
    case 'tax_invoice':
      return 'Tax Invoice';
    case 'commercial_bill':
      return 'Commercial Bill';
    case 'quotation':
      return 'Quotation';
    case 'delivery_challan':
      return 'Delivery Challan';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
