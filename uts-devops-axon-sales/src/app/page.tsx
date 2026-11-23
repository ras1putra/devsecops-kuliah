'use client';

import { BarChart3, CalendarDays, CheckCircle2, CircleDollarSign, ClipboardList, LogOut, RotateCcw, Search, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { TOKEN_KEY, USER_KEY } from '@/lib/auth-storage';
import { filterSales, formatSaleAmount, formatSalesAxisTick, getDashboardSummary, getSalesAxisMaximum, getSalesSourcePresentation, getSalesTrend, type Sale, type SaleStatus, type SalesSource } from '@/lib/dashboard-data';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
});

const statusLabels: Record<SaleStatus, string> = {
  completed: 'Selesai',
  processing: 'Diproses',
  cancelled: 'Dibatalkan',
};

const statusStyles: Record<SaleStatus, string> = {
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  processing: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/15',
};

type SalesLoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; sales: Sale[]; source: SalesSource };

function subscribeAuth() {
  return () => {};
}

function formatDate(value: string, short = false) {
  const date = new Date(`${value}T00:00:00`);
  return (short ? shortDateFormatter : dateFormatter).format(date);
}

function MetricCard({ title, value, description, icon }: { title: string; value: string; description: string; icon: ReactNode }) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 truncate text-[1.55rem] font-semibold tracking-tight text-slate-900 sm:text-[1.7rem]">{value}</p>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">{icon}</div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}

function StatusPill({ status }: { status: SaleStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}

function SalesChart({ sales, source }: { sales: readonly Sale[]; source: SalesSource }) {
  const trend = useMemo(() => getSalesTrend(sales), [sales]);
  const maximumRevenue = Math.max(...trend.map((point) => point.revenue), 0);
  const axisMaximum = getSalesAxisMaximum(maximumRevenue, source);
  const axisTicks = [axisMaximum, axisMaximum * (2 / 3), axisMaximum / 3, 0];
  const presentation = getSalesSourcePresentation(source);
  const denseTrend = trend.length > 48;
  const labelInterval = Math.max(1, Math.ceil((trend.length - 1) / 7));
  const visibleLabels = (index: number) => trend.length <= 8 || index === 0 || index === trend.length - 1 || index % labelInterval === 0;

  return (
    <section id="grafik" className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5" aria-labelledby="chart-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="chart-title" className="text-base font-semibold text-slate-900">
            Tren penjualan
          </h2>
          <p className="mt-1 text-xs text-slate-500">Nilai transaksi hasil filter, tanpa dibatalkan, per tanggal</p>
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">{presentation.amountUnitLabel}</span>
      </div>

      {trend.length === 0 ? (
        <div className="mt-5 grid min-h-56 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center">
          <div>
            <div className="mx-auto grid size-10 place-items-center rounded-full bg-white text-slate-400 shadow-sm">
              <BarChart3 size={19} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">Belum ada data pada filter ini</p>
            <p className="mt-1 text-xs text-slate-500">Ubah kata kunci, status, atau rentang tanggal.</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto pb-1">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3">
              <div className="flex h-48 flex-col justify-between pb-1 text-right text-[10px] tabular-nums text-slate-400">
                {axisTicks.map((tick, index) => (
                  <span key={`${tick}-${index}`}>{tick === 0 ? '0' : formatSalesAxisTick(tick, source)}</span>
                ))}
              </div>
              <div className="relative h-48 border-b border-l border-slate-200 bg-[linear-gradient(to_bottom,#e8edf4_1px,transparent_1px)] [background-size:100%_33.333%]">
                <div className={`absolute inset-0 flex items-stretch justify-between px-2 ${denseTrend ? 'gap-0' : 'gap-1.5 sm:gap-2'}`}>
                  {trend.map((point) => {
                    const height = (point.revenue / axisMaximum) * 100;
                    const formattedDate = formatDate(point.date);
                    return (
                      <div key={point.date} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                        <div
                          className="w-full max-w-8 rounded-t-[4px] bg-blue-600 transition-colors group-hover:bg-blue-700"
                          style={{ height: `${height}%` }}
                          title={`${formattedDate}: ${formatSaleAmount(point.revenue, source)} · ${point.transactions} pesanan aktif`}
                          aria-label={`${formattedDate}: ${formatSaleAmount(point.revenue, source)}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3">
              <span aria-hidden="true" />
              <div className="relative h-5 text-[10px] text-slate-400">
                <div className="absolute inset-x-2 top-0">
                  {trend.map((point, index) =>
                    visibleLabels(index) ? (
                      <span
                        key={point.date}
                        className="absolute top-0 whitespace-nowrap"
                        style={{
                          left: `${trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100}%`,
                          transform: trend.length === 1 || (index !== 0 && index !== trend.length - 1) ? 'translateX(-50%)' : index === 0 ? 'translateX(0)' : 'translateX(-100%)',
                        }}
                      >
                        {formatDate(point.date, true)}
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const PAGE_SIZE_OPTIONS = [10, 15, 20] as const;

function PaginationControls({ page, pageSize, totalItems, onPageChange, onPageSizeChange }: { page: number; pageSize: number; totalItems: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pageNumbers.filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1);

  const navButtonClass =
    'inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => onPageChange(1)} disabled={page <= 1} className={navButtonClass}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
          First
        </button>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={navButtonClass}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-1">
          {visiblePages.map((n, idx) => {
            const prev = idx > 0 ? visiblePages[idx - 1] : null;
            const showGap = prev !== null && n - prev > 1;
            return (
              <span key={n} className="flex items-center gap-1">
                {showGap && (
                  <span className="px-1 text-xs text-slate-400" aria-hidden="true">
                    …
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(n)}
                  aria-current={n === page ? 'page' : undefined}
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition ${
                    n === page ? 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-300' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {n}
                </button>
              </span>
            );
          })}
        </div>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className={navButtonClass}>
          Next
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button type="button" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} className={navButtonClass}>
          Last
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs tabular-nums text-slate-500">
          {startItem}–{endItem} dari {totalItems}
        </span>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Tampilkan
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-400 focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function TransactionTable({ sales, source, onReset, hasFilters }: { sales: readonly Sale[]; source: SalesSource; onReset: () => void; hasFilters: boolean }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const presentation = getSalesSourcePresentation(source);

  const totalPages = Math.max(1, Math.ceil(sales.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedSales = useMemo(() => sales.slice((currentPage - 1) * pageSize, currentPage * pageSize), [sales, currentPage, pageSize]);

  return (
    <section id="transaksi" className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]" aria-labelledby="transactions-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div>
          <h2 id="transactions-title" className="text-base font-semibold text-slate-900">
            Daftar transaksi
          </h2>
          <p className="mt-1 text-xs text-slate-500">{sales.length} transaksi sesuai filter</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <ClipboardList size={15} aria-hidden="true" />
          Daftar sesuai filter
        </span>
      </div>

      {sales.length === 0 ? (
        <div className="grid min-h-56 place-items-center px-4 py-8 text-center">
          <div>
            <div className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400">
              <Search size={19} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">Tidak ada transaksi yang cocok</p>
            <p className="mt-1 text-xs text-slate-500">Coba ubah filter atau tampilkan kembali semua data.</p>
            <button
              type="button"
              onClick={onReset}
              disabled={!hasFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset filter
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-[0.06em] text-slate-500">
              <tr>
                <th scope="col" className="w-32 px-5 py-3 font-semibold">
                  ID transaksi
                </th>
                <th scope="col" className="w-36 px-4 py-3 font-semibold">
                  Tanggal
                </th>
                <th scope="col" className="w-56 px-4 py-3 font-semibold">
                  Pelanggan
                </th>
                <th scope="col" className="w-[22%] px-4 py-3 font-semibold">
                  Produk
                </th>
                <th scope="col" className="w-36 px-4 py-3 font-semibold">
                  {presentation.locationLabel}
                </th>
                <th scope="col" className="w-32 px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="w-40 px-5 py-3 text-right font-semibold">
                  {presentation.tableAmountLabel}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-3.5 font-medium text-blue-700">{sale.id}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                    <time dateTime={sale.date}>{formatDate(sale.date)}</time>
                  </td>
                  <td className="truncate whitespace-nowrap px-4 py-3.5 font-medium text-slate-800">{sale.customer}</td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <span className="block truncate" title={sale.product}>
                      {sale.product}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{sale.channel}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusPill status={sale.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums text-slate-800">{formatSaleAmount(sale.amount, source)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {sales.length > 0 && (
        <PaginationControls
          page={currentPage}
          pageSize={pageSize}
          totalItems={sales.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </section>
  );
}

export default function Home() {
  const [salesState, setSalesState] = useState<SalesLoadState>({ status: 'loading' });
  const [requestKey, setRequestKey] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SaleStatus | 'all'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const authorized = useSyncExternalStore(
    subscribeAuth,
    () => Boolean(localStorage.getItem(TOKEN_KEY)),
    () => false,
  );

  useEffect(() => {
    if (!authorized) window.location.replace('/login');
  }, [authorized]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSales() {
      try {
        const response = await fetch('/api/sales', { signal: controller.signal });
        const payload: unknown = await response.json();
        if (controller.signal.aborted) return;

        if (!response.ok) {
          const message =
            typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string' && payload.error.trim().length > 0 ? payload.error : 'Data penjualan tidak dapat dimuat. Silakan coba lagi.';
          setSalesState({ status: 'error', message });
          return;
        }

        if (typeof payload !== 'object' || payload === null || !('sales' in payload) || !Array.isArray(payload.sales) || !('source' in payload) || (payload.source !== 'demo' && payload.source !== 'mysql')) {
          throw new Error('Invalid sales response');
        }

        setSalesState({
          status: 'success',
          sales: payload.sales as Sale[],
          source: payload.source,
        });
      } catch {
        if (controller.signal.aborted) return;
        setSalesState({
          status: 'error',
          message: 'Data penjualan tidak dapat dimuat. Silakan coba lagi.',
        });
      }
    }

    void loadSales();
    return () => controller.abort();
  }, [requestKey]);

  const sales = useMemo(() => (salesState.status === 'success' ? salesState.sales : []), [salesState]);
  const source = salesState.status === 'success' ? salesState.source : null;
  const presentation = source ? getSalesSourcePresentation(source) : null;
  const isLoading = salesState.status === 'loading';
  const loadError = salesState.status === 'error' ? salesState.message : null;

  const filteredSales = useMemo(() => filterSales(sales, { query, status, from, to }), [sales, query, status, from, to]);
  const summary = useMemo(() => getDashboardSummary(filteredSales), [filteredSales]);
  const hasFilters = Boolean(query.trim() || from || to || status !== 'all');
  const invalidDateRange = Boolean(from && to && from > to);
  const dataDateRange = useMemo(() => {
    if (sales.length === 0) return null;
    const dates = sales.map((sale) => sale.date).sort();
    return { from: dates[0], to: dates[dates.length - 1] };
  }, [sales]);
  const sourceLabel = isLoading ? 'Memuat data' : (presentation?.label ?? 'Sumber tidak tersedia');

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setFrom('');
    setTo('');
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.replace('/login');
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-800">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-700 text-white shadow-sm shadow-blue-700/20">
              <ShoppingBag size={18} strokeWidth={2.2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-slate-900">Axon Sales</p>
              <p className="text-[11px] text-slate-500">Ringkasan penjualan</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs font-medium text-blue-800">
              <span className="size-1.5 rounded-full bg-blue-500" aria-hidden="true" />
              {sourceLabel}
            </span>
            <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
              <LogOut size={14} aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-6 sm:pt-9 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">Ringkasan penjualan</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">Pantau transaksi dan nilai dari data yang terhubung. Semua angka mengikuti filter di bawah.</p>
          </div>
          <span className="inline-flex items-center gap-2 pb-0.5 text-xs text-slate-500">
            <CalendarDays size={15} aria-hidden="true" />
            {dataDateRange ? `Rentang seluruh data: ${formatDate(dataDateRange.from)} – ${formatDate(dataDateRange.to)}` : isLoading ? 'Memuat rentang data…' : loadError ? 'Rentang data tidak tersedia' : 'Belum ada data transaksi'}
          </span>
        </div>

        <section className="mb-5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5" aria-label="Filter data penjualan">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Filter data</h2>
            <p className="text-xs text-slate-500">Berlaku untuk ringkasan, grafik, dan transaksi</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.6fr)_minmax(150px,0.9fr)_minmax(145px,1fr)_minmax(145px,1fr)_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Cari transaksi</span>
              <span className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ID, pelanggan, atau produk"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as SaleStatus | 'all')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Semua status</option>
                <option value="completed">Selesai</option>
                <option value="processing">Diproses</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Dari tanggal</span>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Sampai tanggal</span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-none"
              />
            </label>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasFilters}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 lg:w-auto"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>
          {invalidDateRange && (
            <p role="alert" className="mt-3 text-xs font-medium text-rose-700">
              Rentang tanggal tidak valid. Tanggal awal harus sama dengan atau sebelum tanggal akhir.
            </p>
          )}
        </section>

        {isLoading ? (
          <div role="status" aria-live="polite" className="mb-5 rounded-xl border border-slate-200/80 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Memuat data penjualan…
          </div>
        ) : loadError ? (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setSalesState({ status: 'loading' });
                setRequestKey((key) => key + 1);
              }}
              className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-100"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Metrik penjualan">
              <MetricCard
                title={presentation?.revenueMetricTitle ?? 'Nilai transaksi aktif'}
                value={formatSaleAmount(summary.totalRevenue, source ?? 'demo')}
                description="Nilai transaksi hasil filter, tanpa dibatalkan"
                icon={<CircleDollarSign size={20} aria-hidden="true" />}
              />
              <MetricCard title="Jumlah transaksi" value={summary.transactionCount.toLocaleString('id-ID')} description="Seluruh transaksi hasil filter" icon={<ClipboardList size={20} aria-hidden="true" />} />
              <MetricCard
                title={presentation?.averageMetricTitle ?? 'Rata-rata nilai aktif'}
                value={formatSaleAmount(summary.averageOrderValue, source ?? 'demo')}
                description="Nilai transaksi aktif ÷ pesanan aktif"
                icon={<ShoppingBag size={20} aria-hidden="true" />}
              />
              <MetricCard
                title="Tingkat penyelesaian"
                value={new Intl.NumberFormat('id-ID', { style: 'percent', maximumFractionDigits: 0 }).format(summary.completionRate)}
                description={`${summary.completedCount} selesai dari ${summary.activeTransactionCount} pesanan aktif`}
                icon={<CheckCircle2 size={20} aria-hidden="true" />}
              />
            </section>

            <div className="mb-5">
              <SalesChart sales={filteredSales} source={source ?? 'demo'} />
            </div>

            <TransactionTable sales={filteredSales} source={source ?? 'demo'} onReset={resetFilters} hasFilters={hasFilters} />
          </>
        )}

        <footer className="mt-5 text-center text-xs text-slate-400">{presentation?.footerLabel ?? 'Dashboard Axon Sales'}</footer>
      </main>
    </div>
  );
}
