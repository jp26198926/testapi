export type ExportColumn = {
  key: string;
  label: string;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV<T extends Record<string, unknown>>(
  columns: ExportColumn[],
  data: T[],
  filename: string
) {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val == null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export function exportToExcel<T extends Record<string, unknown>>(
  columns: ExportColumn[],
  data: T[],
  filename: string
) {
  // Dynamic import to avoid SSR issues
  import("xlsx").then((XLSX) => {
    const worksheetData = [
      columns.map((c) => c.label),
      ...data.map((row) => columns.map((c) => row[c.key] ?? "")),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, filename);
  });
}
