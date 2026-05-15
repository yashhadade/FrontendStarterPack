import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type SortDirection = 'asc' | 'desc';

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  align?: 'left' | 'right' | 'center';
  /**
   * Applied to both `<th>` and `<td>`. Prefer `headerClassName` / `cellClassName` for width control.
   */
  className?: string;
  /** Extra classes for `<th>` only (e.g. `min-w-[14rem]`). */
  headerClassName?: string;
  /** Extra classes for `<td>` only (e.g. `min-w-[12rem] max-w-md`). */
  cellClassName?: string;
  /** When true, body cells wrap text instead of staying on one line. */
  wrap?: boolean;
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
   * Controlled search string. When set, pair with `onSearchChange` so the input stays in sync.
   */
  search?: string;
  /**
   * Called when the search box value changes.
   * Use with `serverSearch` (and usually `serverPagination`) to query the backend.
   */
  onSearchChange?: (query: string) => void;
  /**
   * When true, rows are not filtered by the search string in the browser; use `onSearchChange`
   * so the parent can load matching data from the server.
   * When false with `serverPagination`, search still filters the current page client-side.
   */
  serverSearch?: boolean;
  /**
   * Debounce (ms) before calling `onSearchChange` when `serverSearch` is true and search is
   * uncontrolled (`search` prop omitted). Omit or 0 for immediate updates.
   */
  searchDebounceMs?: number;
  /**
   * Keys to use when filtering with the search box.
   * If omitted, all primitive fields will be considered.
   * Use dot paths (e.g. `buyer.name`) for nested fields.
   */
  searchableKeys?: (keyof T | string)[];
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
  /**
   * Set true to enable backend-driven pagination.
   * In this mode, `data` should already be paginated by API.
   */
  serverPagination?: boolean;
  /**
   * Total rows available on backend. Used only when `serverPagination` is true.
   */
  totalRows?: number;
  /**
   * Current page index from backend (0-based). Used only when `serverPagination` is true.
   */
  currentPage?: number;
  /**
   * Current page size from backend. Used only when `serverPagination` is true.
   */
  currentPageSize?: number;
  /**
   * Callback for backend page changes.
   */
  onPageChange?: (page: number) => void;
  /**
   * Callback for backend page size changes.
   */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * Row counts shown in the "Rows per page" select. Defaults to [5, 10, 25, 50].
   * If the current page size is not in this list (e.g. from the API), it is added automatically.
   */
  pageSizes?: number[];
  /** Omit search row (e.g. compact table inside a card). */
  hideSearch?: boolean;
  /** Omit pagination footer and list all rows. */
  hidePagination?: boolean;
  /** Omit outer `glass-card` wrapper when nesting inside another surface. */
  bare?: boolean;
  /** Extra classes on the root wrapper. */
  className?: string;
  /** Classes for the `<table>` (default is wide `min-w` for full-page tables). */
  tableClassName?: string;
};

const DEFAULT_PAGE_SIZES = [5, 10, 25, 50] as const;

function getSearchableValue<T extends Record<string, unknown>>(
  row: T,
  key: keyof T | string
): unknown {
  if (typeof key === 'string' && key.includes('.')) {
    return key.split('.').reduce<unknown>((acc, part) => {
      if (acc != null && typeof acc === 'object' && part in (acc as object)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, row as unknown);
  }
  return (row as Record<string, unknown>)[key as string];
}

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  search: controlledSearch,
  onSearchChange,
  serverSearch = false,
  searchDebounceMs = 0,
  searchableKeys,
  getRowId,
  onRowClick,
  searchPlaceholder = 'Search…',
  title = '',
  selectedRowId,
  initialSortKey = null,
  initialSortDirection = 'asc',
  serverPagination = false,
  totalRows,
  currentPage,
  currentPageSize,
  onPageChange,
  onPageSizeChange,
  pageSizes,
  hideSearch = false,
  hidePagination = false,
  bare = false,
  className: rootClassName,
  tableClassName,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearchControlled = controlledSearch !== undefined;
  const searchQuery = isSearchControlled ? controlledSearch : internalSearch;

  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  const effectiveSearchKeys = useMemo((): (keyof T | string)[] => {
    if (searchableKeys && searchableKeys.length > 0) return searchableKeys;
    if (data.length === 0) return [];
    return Object.keys(data[0]) as (keyof T)[];
  }, [data, searchableKeys]);

  const filteredData = useMemo(() => {
    if (serverSearch) return data;
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      effectiveSearchKeys.some((key) => {
        const value = getSearchableValue(row, key);
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, effectiveSearchKeys, searchQuery, serverSearch]);

  const sortedData = useMemo(() => {
    if (serverPagination) return filteredData;
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
    if (serverPagination) return sortedData;
    if (hidePagination) return sortedData;
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize, serverPagination, hidePagination]);

  const activePageSize = serverPagination ? (currentPageSize ?? pageSize) : pageSize;
  const activePage = serverPagination ? (currentPage ?? 0) : page;

  const pageSizeSelectOptions = useMemo(() => {
    const base = pageSizes && pageSizes.length > 0 ? [...pageSizes] : [...DEFAULT_PAGE_SIZES];
    const size = activePageSize;
    const merged = size > 0 && !base.includes(size) ? [...base, size] : base;
    return [...new Set(merged)].sort((a, b) => a - b);
  }, [pageSizes, activePageSize]);

  const total = serverPagination ? (totalRows ?? 0) : sortedData.length;
  const from = total === 0 ? 0 : activePage * activePageSize + 1;
  const to = Math.min(total, activePage * activePageSize + paginatedData.length);

  const handleHeaderClick = (col: DataTableColumn<T>) => {
    if (col.sortable === false) return;
    setPage(0);
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
    if (Number.isNaN(size)) return;
    if (serverPagination) {
      onPageSizeChange?.(size);
      onPageChange?.(0);
      return;
    }
    setPageSize(size);
    setPage(0);
  };

  const canPreviousPage = activePage > 0;
  const canNextPage = (activePage + 1) * activePageSize < total;

  /** After search/filter/sort, avoid sitting on an empty page (shows “No records” while rows exist on page 1). */
  useEffect(() => {
    if (serverPagination || hidePagination) return;
    if (sortedData.length === 0) {
      if (page !== 0) setPage(0);
      return;
    }
    const lastPageIndex = Math.max(0, Math.ceil(sortedData.length / activePageSize) - 1);
    if (page > lastPageIndex) setPage(lastPageIndex);
  }, [sortedData.length, activePageSize, page, serverPagination, hidePagination]);

  const flushSearchDebounce = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  };

  const handleSearchInputChange = (value: string) => {
    if (!isSearchControlled) {
      setInternalSearch(value);
    }

    setPage(0);

    const debounceMs = searchDebounceMs > 0 ? searchDebounceMs : 0;
    const useDebounce = serverSearch && debounceMs > 0 && onSearchChange && !isSearchControlled;

    if (useDebounce) {
      flushSearchDebounce();
      searchDebounceRef.current = setTimeout(() => {
        onSearchChange(value);
        if (serverPagination) onPageChange?.(0);
        searchDebounceRef.current = null;
      }, debounceMs);
      return;
    }

    onSearchChange?.(value);
    if (serverPagination && serverSearch) onPageChange?.(0);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handlePreviousPage = () => {
    if (!canPreviousPage) return;
    if (serverPagination) {
      onPageChange?.(Math.max(0, activePage - 1));
      return;
    }
    setPage((p) => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    if (!canNextPage) return;
    if (serverPagination) {
      onPageChange?.(activePage + 1);
      return;
    }
    setPage((p) => p + 1);
  };

  const showToolbar = Boolean(title) || !hideSearch;
  const tableClasses = tableClassName ?? 'w-full min-w-[640px] text-sm';

  return (
    <div
      className={`${bare ? 'space-y-3' : 'glass-card p-5 space-y-4'}${rootClassName ? ` ${rootClassName}` : ''}`}
    >
      {showToolbar ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-foreground">{title}</div>
          {!hideSearch ? (
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  handleSearchInputChange(e.target.value);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className={tableClasses}>
            <thead className="bg-muted/80 backdrop-blur-sm">
              <tr className="border-b border-border/50">
                {columns.map((col) => {
                  const isSorted = sortKey === String(col.key);
                  return (
                    <th
                      key={String(col.key)}
                      onClick={() => handleHeaderClick(col)}
                      className={cn(
                        'py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap',
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                            ? 'text-center'
                            : 'text-left',
                        col.sortable === false ? '' : 'cursor-pointer select-none',
                        col.className,
                        col.headerClassName
                      )}
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
                paginatedData.map((row, rowIndex) => {
                  const rawId = getRowId(row);
                  const idPrefix =
                    rawId !== null && rawId !== undefined && String(rawId) !== ''
                      ? String(rawId)
                      : 'row';
                  const displayKey = `${idPrefix}-${activePage * activePageSize + rowIndex}`;
                  const isSelected = selectedRowId != null && rawId === selectedRowId;
                  return (
                    <tr
                      key={displayKey}
                      className={`border-b border-border/30 transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-l-2 border-l-primary'
                          : 'hover:bg-muted/30'
                      } ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          className={cn(
                            'py-3 px-4',
                            col.wrap
                              ? 'whitespace-normal break-words align-top'
                              : 'whitespace-nowrap',
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                                ? 'text-center'
                                : 'text-left',
                            col.className,
                            col.cellClassName
                          )}
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
        </div>

        {!hidePagination ? (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page:</span>
              <select
                className="bg-card border border-border rounded px-2 py-1 text-xs text-foreground"
                value={activePageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
              >
                {pageSizeSelectOptions.map((size) => (
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
                  onClick={handlePreviousPage}
                  disabled={!canPreviousPage}
                >
                  Prev
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleNextPage}
                  disabled={!canNextPage}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default DataTable;
