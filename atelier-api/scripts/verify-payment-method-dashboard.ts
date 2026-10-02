import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PaymentStatus } from '../generated/prisma/enums.js';
import { buildPaymentMethodDistribution } from '../src/payment/payment-method-mapper.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.log('NO_DB_URL');
  process.exit(2);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

try {
  // Same query as AdminDashboardService for payment methods
  const completedPaymentsRaw = await prisma.payment.findMany({
    where: { status: PaymentStatus.PAID },
    select: { paymentMethod: true },
  });

  const dist = buildPaymentMethodDistribution(completedPaymentsRaw);

  console.log(
    JSON.stringify(
      {
        completedPaymentsRaw,
        paymentMethods: dist.paymentMethods,
        paymentMethodsAvailable: dist.paymentMethodsAvailable,
        completedTotal: dist.completedTotal,
        completedWithKnownMethod: dist.completedWithKnownMethod,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error('DASH_ERROR', e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
