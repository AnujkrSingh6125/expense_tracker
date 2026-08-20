import { Expense } from '../types';
import { formatDate } from './utils';

export function exportExpensesToCSV(expenses: Expense[], currency: string = '$', fileName = 'expenses-export.csv') {
  if (!expenses || expenses.length === 0) {
    alert('No expenses to export.');
    return;
  }

  const headers = ['Date', 'Category / Domain', 'Description', 'Amount', 'Currency', 'Payment Method', 'ID'];
  
  const rows = expenses.map((exp) => [
    formatDate(exp.expense_date, 'yyyy-MM-dd'),
    `"${(exp.category || '').replace(/"/g, '""')}"`,
    `"${(exp.description || '').replace(/"/g, '""')}"`,
    exp.amount.toFixed(2),
    currency,
    `"${exp.payment_method}"`,
    `"${exp.id}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExpensesToJSON(expenses: Expense[], fileName = 'expenses-export.json') {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(expenses, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
