import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  ADMIN_PAYMENT_COLORS,
  type AdminPaymentMethod,
} from '../data/adminDashboardMockData';

interface PaymentMethodChartProps {
  methods: AdminPaymentMethod[];
  centerLabel: string;
  centerValue: string;
  /** false = backend has not persisted payment methods yet */
  available?: boolean;
}

export default function PaymentMethodChart({
  methods,
  centerLabel,
  centerValue,
  available = true,
}: PaymentMethodChartProps) {
  if (!available || methods.length === 0) {
    return (
      <section className="flex h-full flex-col rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
        <h2 className="mb-4 font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
          Metode Pembayaran
        </h2>
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E4DC] bg-[#FCFBF9] px-4 py-10 text-center">
          <p className="text-[12.5px] leading-relaxed text-[#6B6B6B]">
            Data metode pembayaran belum tersedia.
          </p>
          <p className="mt-2 max-w-[220px] text-[11px] leading-relaxed text-[#9A9A9A]">
            Distribusi metode pembayaran akan tampil setelah data metode
            pembayaran tersimpan di sistem.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
      <h2 className="mb-4 font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
        Metode Pembayaran
      </h2>

      <div className="relative mx-auto h-[200px] w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={methods}
              dataKey="percentage"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={3}
              stroke="none"
            >
              {methods.map((_, index) => (
                <Cell
                  key={methods[index].id}
                  fill={ADMIN_PAYMENT_COLORS[index % ADMIN_PAYMENT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #E8E4DC',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
              }}
              formatter={(value: number, name: string) => [
                `${value}%`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#8A847B]">
            {centerLabel}
          </span>
          <span className="mt-1 font-editorial text-[18px] font-medium text-[#1A1A1A]">
            {centerValue}
          </span>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {methods.map((method, index) => (
          <li key={method.id} className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  ADMIN_PAYMENT_COLORS[index % ADMIN_PAYMENT_COLORS.length],
              }}
            />
            <span className="flex-1 text-[12.5px] text-[#4A4A4A]">
              {method.name}
            </span>
            <span className="text-[12.5px] font-semibold text-[#1A1A1A]">
              {method.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
