import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CreditCard } from 'lucide-react';
import {
  ADMIN_PAYMENT_COLORS,
  type AdminPaymentMethod,
} from '../data/adminDashboardMockData';
import { CardFooter, CardHeader, ProgressBar } from './ui/AdminPrimitives';

interface PaymentMethodChartProps {
  methods: AdminPaymentMethod[];
  centerLabel: string;
  centerValue: string;
  /** false = backend has not persisted payment methods yet */
  available?: boolean;
}

const numberFormatter = new Intl.NumberFormat('id-ID');

export default function PaymentMethodChart({
  methods,
  available = true,
}: PaymentMethodChartProps) {
  const totalOrders = useMemo(
    () => methods.reduce((sum, m) => sum + (m.orders ?? 0), 0),
    [methods],
  );

  const topMethod = useMemo(() => {
    if (methods.length === 0) return null;
    return [...methods].sort((a, b) => b.orders - a.orders)[0] ?? methods[0];
  }, [methods]);

  if (!available || methods.length === 0) {
    return (
      <section className="flex h-full min-w-0 flex-col rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]">
        <CardHeader
          icon={CreditCard}
          title="Metode Pembayaran"
          subtitle="Distribusi metode pembayaran"
          scope="Semua waktu · semua status"
        />
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] px-4 py-10 text-center">
          <p className="text-[13.5px] font-semibold text-[#3F3B36]">
            Data metode pembayaran belum tersedia.
          </p>
          <p className="mt-2 max-w-[220px] text-[12px] leading-relaxed text-[#6F6A62]">
            Distribusi metode pembayaran akan tampil setelah data metode
            pembayaran tersimpan di sistem.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="payment-method-title"
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <CardHeader
        id="payment-method-title"
        icon={CreditCard}
        title="Metode Pembayaran"
        subtitle={`Distribusi dari ${numberFormatter.format(totalOrders)} pesanan`}
        scope="Semua waktu · semua status"
      />

      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="relative mx-auto my-auto h-[148px] w-[148px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={methods}
                dataKey="percentage"
                nameKey="name"
                innerRadius="66%"
                outerRadius="96%"
                paddingAngle={methods.length > 1 ? 3 : 0}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {methods.map((_, index) => (
                  <Cell
                    key={methods[index].id}
                    fill={
                      ADMIN_PAYMENT_COLORS[index % ADMIN_PAYMENT_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #ECE7DE',
                  fontSize: 12,
                  fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
                }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-sans text-[26px] font-bold leading-none tabular-nums text-[#1A1A1A]">
              {numberFormatter.format(totalOrders)}
            </span>
            <span className="mt-1 text-[11.5px] font-medium text-[#6F6A62]">
              Pesanan
            </span>
          </div>
        </div>

        <ul className="space-y-2.5">
          {methods.map((method, index) => {
            const color =
              ADMIN_PAYMENT_COLORS[index % ADMIN_PAYMENT_COLORS.length];
            return (
              <li
                key={method.id}
                className="rounded-[14px] bg-[#FAF8F4] px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#1A1A1A]">
                    {method.name}
                  </span>
                  <span className="font-sans text-[13.5px] font-bold tabular-nums text-[#1A1A1A]">
                    {method.percentage}%
                  </span>
                </div>

                <ProgressBar
                  value={method.percentage}
                  colorHex={color}
                  className="mt-2"
                />

                <p className="mt-2 font-sans text-[12px] tabular-nums text-[#6F6A62]">
                  {numberFormatter.format(method.orders)} pesanan
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <CardFooter
        left="Metode terbanyak"
        right={
          <strong className="font-semibold text-[#1A1A1A]">
            {topMethod?.name ?? '—'}
          </strong>
        }
      />
    </section>
  );
}
