import { useMemo } from 'react';
import { AlertCircle, ChevronRight, Inbox, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnalyticsSection from '../components/analytics/AnalyticsSection';
import PaymentMethodChart from '../components/PaymentMethodChart';
import RecentOrders from '../components/RecentOrders';
import ReportPromoCard from '../components/ReportPromoCard';
import { CardHeader } from '../components/ui/AdminPrimitives';
import { useAdminDashboardData } from '../hooks/useAdminDashboardData';

function formatIndonesianDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const numberFormatter = new Intl.NumberFormat('id-ID');

export default function AdminDashboard() {
  const {
    data,
    isLoading: isOpsLoading,
    error: opsError,
    refetch: refetchOps,
  } = useAdminDashboardData();
  const today = useMemo(() => formatIndonesianDate(new Date()), []);

  const allTimeOrderCount = useMemo(() => {
    const fromMethods = data.paymentMethods.reduce(
      (sum, m) => sum + (m.orders ?? 0),
      0,
    );
    return fromMethods > 0 ? fromMethods : data.salesReport.totalOrders;
  }, [data.paymentMethods, data.salesReport.totalOrders]);

  return (
    <div className="space-y-6">
      {/* SCREEN 1: Unified Header + Business Analytics (Shared Period Filter) */}
      <AnalyticsSection todayLabel={today} />

      {/* SCREEN 2 (Row 4): Operational Monitoring, Payment Analytics & Reports Shortcut */}
      <section aria-label="Operasional Toko" className="space-y-5">
        <div className="flex flex-col gap-1 border-b border-[#ECE7DE] pb-2.5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-editorial text-[24px] font-semibold tracking-tight text-[#1A1A1A]">
            Operasional & Laporan Hari Ini
          </h2>
          <p className="text-[12.5px] font-medium text-[#6F6A62]">
            {today} · pemantauan operasional real-time & pintasan laporan
          </p>
        </div>

        {isOpsLoading && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 min-[1440px]:grid-cols-3 xl:gap-6">
            <div className="h-[400px] animate-pulse rounded-2xl border border-[#ECE7DE] bg-white/80" />
            <div className="h-[400px] animate-pulse rounded-2xl border border-[#ECE7DE] bg-white/80" />
            <div className="h-[400px] animate-pulse rounded-2xl border border-[#ECE7DE] bg-white/80 lg:col-span-2 min-[1440px]:col-span-1" />
          </div>
        )}

        {!isOpsLoading && opsError && (
          <div
            role="alert"
            className="rounded-2xl border border-[#F5D6D2] bg-[#FBECEA] px-5 py-6"
          >
            <p className="text-[13.5px] font-semibold text-[#B4382E]">
              Gagal memuat ringkasan operasional
            </p>
            <p className="mt-1.5 text-[12.5px] text-[#B4382E]/90">
              Terjadi kendala saat memuat data operasional toko. Silakan coba
              lagi.
            </p>
            <button
              type="button"
              onClick={refetchOps}
              className="mt-4 min-h-[40px] rounded-xl bg-[#5C4033] px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#3D2920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!isOpsLoading && !opsError && (
          <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2 min-[1440px]:grid-cols-3 xl:gap-6">
            <RecentOrders
              orders={data.recentOrders}
              totalOrdersCount={allTimeOrderCount}
              toShipCount={data.todaySummary.toShip}
            />

            <PaymentMethodChart
              methods={data.paymentMethods}
              centerLabel={data.paymentCenter.label}
              centerValue={data.paymentCenter.value}
              available={data.paymentMethodsAvailable}
            />

            {/* Stacked Right Column: Ringkasan Hari Ini + Report Shortcuts */}
            <div className="flex flex-col justify-between gap-5 lg:col-span-2 min-[1440px]:col-span-1">
              <section className="flex flex-1 flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]">
                <CardHeader
                  icon={Inbox}
                  title="Ringkasan Hari Ini"
                  subtitle="Yang perlu ditindaklanjuti"
                  scope="Real-time hari ini"
                />

                <ul className="space-y-2.5">
                  <li>
                    <Link
                      to="/admin/orders"
                      className="group flex items-center justify-between rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-4 py-2.5 transition-colors hover:border-[#D6CFC2] hover:bg-[#F3EFE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#ECE7DE] bg-white text-[#5C4033]"
                          aria-hidden="true"
                        >
                          <Inbox className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <span className="text-[13.5px] font-medium text-[#3F3B36]">
                          Pesanan baru
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[21px] font-bold tabular-nums text-[#1A1A1A]">
                          {numberFormatter.format(data.todaySummary.newOrders)}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 text-[#9B958C] transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/admin/orders"
                      className="group flex items-center justify-between rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-4 py-2.5 transition-colors hover:border-[#D6CFC2] hover:bg-[#F3EFE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#ECE7DE] bg-white text-[#9A5B14]"
                          aria-hidden="true"
                        >
                          <Truck className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <span className="text-[13.5px] font-medium text-[#3F3B36]">
                          Perlu dikirim
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[21px] font-bold tabular-nums text-[#1A1A1A]">
                          {numberFormatter.format(data.todaySummary.toShip)}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 text-[#9B958C] transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/admin/products"
                      className="group flex items-center justify-between rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-4 py-2.5 transition-colors hover:border-[#D6CFC2] hover:bg-[#F3EFE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#ECE7DE] bg-white text-[#B4382E]"
                          aria-hidden="true"
                        >
                          <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <span className="text-[13.5px] font-medium text-[#3F3B36]">
                          Stok menipis
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[21px] font-bold tabular-nums text-[#1A1A1A]">
                          {numberFormatter.format(data.todaySummary.lowStock)}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 text-[#9B958C] transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  </li>
                </ul>
              </section>

              <ReportPromoCard promo={data.reportPromo} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
