"use client";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  loading?: boolean;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  onExportCSV,
  onExportExcel,
  loading,
}: DataTableProps<T>) {
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {total > 0
            ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total} records`
            : "No records"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            disabled={total === 0}
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Export CSV
          </button>
          <button
            onClick={onExportExcel}
            disabled={total === 0}
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm text-zinc-500">
            Per page:
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="ml-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Prev
            </button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
