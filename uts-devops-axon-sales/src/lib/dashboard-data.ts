export type SaleStatus = "completed" | "processing" | "cancelled";
export type SalesSource = "demo" | "mysql";

export type SalesSourcePresentation = {
  label: string;
  locationLabel: string;
  amountUnitLabel: string;
  tableAmountLabel: string;
  revenueMetricTitle: string;
  averageMetricTitle: string;
  footerLabel: string;
};

export type Sale = {
  id: string;
  customer: string;
  product: string;
  date: string;
  amount: number;
  status: SaleStatus;
  channel: string;
};

export type SaleFilters = {
  query?: string;
  from?: string;
  to?: string;
  status?: SaleStatus | "all";
};

export type DashboardSummary = {
  totalRevenue: number;
  transactionCount: number;
  activeTransactionCount: number;
  averageOrderValue: number;
  completedCount: number;
  completionRate: number;
};

export type SalesTrendPoint = {
  date: string;
  revenue: number;
  transactions: number;
};

export const DEMO_SALES: Sale[] = [
  {
    id: "AX-2401",
    customer: "CV Sinar Nusantara",
    product: "Starter Kit",
    date: "2026-10-05",
    amount: 1_250_000,
    status: "completed",
    channel: "Website",
  },
  {
    id: "AX-2402",
    customer: "Rani Amalia",
    product: "Growth Plan",
    date: "2026-10-04",
    amount: 2_450_000,
    status: "completed",
    channel: "WhatsApp",
  },
  {
    id: "AX-2403",
    customer: "Bima Pratama",
    product: "Starter Kit",
    date: "2026-10-04",
    amount: 1_250_000,
    status: "processing",
    channel: "Instagram",
  },
  {
    id: "AX-2404",
    customer: "PT Karya Digital",
    product: "Enterprise Plan",
    date: "2026-10-03",
    amount: 6_800_000,
    status: "completed",
    channel: "Referral",
  },
  {
    id: "AX-2405",
    customer: "Nadia Putri",
    product: "Growth Plan",
    date: "2026-10-03",
    amount: 2_450_000,
    status: "cancelled",
    channel: "Website",
  },
  {
    id: "AX-2406",
    customer: "Toko Terang Jaya",
    product: "Growth Plan",
    date: "2026-10-02",
    amount: 2_450_000,
    status: "completed",
    channel: "WhatsApp",
  },
  {
    id: "AX-2407",
    customer: "Dimas Saputra",
    product: "Starter Kit",
    date: "2026-10-01",
    amount: 1_250_000,
    status: "processing",
    channel: "Website",
  },
  {
    id: "AX-2408",
    customer: "UD Cipta Niaga",
    product: "Enterprise Plan",
    date: "2026-09-30",
    amount: 6_800_000,
    status: "completed",
    channel: "Referral",
  },
  {
    id: "AX-2409",
    customer: "Siska Wulandari",
    product: "Growth Plan",
    date: "2026-09-29",
    amount: 2_450_000,
    status: "completed",
    channel: "Instagram",
  },
  {
    id: "AX-2410",
    customer: "PT Bumi Sejahtera",
    product: "Enterprise Plan",
    date: "2026-09-27",
    amount: 6_800_000,
    status: "processing",
    channel: "Website",
  },
  {
    id: "AX-2411",
    customer: "Aldi Firmansyah",
    product: "Starter Kit",
    date: "2026-09-26",
    amount: 1_250_000,
    status: "cancelled",
    channel: "WhatsApp",
  },
  {
    id: "AX-2412",
    customer: "CV Lentera Kreatif",
    product: "Growth Plan",
    date: "2026-09-24",
    amount: 2_450_000,
    status: "completed",
    channel: "Referral",
  },
  {
    id: "AX-2413",
    customer: "Reza Fadillah",
    product: "Starter Kit",
    date: "2026-09-22",
    amount: 1_250_000,
    status: "completed",
    channel: "Website",
  },
  {
    id: "AX-2414",
    customer: "PT Arunika Solusi",
    product: "Enterprise Plan",
    date: "2026-09-20",
    amount: 6_800_000,
    status: "completed",
    channel: "Referral",
  },
  {
    id: "AX-2415",
    customer: "Dwi Kartika",
    product: "Growth Plan",
    date: "2026-09-18",
    amount: 2_450_000,
    status: "processing",
    channel: "Instagram",
  },
  {
    id: "AX-2416",
    customer: "CV Prima Sentosa",
    product: "Starter Kit",
    date: "2026-09-15",
    amount: 1_250_000,
    status: "completed",
    channel: "WhatsApp",
  },
  {
    id: "AX-2417",
    customer: "Tio Nugroho",
    product: "Growth Plan",
    date: "2026-09-12",
    amount: 2_450_000,
    status: "cancelled",
    channel: "Instagram",
  },
  {
    id: "AX-2418",
    customer: "PT Ruang Tumbuh",
    product: "Enterprise Plan",
    date: "2026-09-10",
    amount: 6_800_000,
    status: "completed",
    channel: "Referral",
  },
  {
    id: "AX-2419",
    customer: "Nadia Putri",
    product: "Starter Kit",
    date: "2026-09-08",
    amount: 1_250_000,
    status: "processing",
    channel: "WhatsApp",
  },
  {
    id: "AX-2420",
    customer: "Nusa Kreatif Studio",
    product: "Growth Plan",
    date: "2026-09-05",
    amount: 2_450_000,
    status: "completed",
    channel: "Website",
  },
];

export function filterSales(
  sales: readonly Sale[],
  filters: SaleFilters = {},
): Sale[] {
  const query = filters.query?.trim().toLocaleLowerCase("id-ID") ?? "";

  return sales
    .filter((sale) => {
      const matchesQuery =
        !query ||
        [sale.id, sale.customer, sale.product]
          .join(" ")
          .toLocaleLowerCase("id-ID")
          .includes(query);
      const matchesFrom = !filters.from || sale.date >= filters.from;
      const matchesTo = !filters.to || sale.date <= filters.to;
      const matchesStatus =
        !filters.status ||
        filters.status === "all" ||
        sale.status === filters.status;

      return matchesQuery && matchesFrom && matchesTo && matchesStatus;
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getDashboardSummary(
  sales: readonly Sale[],
): DashboardSummary {
  const activeSales = sales.filter((sale) => sale.status !== "cancelled");
  const totalRevenue = activeSales.reduce((total, sale) => total + sale.amount, 0);
  const completedCount = activeSales.filter(
    (sale) => sale.status === "completed",
  ).length;

  return {
    totalRevenue,
    transactionCount: sales.length,
    activeTransactionCount: activeSales.length,
    averageOrderValue: activeSales.length ? totalRevenue / activeSales.length : 0,
    completedCount,
    completionRate: activeSales.length ? completedCount / activeSales.length : 0,
  };
}

export function getSalesTrend(
  sales: readonly Sale[],
): SalesTrendPoint[] {
  const dailyTotals = new Map<string, SalesTrendPoint>();

  for (const sale of sales) {
    const point = dailyTotals.get(sale.date) ?? {
      date: sale.date,
      revenue: 0,
      transactions: 0,
    };

    if (sale.status !== "cancelled") {
      point.revenue += sale.amount;
      point.transactions += 1;
    }

    dailyTotals.set(sale.date, point);
  }

  return [...dailyTotals.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

export function getSalesSourcePresentation(
  source: SalesSource,
): SalesSourcePresentation {
  if (source === "demo") {
    return {
      label: "Data contoh",
      locationLabel: "Kanal",
      amountUnitLabel: "Nilai dalam rupiah",
      tableAmountLabel: "Total",
      revenueMetricTitle: "Omzet non-dibatalkan",
      averageMetricTitle: "Rata-rata pesanan aktif",
      footerLabel: "Dashboard Axon Sales · Nilai dalam Rupiah (IDR)",
    };
  }

  return {
    label: "MySQL · Data dosen",
    locationLabel: "Negara pelanggan",
    amountUnitLabel: "Nilai dataset · desimal",
    tableAmountLabel: "Nilai",
    revenueMetricTitle: "Nilai transaksi aktif",
    averageMetricTitle: "Rata-rata nilai aktif",
    footerLabel: "Dashboard Axon Sales · Nilai dataset tanpa satuan mata uang",
  };
}

export function formatSaleAmount(amount: number, source: SalesSource): string {
  if (source === "demo") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatSalesAxisTick(
  value: number,
  source: SalesSource,
): string {
  if (source === "demo") {
    return `${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(value / 1_000_000)} jt`;
  }

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getSalesAxisMaximum(
  maximumRevenue: number,
  source: SalesSource,
): number {
  if (source === "demo") {
    return Math.max(
      Math.ceil(maximumRevenue / 1_000_000) * 1_000_000,
      1_000_000,
    );
  }

  const safeMaximum = Math.max(maximumRevenue, 0);
  const magnitude = 10 ** Math.floor(Math.log10(safeMaximum || 1));
  const normalizedMaximum = safeMaximum / magnitude;
  const step =
    normalizedMaximum <= 1
      ? 1
      : normalizedMaximum <= 2
        ? 2
        : normalizedMaximum <= 5
          ? 5
          : 10;

  return step * magnitude;
}
