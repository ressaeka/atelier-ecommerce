import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, OrderStatus, PaymentStatus, PaymentMethod, Role } from '../generated/prisma/client.js';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// 6 Kategori
const CATEGORIES = [
  'Aksesoris',
  'Atasan',
  'Sepatu',
  'Bawahan',
  'Dress',
  'Outerwear',
];

// 11 Produk
const PRODUCTS = [
  {
    name: 'Pearl Hair Clip Set',
    category: 'Aksesoris',
    price: 89000,
    image: '/images/products/pearl-hair-clip.jpg',
    description: 'Set jepit rambut mutiara elegan untuk berbagai gaya.',
  },
  {
    name: 'Poplin Shirt Classic',
    category: 'Atasan',
    price: 299000,
    image: '/images/products/poplin-shirt.jpg',
    description: 'Kemeja poplin katun klasik dengan siluet rapi dan nyaman.',
  },
  {
    name: 'Minimal Loafers',
    category: 'Sepatu',
    price: 654000,
    image: '/images/products/minimal-loafers.jpg',
    description:
      'Loafers kulit minimalis serbaguna untuk acara formal maupun kasual.',
  },
  {
    name: 'High-Waist Trousers',
    category: 'Bawahan',
    price: 384000,
    image: '/images/products/high-waist-trousers.jpg',
    description:
      'Celana panjang high-waist potongan tailored yang mempertegas siluet.',
  },
  {
    name: 'Ruffle Satin Blouse',
    category: 'Atasan',
    price: 354000,
    image: '/images/products/ruffle-satin-blouse.jpg',
    description: 'Blus satin lembut dengan aksen ruffle feminin dan anggun.',
  },
  {
    name: 'Silk Slip Dress',
    category: 'Dress',
    price: 699000,
    image: '/images/products/silk-slip-dress.jpg',
    description: 'Gaun slip sutra mewah dengan sentuhan kilau alami.',
  },
  {
    name: 'Knit Cardigan',
    category: 'Outerwear',
    price: 429000,
    image: '/images/products/knit-cardigan.jpg',
    description:
      'Kardigan rajut premium bertekstur lembut untuk kehangatan seharian.',
  },
  {
    name: 'Pleated Midi Skirt',
    category: 'Bawahan',
    price: 349000,
    image: '/images/products/pleated-midi-skirt.jpg',
    description: 'Rok midi lipit flowy dengan drape halus dan dinamis.',
  },
  {
    name: 'Linen Oversized Shirt',
    category: 'Atasan',
    price: 329000,
    image: '/images/products/linen-oversized-shirt.jpg',
    description:
      'Kemeja linen oversized bernapas dan nyaman untuk iklim tropis.',
  },
  {
    name: 'Floral Wrap Dress',
    category: 'Dress',
    price: 549000,
    image: '/images/products/floral-wrap-dress.jpg',
    description: 'Gaun lilit motif floral elegan dengan siluet flattering.',
  },
  {
    name: 'Classic Tailored Blazer',
    category: 'Outerwear',
    price: 789000,
    image: '/images/products/classic-blazer.jpg',
    description:
      'Blazer tailored berstruktur rapi dengan garis potong kontemporer.',
  },
];

// 18 Pelanggan
const CUSTOMERS = [
  {
    name: 'Alya Putri',
    email: 'alya.putri@gmail.com',
    phone: '+6281210000001',
    addressLine: 'Jl. Senopati No. 12',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12190',
  },
  {
    name: 'Bunga Lestari',
    email: 'bunga.lestari@gmail.com',
    phone: '+6281210000002',
    addressLine: 'Jl. Riau No. 45',
    city: 'Bandung',
    province: 'Jawa Barat',
    postalCode: '40115',
  },
  { name: 'Citra Dewi', email: 'citradewi@gmail.com', phone: '+6281210000003', addressLine: 'Jl. Darmo No. 88', city: 'Surabaya', province: 'Jawa Timur', postalCode: '60241' },
  { name: 'Dinda Maharani', email: 'dindamaharani@gmail.com', phone: '+6281210000004', addressLine: 'Jl. Kaliurang Km 5 No. 20', city: 'Sleman', province: 'DI Yogyakarta', postalCode: '55281' },
  { name: 'Eka Prasetya', email: 'ekaprasetya@gmail.com', phone: '+6281210000005', addressLine: 'Jl. Pandanaran No. 34', city: 'Semarang', province: 'Jawa Tengah', postalCode: '50134' },
  { name: 'Farah Nabila', email: 'farahnabila@gmail.com', phone: '+6281210000006', addressLine: 'Jl. Kemang Raya No. 18', city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12730' },
  { name: 'Gita Anjani', email: 'gitaanjani@gmail.com', phone: '+6281210000007', addressLine: 'Jl. Dago No. 102', city: 'Bandung', province: 'Jawa Barat', postalCode: '40132' },
  { name: 'Hana Safira', email: 'hanasafira@gmail.com', phone: '+6281210000008', addressLine: 'Jl. Manyar Kertoarjo No. 5', city: 'Surabaya', province: 'Jawa Timur', postalCode: '60118' },
  { name: 'Indah Permata', email: 'indahpermata@gmail.com', phone: '+6281210000009', addressLine: 'Jl. Malioboro No. 60', city: 'Yogyakarta', province: 'DI Yogyakarta', postalCode: '55271' },
  { name: 'Jessica Tanuwijaya', email: 'jessicatanuwijaya@gmail.com', phone: '+6281210000010', addressLine: 'Jl. Boulevard Gading Serpong No. 8', city: 'Tangerang', province: 'Banten', postalCode: '15810' },
  { name: 'Kevin Sanjaya', email: 'kevinsanjaya@gmail.com', phone: '+6281210000011', addressLine: 'Jl. Pluit Indah No. 22', city: 'Jakarta Utara', province: 'DKI Jakarta', postalCode: '14450' },
  { name: 'Larasati Putri', email: 'larasatiputri@gmail.com', phone: '+6281210000012', addressLine: 'Jl. Setiabudi No. 71', city: 'Bandung', province: 'Jawa Barat', postalCode: '40143' },
  { name: 'Maya Anggraini', email: 'mayaanggraini@gmail.com', phone: '+6281210000013', addressLine: 'Jl. HR Muhammad No. 15', city: 'Surabaya', province: 'Jawa Timur', postalCode: '60226' },
  { name: 'Nadia Rahma', email: 'nadiarahma@gmail.com', phone: '+6281210000014', addressLine: 'Jl. Palagan Tentara Pelajar No. 9', city: 'Sleman', province: 'DI Yogyakarta', postalCode: '55581' },
  { name: 'Olivia Santoso', email: 'oliviasantoso@gmail.com', phone: '+6281210000015', addressLine: 'Jl. Pemuda No. 90', city: 'Semarang', province: 'Jawa Tengah', postalCode: '50132' },
  { name: 'Putri Wulandari', email: 'putriwulandari@gmail.com', phone: '+6281210000016', addressLine: 'Jl. BSD Grand Boulevard No. 1', city: 'Tangerang Selatan', province: 'Banten', postalCode: '15339' },
  { name: 'Qiana Salsabila', email: 'qianasalsabila@gmail.com', phone: '+6281210000017', addressLine: 'Jl. Tebet Raya No. 40', city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12820' },
  { name: 'Rian Pratama', email: 'rianpratama@gmail.com', phone: '+6281210000018', addressLine: 'Jl. Buah Batu No. 55', city: 'Bandung', province: 'Jawa Barat', postalCode: '40265' },
];

// 30 Transaksi Mei - Oktober 2026
const TRANSACTIONS = [
  // MEI 2026 (5 pesanan)
  { id: 'ATL-001', date: '2026-05-03', customer: 'Alya Putri', product: 'Pearl Hair Clip Set', qty: 1, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-002', date: '2026-05-09', customer: 'Bunga Lestari', product: 'Poplin Shirt Classic', qty: 1, shippingFee: 20000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.GOPAY },
  { id: 'ATL-003', date: '2026-05-14', customer: 'Citra Dewi', product: 'Pearl Hair Clip Set', qty: 3, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.QRIS },
  { id: 'ATL-004', date: '2026-05-21', customer: 'Dinda Maharani', product: 'Poplin Shirt Classic', qty: 1, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-005', date: '2026-05-27', customer: 'Alya Putri', product: 'Poplin Shirt Classic', qty: 2, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.SHOPEEPAY },

  // JUNI 2026 (5 pesanan)
  { id: 'ATL-006', date: '2026-06-02', customer: 'Eka Prasetya', product: 'Minimal Loafers', qty: 3, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-007', date: '2026-06-08', customer: 'Farah Nabila', product: 'High-Waist Trousers', qty: 2, shippingFee: 15000, status: OrderStatus.CANCELLED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-008', date: '2026-06-15', customer: 'Bunga Lestari', product: 'Ruffle Satin Blouse', qty: 3, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.GOPAY },
  { id: 'ATL-009', date: '2026-06-22', customer: 'Gita Anjani', product: 'Ruffle Satin Blouse', qty: 1, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.QRIS },
  { id: 'ATL-010', date: '2026-06-28', customer: 'Hana Safira', product: 'Silk Slip Dress', qty: 1, shippingFee: 20000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },

  // JULI 2026 (5 pesanan)
  { id: 'ATL-011', date: '2026-07-04', customer: 'Citra Dewi', product: 'Knit Cardigan', qty: 1, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-012', date: '2026-07-10', customer: 'Indah Permata', product: 'Pleated Midi Skirt', qty: 2, shippingFee: 18000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.SHOPEEPAY },
  { id: 'ATL-013', date: '2026-07-16', customer: 'Jessica Tanuwijaya', product: 'Floral Wrap Dress', qty: 1, shippingFee: 22000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.GOPAY },
  { id: 'ATL-014', date: '2026-07-22', customer: 'Kevin Sanjaya', product: 'Linen Oversized Shirt', qty: 2, shippingFee: 16000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-015', date: '2026-07-28', customer: 'Larasati Putri', product: 'Classic Tailored Blazer', qty: 1, shippingFee: 25000, status: OrderStatus.CANCELLED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },

  // AGUSTUS 2026 (5 pesanan)
  { id: 'ATL-016', date: '2026-08-03', customer: 'Maya Anggraini', product: 'Pearl Hair Clip Set', qty: 4, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.QRIS },
  { id: 'ATL-017', date: '2026-08-09', customer: 'Nadia Rahma', product: 'High-Waist Trousers', qty: 1, shippingFee: 18000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-018', date: '2026-08-15', customer: 'Olivia Santoso', product: 'Poplin Shirt Classic', qty: 2, shippingFee: 20000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.GOPAY },
  { id: 'ATL-019', date: '2026-08-21', customer: 'Putri Wulandari', product: 'Minimal Loafers', qty: 1, shippingFee: 22000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-020', date: '2026-08-27', customer: 'Dinda Maharani', product: 'Silk Slip Dress', qty: 2, shippingFee: 25000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.SHOPEEPAY },

  // SEPTEMBER 2026 (5 pesanan)
  { id: 'ATL-021', date: '2026-09-02', customer: 'Qiana Salsabila', product: 'Ruffle Satin Blouse', qty: 2, shippingFee: 16000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.QRIS },
  { id: 'ATL-022', date: '2026-09-08', customer: 'Rian Pratama', product: 'Linen Oversized Shirt', qty: 1, shippingFee: 15000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-023', date: '2026-09-14', customer: 'Eka Prasetya', product: 'Classic Tailored Blazer', qty: 1, shippingFee: 24000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-024', date: '2026-09-20', customer: 'Farah Nabila', product: 'Floral Wrap Dress', qty: 2, shippingFee: 20000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.GOPAY },
  { id: 'ATL-025', date: '2026-09-26', customer: 'Gita Anjani', product: 'Pleated Midi Skirt', qty: 1, shippingFee: 18000, status: OrderStatus.DELIVERED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },

  // OKTOBER 2026 (5 pesanan)
  { id: 'ATL-026', date: '2026-10-02', customer: 'Hana Safira', product: 'Knit Cardigan', qty: 2, shippingFee: 20000, status: OrderStatus.SHIPPED, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-027', date: '2026-10-09', customer: 'Indah Permata', product: 'Poplin Shirt Classic', qty: 3, shippingFee: 22000, status: OrderStatus.SHIPPED, paymentMethod: PaymentMethod.GOPAY },
  { id: 'ATL-028', date: '2026-10-15', customer: 'Jessica Tanuwijaya', product: 'Minimal Loafers', qty: 1, shippingFee: 20000, status: OrderStatus.PROCESSING, paymentMethod: PaymentMethod.QRIS },
  { id: 'ATL-029', date: '2026-10-21', customer: 'Kevin Sanjaya', product: 'Pearl Hair Clip Set', qty: 2, shippingFee: 15000, status: OrderStatus.PROCESSING, paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT },
  { id: 'ATL-030', date: '2026-10-27', customer: 'Maya Anggraini', product: 'Silk Slip Dress', qty: 1, shippingFee: 22000, status: OrderStatus.PROCESSING, paymentMethod: PaymentMethod.SHOPEEPAY },
];

async function seedMasterData() {
  console.log('\n--- 1. MENYIAPKAN MASTER KATEGORI (6) ---');
  const categoryMap = new Map<string, number>();
  for (const catName of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    });
    categoryMap.set(catName, cat.id);
    console.log(`  [Category] ${cat.name} (ID: ${cat.id})`);
  }

  console.log('\n--- 2. MENYIAPKAN MASTER PRODUK (11) ---');
  const productMap = new Map<string, { id: number; price: number }>();
  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) {
      throw new Error(`Category ${p.category} not found for product ${p.name}`);
    }

    let prod = await prisma.product.findFirst({
      where: { name: p.name },
    });

    if (prod) {
      prod = await prisma.product.update({
        where: { id: prod.id },
        data: {
          price: p.price,
          categoryId,
          isActive: true,
          description: p.description,
          image: p.image,
        },
      });
    } else {
      prod = await prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          stock: 50,
          isActive: true,
          image: p.image,
          description: p.description,
          categoryId,
        },
      });
    }

    productMap.set(prod.name, { id: prod.id, price: prod.price });
    console.log(`  [Product] ${prod.name} - Rp${prod.price.toLocaleString('id-ID')} (Cat ID: ${categoryId}, Prod ID: ${prod.id})`);
  }

  console.log('\n--- 3. MENYIAPKAN MASTER PELANGGAN (18) ---');
  const customerMap = new Map<string, { id: number; user: typeof CUSTOMERS[0] }>();
  const defaultPasswordHash = await bcrypt.hash('Customer123!', 10);

  for (const c of CUSTOMERS) {
    const username = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: Role.USER,
      },
      create: {
        name: c.name,
        username,
        email: c.email,
        phone: c.phone,
        password: defaultPasswordHash,
        role: Role.USER,
      },
    });

    // Ensure default Address
    const existingAddress = await prisma.address.findFirst({
      where: { userId: user.id },
    });

    if (!existingAddress) {
      await prisma.address.create({
        data: {
          userId: user.id,
          label: 'Rumah',
          recipientName: c.name,
          phone: c.phone,
          addressLine: c.addressLine,
          city: c.city,
          province: c.province,
          postalCode: c.postalCode,
          isDefault: true,
        },
      });
    }

    customerMap.set(c.name, { id: user.id, user: c });
    console.log(`  [Customer] ${user.name} - ${user.email} (User ID: ${user.id})`);
  }

  return { categoryMap, productMap, customerMap };
}

async function seedTransactions(
  productMap: Map<string, { id: number; price: number }>,
  customerMap: Map<string, { id: number; user: typeof CUSTOMERS[0] }>,
) {
  console.log('\n--- 4. MENYIAPKAN 30 TRANSAKSI (ATL-001 s/d ATL-030) ---');
  let inserted = 0;
  let updated = 0;

  for (const tx of TRANSACTIONS) {
    const custInfo = customerMap.get(tx.customer);
    if (!custInfo) throw new Error(`Customer not found: ${tx.customer}`);

    const prodInfo = productMap.get(tx.product);
    if (!prodInfo) throw new Error(`Product not found: ${tx.product}`);

    const subtotal = prodInfo.price * tx.qty;
    const total = subtotal + tx.shippingFee;

    // Set time to 10:00:00 WIB (03:00:00 UTC)
    const orderDate = new Date(`${tx.date}T03:00:00.000Z`);

    // Check if order exists by orderNumber
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: tx.id },
      include: { items: true, payments: true },
    });

    await prisma.$transaction(async (txPrisma) => {
      let orderId: number;

      if (existingOrder) {
        orderId = existingOrder.id;
        await txPrisma.order.update({
          where: { id: orderId },
          data: {
            userId: custInfo.id,
            status: tx.status,
            subtotal,
            shippingFee: tx.shippingFee,
            total,
            recipientName: custInfo.user.name,
            phone: custInfo.user.phone,
            addressLine: custInfo.user.addressLine,
            city: custInfo.user.city,
            province: custInfo.user.province,
            postalCode: custInfo.user.postalCode,
            createdAt: orderDate,
            updatedAt: orderDate,
          },
        });

        // Delete old items and recreation for clean state
        await txPrisma.orderItem.deleteMany({ where: { orderId } });
        await txPrisma.orderItem.create({
          data: {
            orderId,
            productId: prodInfo.id,
            quantity: tx.qty,
            price: prodInfo.price,
            subtotal,
            createdAt: orderDate,
            updatedAt: orderDate,
          },
        });

        // Payment
        const paymentStatus =
          tx.status === OrderStatus.CANCELLED
            ? PaymentStatus.CANCELLED
            : PaymentStatus.PAID;

        await txPrisma.payment.deleteMany({ where: { orderId } });
        await txPrisma.payment.create({
          data: {
            orderId,
            midtransOrderId: tx.id,
            paymentMethod: tx.paymentMethod,
            status: paymentStatus,
            grossAmount: total,
            createdAt: orderDate,
            updatedAt: orderDate,
          },
        });

        updated++;
      } else {
        const paymentStatus =
          tx.status === OrderStatus.CANCELLED
            ? PaymentStatus.CANCELLED
            : PaymentStatus.PAID;

        const newOrder = await txPrisma.order.create({
          data: {
            orderNumber: tx.id,
            userId: custInfo.id,
            status: tx.status,
            subtotal,
            shippingFee: tx.shippingFee,
            total,
            recipientName: custInfo.user.name,
            phone: custInfo.user.phone,
            addressLine: custInfo.user.addressLine,
            city: custInfo.user.city,
            province: custInfo.user.province,
            postalCode: custInfo.user.postalCode,
            createdAt: orderDate,
            updatedAt: orderDate,
            items: {
              create: [
                {
                  productId: prodInfo.id,
                  quantity: tx.qty,
                  price: prodInfo.price,
                  subtotal,
                  createdAt: orderDate,
                  updatedAt: orderDate,
                },
              ],
            },
            payments: {
              create: [
                {
                  midtransOrderId: tx.id,
                  paymentMethod: tx.paymentMethod,
                  status: paymentStatus,
                  grossAmount: total,
                  createdAt: orderDate,
                  updatedAt: orderDate,
                },
              ],
            },
          },
        });

        orderId = newOrder.id;
        inserted++;
      }
    });

    console.log(`  [Order] ${tx.id} (${tx.date}) - ${tx.customer} | ${tx.product} (x${tx.qty}) | Total: Rp${total.toLocaleString('id-ID')} | Status: ${tx.status}`);
  }

  console.log(`\nTransaksi selesai diproses: ${inserted} dibuat baru, ${updated} diperbarui.`);
}

async function verifyDataset() {
  console.log('\n=============================================');
  console.log('         VERIFIKASI INTEGRITAS DATA          ');
  console.log('=============================================');

  const orders = await prisma.order.findMany({
    where: {
      orderNumber: { startsWith: 'ATL-' },
    },
    include: {
      user: true,
      items: { include: { product: { include: { category: true } } } },
      payments: true,
    },
    orderBy: { orderNumber: 'asc' },
  });

  console.log(`Total Orders ATL: ${orders.length} (Ekspektasi: 30)`);

  const uniqueCusts = new Set(orders.map((o) => o.userId));
  console.log(`Unique Customers: ${uniqueCusts.size} (Ekspektasi: 18)`);

  const uniqueProds = new Set();
  const uniqueCats = new Set();
  let grossSum = 0;
  let cancelledSum = 0;
  let revenueSum = 0;

  const statusCount: Record<string, number> = {};
  const monthlyCount: Record<string, { count: number; total: number; revenue: number }> = {};

  for (const o of orders) {
    statusCount[o.status] = (statusCount[o.status] || 0) + 1;
    grossSum += o.total;

    const monthKey = o.createdAt.toISOString().slice(0, 7);
    if (!monthlyCount[monthKey]) {
      monthlyCount[monthKey] = { count: 0, total: 0, revenue: 0 };
    }
    monthlyCount[monthKey].count += 1;
    monthlyCount[monthKey].total += o.total;

    if (o.status === OrderStatus.CANCELLED) {
      cancelledSum += o.total;
    } else {
      revenueSum += o.total;
      monthlyCount[monthKey].revenue += o.total;
    }

    for (const it of o.items) {
      uniqueProds.add(it.productId);
      if (it.product?.category) {
        uniqueCats.add(it.product.category.name);
      }
    }
  }

  console.log(`Unique Products: ${uniqueProds.size} (Ekspektasi: 11)`);
  console.log(`Unique Categories: ${uniqueCats.size} (Ekspektasi: 6)`);
  console.log(`Status Breakdown:`, statusCount);
  console.log(`  - Selesai (DELIVERED): ${statusCount.DELIVERED || 0} (Ekspektasi: 23)`);
  console.log(`  - Dibatalkan (CANCELLED): ${statusCount.CANCELLED || 0} (Ekspektasi: 2)`);
  console.log(`  - Dikirim (SHIPPED): ${statusCount.SHIPPED || 0} (Ekspektasi: 2)`);
  console.log(`  - Diproses (PROCESSING): ${statusCount.PROCESSING || 0} (Ekspektasi: 3)`);
  console.log(`\nMonthly Breakdown:`);
  for (const [m, stat] of Object.entries(monthlyCount)) {
    console.log(`  - ${m}: ${stat.count} pesanan | Gross: Rp${stat.total.toLocaleString('id-ID')} | Revenue: Rp${stat.revenue.toLocaleString('id-ID')}`);
  }

  console.log(`\nFinansial:`);
  console.log(`  - Total Gross: Rp${grossSum.toLocaleString('id-ID')} (Ekspektasi: Rp20.017.000)`);
  console.log(`  - Total Dibatalkan: Rp${cancelledSum.toLocaleString('id-ID')} (Ekspektasi: Rp1.597.000)`);
  console.log(`  - Total Recognized Revenue: Rp${revenueSum.toLocaleString('id-ID')} (Ekspektasi: Rp18.420.000)`);
  console.log('=============================================\n');
}

async function main() {
  console.log('MEMULAI SEEDING DATASET RISET TRANSAKSI ATELIER...');
  const { categoryMap, productMap, customerMap } = await seedMasterData();
  await seedTransactions(productMap, customerMap);
  await verifyDataset();
}

main()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
