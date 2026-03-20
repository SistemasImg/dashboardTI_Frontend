import * as XLSX from 'xlsx';

export function assignmentsReport(
  data,
  fileName = `assignments_${new Date().toISOString().slice(0, 10)}.xlsx`
) {
  if (!Array.isArray(data) || data.length === 0) return;

  const formattedData = data.map((row) => ({
    'Case Number': row.case_number,
    Agent: row.agent?.fullname ?? 'N/A',
    'Call Center': row.agent?.callCenter?.name ?? 'N/A',
    'Assigned By': row.createdBy?.fullname ?? 'N/A',
    Attempts: row.attempts,
    'Assigned Date': row.assigned_at
      ? new Date(row.assigned_at).toLocaleDateString('es-PE')
      : 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Assignments');

  XLSX.writeFile(workbook, fileName);
}
