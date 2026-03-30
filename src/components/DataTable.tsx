import { useMemo, useState } from 'react';

type SortDirection = 'asc' | 'desc';

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  align?: 'left' | 'right';
  className?: string;
  /**
   * Custom cell renderer. If not provided, the value at `key` will be rendered.
   */
  render?: (row: T) => React.ReactNode;
  /**
   * Disable sorting for this column.
   */
  sortable?: boolean;
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  /**
   * Keys to use when filtering with the search box.
   * If omitted, all primitive fields will be considered.
   */
  searchableKeys?: (keyof T)[];
  /**
   * Function to extract a unique ID for each row.
   */
  getRowId: (row: T) => string | number;
  /**
   * Optional row click handler.
   */
  onRowClick?: (row: T) => void;
  /**
   * Placeholder text for the search input.
   */
  searchPlaceholder?: string;
  /**
   * Optional title displayed above the table.
   */
  title?: string;
  /**
   * ID of the currently selected row (highlighted).
   */
  selectedRowId?: string | number | null;
  /**
   * Optional default sort key (e.g. "safeNonce").
   */
  initialSortKey?: string | null;
  /**
   * Optional default sort direction for `initialSortKey`.
   */
  initialSortDirection?: SortDirection;
};

const DEFAULT_PAGE_SIZES = [5, 10, 25, 50];

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchableKeys,
  getRowId,
  onRowClick,
  searchPlaceholder = 'Search…',
  title = 'Assets Requests',
  selectedRowId,
  initialSortKey = null,
  initialSortDirection = 'asc',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  const effectiveSearchKeys = useMemo(() => {
    if (searchableKeys && searchableKeys.length > 0) return searchableKeys;
    if (data.length === 0) return [] as (keyof T)[];
    return Object.keys(data[0]) as (keyof T)[];
  }, [data, searchableKeys]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase();
    return data.filter((row) =>
      effectiveSearchKeys.some((key) => {
        const value = row[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, effectiveSearchKeys, search]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const column = columns.find((c) => c.key === sortKey);
    if (!column || column.sortable === false) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return sortDirection === 'asc' ? 1 : -1;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const total = sortedData.length;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  const handleHeaderClick = (col: DataTableColumn<T>) => {
    if (col.sortable === false) return;
    const key = String(col.key);
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handlePageSizeChange = (value: string) => {
    const size = Number(value);
    if (!Number.isNaN(size)) {
      setPageSize(size);
      setPage(0);
    }
  };

  const canPreviousPage = page > 0;
  const canNextPage = (page + 1) * pageSize < total;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-visible">
        <table className="w-full text-sm">
          <thead className="bg-muted/80 backdrop-blur-sm">
            <tr className="border-b border-border/50">
              {columns.map((col) => {
                const isSorted = sortKey === String(col.key);
                return (
                  <th
                    key={String(col.key)}
                    onClick={() => handleHeaderClick(col)}
                    className={`py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    } ${col.sortable === false ? '' : 'cursor-pointer select-none'} ${col.className ?? ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable === false ? null : (
                        <span className="text-[10px] text-muted-foreground/70">
                          {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '▾'}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const id = getRowId(row);
                const isSelected = selectedRowId != null && id === selectedRowId;
                return (
                  <tr
                    key={id}
                    className={`border-b border-border/30 transition-colors ${
                      isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/30'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={`py-3 px-4 ${
                          col.align === 'right' ? 'text-right' : 'text-left'
                        } ${col.className ?? ''}`}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key as string])}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page:</span>
            <select
              className="bg-card border border-border rounded px-2 py-1 text-xs text-foreground"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
            >
              {DEFAULT_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {from}–{to} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => canPreviousPage && setPage((p) => Math.max(0, p - 1))}
                disabled={!canPreviousPage}
              >
                Prev
              </button>
              <button
                className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => canNextPage && setPage((p) => p + 1)}
                disabled={!canNextPage}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
