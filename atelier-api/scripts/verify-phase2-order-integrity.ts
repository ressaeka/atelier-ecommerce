import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { OrderRepository } from '../src/order/order.repository.js';
import { OrderStatus } from '../generated/prisma/enums.js';
import { OrderSchema } from '../src/order/dto/create-order.dto.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log('--- STARTING PHASES 2, 3, 4 & 6 INTEGRITY VERIFICATION ---');
  const orderRepo = new OrderRepository(prisma as any);

  // Setup test customer, product, variant, category, address, cart
  const testCategory = await prisma.category.upsert({
    where: { name: 'Audit Test Category' },
    update: {},
    create: { name: 'Audit Test Category' },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'audit_test_user@atelier.local' },
    update: {},
    create: {
      name: 'Audit Test Customer',
      username: 'audit_test_customer_' + Date.now(),
      email: 'audit_test_user@atelier.local',
      role: 'USER',
    },
  });

  const testAddress = await prisma.address.create({
    data: {
      userId: testUser.id,
      label: 'Home',
      recipientName: 'Audit Test Recipient',
      phone: '081234567890',
      addressLine: 'Jl. Audit No. 1',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '12345',
    },
  });

  const testProduct = await prisma.product.create({
    data: {
      name: 'Audit Test Bag ' + Date.now(),
      price: 100000,
      stock: 5,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa',
      categoryId: testCategory.id,
    },
  });

  const testVariant = await prisma.productVariant.create({
    data: {
      productId: testProduct.id,
      color: 'Noir',
      size: 'Medium',
      price: 100000,
      stock: 5,
      sku: 'AUDIT-BAG-BLK-' + Date.now(),
    },
  });

  try {
    // =========================================================================
    // PHASE 2: STOCK RESTORATION & IDEMPOTENCY
    // =========================================================================
    console.log('\n[PHASE 2 - Test 1] Create order and verify stock deduction...');
    const initialProductStock = testProduct.stock;
    const initialVariantStock = testVariant.stock;

    const order1 = await orderRepo.createOrderWithStockDeduction(
      {
        user: { connect: { id: testUser.id } },
        status: OrderStatus.PENDING,
        subtotal: 100000,
        shippingFee: 0,
        total: 100000,
        recipientName: testAddress.recipientName,
        phone: testAddress.phone,
        addressLine: testAddress.addressLine,
        city: testAddress.city,
        province: testAddress.province,
        postalCode: testAddress.postalCode,
        items: {
          create: [
            {
              product: { connect: { id: testProduct.id } },
              variant: { connect: { id: testVariant.id } },
              quantity: 2,
              price: 100000,
              subtotal: 200000,
            },
          ],
        },
      },
      [
        { productId: testProduct.id, variantId: testVariant.id, quantity: 2 },
      ],
    );

    const postDeductProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const postDeductVar = await prisma.productVariant.findUnique({ where: { id: testVariant.id } });
    if (postDeductProd!.stock !== initialProductStock - 2 || postDeductVar!.stock !== initialVariantStock - 2) {
      throw new Error(`Stock deduction failed: expected ${initialProductStock - 2}, got ${postDeductProd!.stock}`);
    }
    console.log('[PHASE 2 - Test 1 PASSED] Stock successfully deducted on order creation.');

    console.log('[PHASE 2 - Test 2] Transition PENDING -> EXPIRED restores stock exactly once...');
    await orderRepo.transitionOrderStatus(order1.id, OrderStatus.EXPIRED);
    const restoredProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const restoredVar = await prisma.productVariant.findUnique({ where: { id: testVariant.id } });
    if (restoredProd!.stock !== initialProductStock || restoredVar!.stock !== initialVariantStock) {
      throw new Error(`Stock restoration failed: expected ${initialProductStock}, got ${restoredProd!.stock}`);
    }
    console.log('[PHASE 2 - Test 2 PASSED] Stock restored successfully.');

    console.log('[PHASE 2 - Test 3] Webhook idempotency (duplicate EXPIRED webhook does NOT double restore)...');
    await orderRepo.transitionOrderStatus(order1.id, OrderStatus.EXPIRED);
    const afterDupProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const afterDupVar = await prisma.productVariant.findUnique({ where: { id: testVariant.id } });
    if (afterDupProd!.stock !== initialProductStock || afterDupVar!.stock !== initialVariantStock) {
      throw new Error(`Duplicate webhook caused double stock restore! Stock is ${afterDupProd!.stock}`);
    }
    console.log('[PHASE 2 - Test 3 PASSED] Duplicate webhook is strictly idempotent; no double restore.');

    console.log('[PHASE 2 - Test 4] Late cancellation on PAID order is blocked...');
    const orderPaid = await orderRepo.createOrderWithStockDeduction(
      {
        user: { connect: { id: testUser.id } },
        status: OrderStatus.PENDING,
        subtotal: 100000,
        shippingFee: 0,
        total: 100000,
        recipientName: testAddress.recipientName,
        phone: testAddress.phone,
        addressLine: testAddress.addressLine,
        city: testAddress.city,
        province: testAddress.province,
        postalCode: testAddress.postalCode,
        items: {
          create: [
            {
              product: { connect: { id: testProduct.id } },
              quantity: 1,
              price: 100000,
              subtotal: 100000,
            },
          ],
        },
      },
      [{ productId: testProduct.id, quantity: 1 }],
    );

    // Pay order
    await orderRepo.transitionOrderStatus(orderPaid.id, OrderStatus.PAID);
    const paidProdStock = (await prisma.product.findUnique({ where: { id: testProduct.id } }))!.stock;

    // Simulate late expired callback from Midtrans
    await orderRepo.transitionOrderStatus(orderPaid.id, OrderStatus.EXPIRED);
    const orderCheck = await prisma.order.findUnique({ where: { id: orderPaid.id } });
    const paidProdStockAfter = (await prisma.product.findUnique({ where: { id: testProduct.id } }))!.stock;

    if (orderCheck!.status !== OrderStatus.PAID) {
      throw new Error(`Order status was downgraded from PAID to ${orderCheck!.status}`);
    }
    if (paidProdStockAfter !== paidProdStock) {
      throw new Error(`Stock changed erroneously on paid order late callback!`);
    }
    console.log('[PHASE 2 - Test 4 PASSED] Late cancellation ignored; PAID order remained protected.');

    // =========================================================================
    // PHASE 3: CONCURRENT CHECKOUT & NON-NEGATIVE STOCK
    // =========================================================================
    console.log('\n[PHASE 3 - Test 5] Simulating concurrent checkout on product with stock = 1...');
    // Reset product stock to exactly 1
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { stock: 1 },
    });

    const concurrentCheckout = async (idx: number) => {
      return orderRepo.createOrderWithStockDeduction(
        {
          user: { connect: { id: testUser.id } },
          status: OrderStatus.PENDING,
          subtotal: 100000,
          shippingFee: 0,
          total: 100000,
          recipientName: `Concurrency User ${idx}`,
          phone: testAddress.phone,
          addressLine: testAddress.addressLine,
          city: testAddress.city,
          province: testAddress.province,
          postalCode: testAddress.postalCode,
          items: {
            create: [
              {
                product: { connect: { id: testProduct.id } },
                quantity: 1,
                price: 100000,
                subtotal: 100000,
              },
            ],
          },
        },
        [{ productId: testProduct.id, quantity: 1 }],
      );
    };

    const concurrentResults = await Promise.allSettled([
      concurrentCheckout(1),
      concurrentCheckout(2),
    ]);

    const successes = concurrentResults.filter((r) => r.status === 'fulfilled');
    const failures = concurrentResults.filter((r) => r.status === 'rejected');

    const finalProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
    if (finalProduct!.stock < 0) {
      throw new Error(`CRITICAL: Product stock became negative: ${finalProduct!.stock}`);
    }
    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(`Expected exactly 1 checkout success and 1 failure, got ${successes.length} success and ${failures.length} fail`);
    }
    console.log(`[PHASE 3 - Test 5 PASSED] Exactly 1 checkout succeeded. Final stock: ${finalProduct!.stock} (never negative).`);

    // =========================================================================
    // PHASE 4: CART CONSISTENCY
    // =========================================================================
    console.log('\n[PHASE 4 - Test 6] Cart items cleared atomically on checkout...');
    let userCart = await prisma.cart.findUnique({ where: { userId: testUser.id } });
    if (!userCart) {
      userCart = await prisma.cart.create({ data: { userId: testUser.id } });
    }

    // Add item to cart
    await prisma.cartItem.create({
      data: {
        cartId: userCart.id,
        productId: testProduct.id,
        quantity: 1,
      },
    });

    const cartCountBefore = await prisma.cartItem.count({ where: { cartId: userCart.id } });
    if (cartCountBefore !== 1) {
      throw new Error('Failed to setup cart item before checkout test');
    }

    // Reset stock to 5 for test
    await prisma.product.update({ where: { id: testProduct.id }, data: { stock: 5 } });

    // Checkout with cartId passed
    await orderRepo.createOrderWithStockDeduction(
      {
        user: { connect: { id: testUser.id } },
        status: OrderStatus.PENDING,
        subtotal: 100000,
        shippingFee: 0,
        total: 100000,
        recipientName: testAddress.recipientName,
        phone: testAddress.phone,
        addressLine: testAddress.addressLine,
        city: testAddress.city,
        province: testAddress.province,
        postalCode: testAddress.postalCode,
        items: {
          create: [{ product: { connect: { id: testProduct.id } }, quantity: 1, price: 100000, subtotal: 100000 }],
        },
      },
      [{ productId: testProduct.id, quantity: 1 }],
      userCart.id,
    );

    const cartCountAfter = await prisma.cartItem.count({ where: { cartId: userCart.id } });
    if (cartCountAfter !== 0) {
      throw new Error(`Cart was not cleared after checkout! Remaining items: ${cartCountAfter}`);
    }
    console.log('[PHASE 4 - Test 6 PASSED] Cart was atomically cleared upon checkout success.');

    // =========================================================================
    // PHASE 6: ORDER BODY VALIDATION (SEC-02)
    // =========================================================================
    console.log('\n[PHASE 6 - Test 7] Runtime validation with OrderSchema...');
    const valid = OrderSchema.safeParse({ addressId: 10 });
    if (!valid.success) throw new Error('Valid payload was incorrectly rejected');

    const invalidNeg = OrderSchema.safeParse({ addressId: -5 });
    if (invalidNeg.success) throw new Error('Negative addressId was not rejected');

    const invalidString = OrderSchema.safeParse({ addressId: 'invalid' });
    if (invalidString.success) throw new Error('String addressId was not rejected');

    const invalidEmpty = OrderSchema.safeParse({});
    if (invalidEmpty.success) throw new Error('Empty payload was not rejected');

    console.log('[PHASE 6 - Test 7 PASSED] Order payload Zod schema correctly validates addressId.');

    console.log('\n--- ALL PHASES 2, 3, 4 & 6 TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    // Clean up test records
    await prisma.orderItem.deleteMany({ where: { order: { userId: testUser.id } } });
    await prisma.payment.deleteMany({ where: { order: { userId: testUser.id } } });
    await prisma.order.deleteMany({ where: { userId: testUser.id } });
    await prisma.cartItem.deleteMany({ where: { cart: { userId: testUser.id } } });
    await prisma.cart.deleteMany({ where: { userId: testUser.id } });
    await prisma.address.deleteMany({ where: { userId: testUser.id } });
    await prisma.productVariant.deleteMany({ where: { productId: testProduct.id } });
    await prisma.product.deleteMany({ where: { id: testProduct.id } });
    await prisma.category.deleteMany({ where: { id: testCategory.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
