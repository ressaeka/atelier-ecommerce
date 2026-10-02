import { useMemo } from 'react';
import BestSellingProducts from '../components/BestSellingProducts';
import DashboardStatCard from '../components/DashboardStatCard';
import PaymentMethodChart from '../components/PaymentMethodChart';
import RecentOrders from '../components/RecentOrders';
import ReportPromoCard from '../components/ReportPromoCard';
import SalesChart from '../components/SalesChart';
import SalesReport from '../components/SalesReport';
import { useAdminDashboardData } from '../hooks/useAdminDashboardData';

function formatIndonesianDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AdminDashboard() {
  const { data, isLoading, error, refetch } = useAdminDashboardData();
  const today = useMemo(() => formatIndonesianDate(new Date()), []);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A847B]">
          Memuat dashboard…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[30px]">
            Selamat datang, Admin!
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Berikut ringkasan aktivitas toko hari ini.
          </p>
        </header>

        <div
          role="alert"
          className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] px-5 py-6"
        >
          <p className="text-[13px] font-semibold text-[#8C3A1E]">
            Gagal memuat dashboard
          </p>
          <p className="mt-1.5 text-[12px] text-[#8C3A1E]/90">
            Terjadi kendala saat memuat ringkasan toko. Silakan coba lagi.
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-xl bg-[#1A1A1A] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#333]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const hasData =
    data.kpis.length > 0 ||
    data.recentOrders.length > 0 ||
    data.bestSellingProducts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[30px]">
            Selamat datang, Admin!
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Berikut ringkasan aktivitas toko hari ini.
          </p>
        </div>
        <p className="text-[12px] font-medium text-[#8A847B] sm:text-right">
          {today}
        </p>
      </header>

      {!hasData && (
        <div className="rounded-2xl border border-[#E8E4DC] bg-white px-6 py-10 text-center">
          <p className="font-editorial text-[17px] text-[#1A1A1A]">
            Belum ada data untuk ditampilkan
          </p>
          <p className="mt-2 text-[12px] text-[#8A847B]">
            Belum ada data pesanan atau produk yang tercatat di toko.
          </p>
        </div>
      )}

      {/* KPI */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((card) => (
          <DashboardStatCard key={card.id} card={card} />
        ))}
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left / center */}
        <div className="space-y-5 xl:col-span-2">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <SalesChart data={data.salesChart} />
            </div>

            <PaymentMethodChart
              methods={data.paymentMethods}
              centerLabel={data.paymentCenter.label}
              centerValue={data.paymentCenter.value}
              available={data.paymentMethodsAvailable}
            />

            <RecentOrders orders={data.recentOrders} />
          </div>

          <SalesReport
            rows={data.salesReport.rows}
            totalOrders={data.salesReport.totalOrders}
            rangeLabel={data.salesReport.rangeLabel}
          />
        </div>

        {/* Right */}
        <div className="space-y-5">
          <BestSellingProducts products={data.bestSellingProducts} />
          <ReportPromoCard promo={data.reportPromo} />

          {/* Today summary — bound to real backend metrics */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
            <h2 className="font-editorial text-[17px] font-medium tracking-tight text-[#1A1A1A]">
              Ringkasan Hari Ini
            </h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between rounded-xl border border-[#F0EDE7] bg-[#FCFBF9] px-4 py-3">
                <span className="text-[12.5px] text-[#6B6B6B]">
                  Pesanan baru
                </span>
                <span className="font-editorial text-[15px] font-semibold text-[#1A1A1A]">
                  {data.todaySummary.newOrders}
                </span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-[#F0EDE7] bg-[#FCFBF9] px-4 py-3">
                <span className="text-[12.5px] text-[#6B6B6B]">
                  Perlu dikirim
                </span>
                <span className="font-editorial text-[15px] font-semibold text-[#1A1A1A]">
                  {data.todaySummary.toShip}
                </span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-[#F0EDE7] bg-[#FCFBF9] px-4 py-3">
                <span className="text-[12.5px] text-[#6B6B6B]">
                  Stok menipis
                </span>
                <span className="font-editorial text-[15px] font-semibold text-[#A67C3D]">
                  {data.todaySummary.lowStock}
                </span>
              </li>
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}
