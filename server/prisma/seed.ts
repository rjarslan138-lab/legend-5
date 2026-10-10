import { PrismaClient, UserRole, CustomerType, OrderStatus, PaymentStatus, PaymentMethod, MovementType, PlanTier } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GarmentFlow database seed...');

  // Clean existing tables in reverse dependency order
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.fabricBatch.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Garments, Faisalabad',
      plan: PlanTier.STARTER,
    },
  });
  console.log(`🏢 Created Organization: ${org.name} (${org.id})`);

  // 2. Users for each role
  const passwordHash = await bcrypt.hash('Password@123', 12);

  const owner = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Mian Tariq (Owner)',
      email: 'owner@garmentflow.pk',
      passwordHash,
      role: UserRole.OWNER,
    },
  });

  const storekeeper = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Rashid Mahmood (Storekeeper)',
      email: 'storekeeper@garmentflow.pk',
      passwordHash,
      role: UserRole.STOREKEEPER,
    },
  });

  const productionUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Umer Farooq (Production Supervisor)',
      email: 'production@garmentflow.pk',
      passwordHash,
      role: UserRole.PRODUCTION,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Hamza Khan (Sales Manager)',
      email: 'sales@garmentflow.pk',
      passwordHash,
      role: UserRole.SALES,
    },
  });
  console.log('👥 Created Users: OWNER, STOREKEEPER, PRODUCTION, SALES');

  // 3. Warehouses & Locations
  const warehouse1 = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      name: 'Main Factory Warehouse (Faisalabad)',
      address: 'Plot 42, Small Industrial Estate, Faisalabad',
    },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      name: 'Karachi Dispatch Hub',
      address: 'S.I.T.E. Industrial Area, Karachi',
    },
  });

  const locA01 = await prisma.location.create({
    data: { warehouseId: warehouse1.id, code: 'A-01 / Rack 1', description: 'Raw Fabric & Yarn Stores' },
  });
  const locA02 = await prisma.location.create({
    data: { warehouseId: warehouse1.id, code: 'A-02 / Rack 2', description: 'WIP Assembly & Cutting Area' },
  });
  const locA03 = await prisma.location.create({
    data: { warehouseId: warehouse1.id, code: 'A-03 / Rack 7', description: 'Finished Goods - Deck Rack' },
  });
  const locB01 = await prisma.location.create({
    data: { warehouseId: warehouse2.id, code: 'B-01 / Rack 1', description: 'Transit Holding & Logistics' },
  });
  const locB02 = await prisma.location.create({
    data: { warehouseId: warehouse2.id, code: 'B-02 / Rack 4', description: 'Wholesale Dispatch Pallets' },
  });
  console.log('🏭 Created 2 Warehouses and 5 Locations');

  // 4. Fabric Batches (6 batches)
  const batch2409 = await prisma.fabricBatch.create({
    data: {
      organizationId: org.id,
      batchCode: 'B-2409',
      fabricType: 'Heavy Fleece (320 GSM)',
      color: 'Navy Blue',
      supplier: 'Sitara Textiles Ltd, Faisalabad',
      rollCount: 4,
      weightKg: 42.0,
      lengthMeters: 140.0,
      costPerUnit: 1250.0, // PKR per kg
      wastageKg: 2.5,
      notes: 'Deck reference batch: High quality brushed fleece',
    },
  });

  const batch2410 = await prisma.fabricBatch.create({
    data: {
      organizationId: org.id,
      batchCode: 'B-2410',
      fabricType: 'Single Jersey (180 GSM)',
      color: 'Heather Grey',
      supplier: 'Kohinoor Mills, Rawalpindi',
      rollCount: 6,
      weightKg: 120.0,
      lengthMeters: 480.0,
      costPerUnit: 980.0,
      wastageKg: 4.0,
      notes: 'Pre-shrunk comb cotton',
    },
  });

  const batch2411 = await prisma.fabricBatch.create({
    data: {
      organizationId: org.id,
      batchCode: 'B-2411',
      fabricType: 'Cotton Terry (280 GSM)',
      color: 'Pitch Black',
      supplier: 'Ibrahim Fibres, Faisalabad',
      rollCount: 5,
      weightKg: 95.0,
      lengthMeters: 310.0,
      costPerUnit: 1100.0,
      wastageKg: 3.2,
      notes: 'Export standard dye lot',
    },
  });

  const batch2412 = await prisma.fabricBatch.create({
    data: {
      organizationId: org.id,
      batchCode: 'B-2412',
      fabricType: 'Pique Cotton (220 GSM)',
      color: 'Maroon',
      supplier: 'Nishat Mills, Lahore',
      rollCount: 3,
      weightKg: 65.0,
      lengthMeters: 220.0,
      costPerUnit: 1050.0,
      wastageKg: 1.8,
      notes: 'Polo shirt fabric lot',
    },
  });

  const batch2413 = await prisma.fabricBatch.create({
    data: {
      organizationId: org.id,
      batchCode: 'B-2413',
      fabricType: 'Rib Knit (240 GSM)',
      color: 'Navy Blue',
      supplier: 'Crescent Textile Mills',
      rollCount: 2,
      weightKg: 35.0,
      lengthMeters: 110.0,
      costPerUnit: 1180.0,
      wastageKg: 0.8,
      notes: 'Collar & cuff trim ribbed fabric',
    },
  });

  const batch2414 = await prisma.fabricBatch.create({
    data: {
      organizationId: org.id,
      batchCode: 'B-2414',
      fabricType: 'Interlock Cotton (200 GSM)',
      color: 'Olive Green',
      supplier: 'Artistic Milliners, Karachi',
      rollCount: 4,
      weightKg: 85.0,
      lengthMeters: 300.0,
      costPerUnit: 1150.0,
      wastageKg: 2.1,
      notes: 'Kids loungewear knit',
    },
  });
  console.log('🧵 Created 6 Fabric Batches including B-2409');

  // 5. Products & Variants (8 Products with size matrices)
  // Product 1: Kids Fleece Hoodie (Containing Product SKU 92204)
  const prod1 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Kids Fleece Hoodie',
      skuPrefix: 'KFH',
      category: 'Kids Wear',
      description: 'Warm winter hoodie with ribbed cuffs and kangaroo pocket',
      basePrice: 1850.0,
    },
  });

  // Specifically create SKU "92204" matching deck card:
  // Product 92204 / SHOP-1842 / A-03 Rack 7 / Pending / B-2409
  const sku92204 = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod1.id,
      sku: '92204',
      size: '0–5Y',
      color: 'Navy Blue',
      fabricBatchId: batch2409.id,
      price: 1850.0,
      costPrice: 920.0,
      reorderLevel: 25,
    },
  });

  const variant1B = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod1.id,
      sku: '92205',
      size: '6–10Y',
      color: 'Navy Blue',
      fabricBatchId: batch2409.id,
      price: 2100.0,
      costPrice: 1050.0,
      reorderLevel: 20,
    },
  });

  const variant1C = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod1.id,
      sku: '92206',
      size: '11–14Y',
      color: 'Navy Blue',
      fabricBatchId: batch2409.id,
      price: 2350.0,
      costPrice: 1180.0,
      reorderLevel: 15,
    },
  });

  // Product 2: Men Basic Crewneck Sweatshirt
  const prod2 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Men Crewneck Sweatshirt',
      skuPrefix: 'MCS',
      category: 'Men Wear',
      description: 'Classic cotton fleece sweatshirt',
      basePrice: 2200.0,
    },
  });

  const variant2A = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod2.id,
      sku: 'MCS-M-GRY',
      size: 'M',
      color: 'Heather Grey',
      fabricBatchId: batch2410.id,
      price: 2200.0,
      costPrice: 1100.0,
      reorderLevel: 30,
    },
  });

  const variant2B = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod2.id,
      sku: 'MCS-L-GRY',
      size: 'L',
      color: 'Heather Grey',
      fabricBatchId: batch2410.id,
      price: 2200.0,
      costPrice: 1100.0,
      reorderLevel: 30,
    },
  });

  // Product 3: Men Classic Polo
  const prod3 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Men Classic Pique Polo',
      skuPrefix: 'MCP',
      category: 'Men Wear',
      description: 'Pique knit short sleeve polo',
      basePrice: 1650.0,
    },
  });

  const variant3A = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod3.id,
      sku: 'MCP-M-MRN',
      size: 'M',
      color: 'Maroon',
      fabricBatchId: batch2412.id,
      price: 1650.0,
      costPrice: 820.0,
      reorderLevel: 20,
    },
  });

  const variant3B = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod3.id,
      sku: 'MCP-L-MRN',
      size: 'L',
      color: 'Maroon',
      fabricBatchId: batch2412.id,
      price: 1650.0,
      costPrice: 820.0,
      reorderLevel: 20,
    },
  });

  // Product 4: Terry Jogger Pants
  const prod4 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Terry Jogger Pants',
      skuPrefix: 'TJP',
      category: 'Athleisure',
      description: 'Heavy terry joggers with drawstring waistband',
      basePrice: 1950.0,
    },
  });

  const variant4A = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod4.id,
      sku: 'TJP-M-BLK',
      size: 'M',
      color: 'Pitch Black',
      fabricBatchId: batch2411.id,
      price: 1950.0,
      costPrice: 950.0,
      reorderLevel: 25,
    },
  });

  const variant4B = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod4.id,
      sku: 'TJP-L-BLK',
      size: 'L',
      color: 'Pitch Black',
      fabricBatchId: batch2411.id,
      price: 1950.0,
      costPrice: 950.0,
      reorderLevel: 25,
    },
  });

  // Product 5: Toddler Thermal Pajama Set
  const prod5 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Toddler Thermal Pajama Set',
      skuPrefix: 'TPS',
      category: 'Kids Wear',
      description: '2-piece soft thermal sleep set',
      basePrice: 1450.0,
    },
  });

  const variant5A = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod5.id,
      sku: 'TPS-0-3Y-GRN',
      size: '0–5Y',
      color: 'Olive Green',
      fabricBatchId: batch2414.id,
      price: 1450.0,
      costPrice: 700.0,
      reorderLevel: 15,
    },
  });

  // Product 6: Heavyweight Oversized Tee
  const prod6 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Heavyweight Oversized Tee',
      skuPrefix: 'HOT',
      category: 'Unisex',
      description: '240 GSM drop shoulder tee',
      basePrice: 1250.0,
    },
  });

  const variant6A = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod6.id,
      sku: 'HOT-XL-GRY',
      size: 'XL',
      color: 'Heather Grey',
      fabricBatchId: batch2410.id,
      price: 1250.0,
      costPrice: 580.0,
      reorderLevel: 30,
    },
  });

  // Product 7: Women Fleece Zip Jacket
  const prod7 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Women Fleece Zip Jacket',
      skuPrefix: 'WFZ',
      category: 'Women Wear',
      description: 'Full zip warm fleece jacket',
      basePrice: 2400.0,
    },
  });

  const variant7A = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod7.id,
      sku: 'WFZ-S-NVY',
      size: 'S',
      color: 'Navy Blue',
      fabricBatchId: batch2409.id,
      price: 2400.0,
      costPrice: 1200.0,
      reorderLevel: 15,
    },
  });

  // Product 8: Ribbed Knit Beanie
  const prod8 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Ribbed Knit Beanie',
      skuPrefix: 'RKB',
      category: 'Accessories',
      description: 'Winter cap',
      basePrice: 650.0,
    },
  });

  const variant8A = await prisma.productVariant.create({
    data: {
      organizationId: org.id,
      productId: prod8.id,
      sku: 'RKB-FREE-NVY',
      size: 'Free Size',
      color: 'Navy Blue',
      fabricBatchId: batch2413.id,
      price: 650.0,
      costPrice: 280.0,
      reorderLevel: 40,
    },
  });
  console.log('👕 Created 8 Products and 13 Variants (including SKU 92204)');

  // 6. Stock Intake into Locations
  // Specifically: SKU 92204 in A-03 / Rack 7 (Deck reference)
  await prisma.stockItem.create({
    data: { variantId: sku92204.id, locationId: locA03.id, quantity: 185 },
  });
  await prisma.stockMovement.create({
    data: {
      organizationId: org.id,
      variantId: sku92204.id,
      toLocationId: locA03.id,
      quantity: 185,
      type: MovementType.RECEIVE,
      reference: 'Production Batch Completion - Deck SKU 92204',
      createdBy: storekeeper.id,
    },
  });

  await prisma.stockItem.create({
    data: { variantId: variant1B.id, locationId: locA03.id, quantity: 140 },
  });
  await prisma.stockItem.create({
    data: { variantId: variant1C.id, locationId: locA03.id, quantity: 12 }, // Low stock!
  });
  await prisma.stockItem.create({
    data: { variantId: variant2A.id, locationId: locA02.id, quantity: 95 },
  });
  await prisma.stockItem.create({
    data: { variantId: variant2B.id, locationId: locB01.id, quantity: 160 },
  });
  await prisma.stockItem.create({
    data: { variantId: variant3A.id, locationId: locA03.id, quantity: 110 },
  });
  await prisma.stockItem.create({
    data: { variantId: variant3B.id, locationId: locB02.id, quantity: 80 },
  });
  await prisma.stockItem.create({
    data: { variantId: variant4A.id, locationId: locA03.id, quantity: 210 },
  });
  await prisma.stockItem.create({
    data: { variantId: variant4B.id, locationId: locB01.id, quantity: 14 }, // Low stock!
  });
  await prisma.stockItem.create({
    data: { variantId: variant5A.id, locationId: locA03.id, quantity: 75 },
  });
  await prisma.stockItem.create({
    data: { variantId: variant6A.id, locationId: locA02.id, quantity: 250 },
  });
  await prisma.stockItem.create({
    data: { variantId: variant7A.id, locationId: locA03.id, quantity: 45 },
  });
  await prisma.stockItem.create({
    data: { variantId: variant8A.id, locationId: locA03.id, quantity: 320 },
  });
  console.log('📦 Initialized stock in locations with ledger movements');

  // 7. Customers (10 Customers: Shops + Wholesalers)
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Al-Karam Kids Boutique',
        type: CustomerType.SHOP,
        phone: '0300-8451234',
        city: 'Faisalabad',
        address: 'D-Ground Commercial Area, Shop 14',
        creditLimit: 300000,
        notes: 'Deck reference customer for order SHOP-1842',
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Lahore Wholesale Garments Mart',
        type: CustomerType.WHOLESALER,
        phone: '0321-9988771',
        city: 'Lahore',
        address: 'Shah Alam Market, Lahore',
        creditLimit: 2500000,
        notes: 'Major Punjab wholesale distributor',
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Karachi Central Traders',
        type: CustomerType.WHOLESALER,
        phone: '0333-1234567',
        city: 'Karachi',
        address: 'Boulton Market, Karachi',
        creditLimit: 3000000,
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Royal Fashion Hub',
        type: CustomerType.SHOP,
        phone: '0312-3456789',
        city: 'Rawalpindi',
        address: 'Bank Road, Saddar',
        creditLimit: 400000,
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Multan Garment Center',
        type: CustomerType.SHOP,
        phone: '0301-7654321',
        city: 'Multan',
        address: 'Hussain Agahi Bazaar',
        creditLimit: 350000,
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Peshawar Silk & Cotton',
        type: CustomerType.WHOLESALER,
        phone: '0345-9876543',
        city: 'Peshawar',
        address: 'Karkhano Market',
        creditLimit: 1500000,
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Gujranwala Retail Corner',
        type: CustomerType.SHOP,
        phone: '0322-4455667',
        city: 'Gujranwala',
        address: 'Satellite Town Market',
        creditLimit: 250000,
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Islamabad Style Zone',
        type: CustomerType.SHOP,
        phone: '0308-5566778',
        city: 'Islamabad',
        address: 'F-7 Markaz, Shop 2B',
        creditLimit: 500000,
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Sialkot Sports & Casuals',
        type: CustomerType.WHOLESALER,
        phone: '0334-1122334',
        city: 'Sialkot',
        address: 'Defence Road',
        creditLimit: 1200000,
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Hyderabad Cloth House',
        type: CustomerType.SHOP,
        phone: '0315-9900112',
        city: 'Hyderabad',
        address: 'Resham Gali',
        creditLimit: 300000,
      },
    }),
  ]);
  console.log('🏪 Created 10 Customers across Pakistan');

  // 8. Orders (~30 orders with mixed statuses and payments)
  // Specific deck example order: SHOP-1842 for Al-Karam Kids Boutique with SKU 92204, Pending Payment!
  const shop1842 = await prisma.order.create({
    data: {
      organizationId: org.id,
      orderNo: 'SHOP-1842',
      orderSeq: 1842,
      customerId: customers[0].id,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: 111000.0, // 60 pcs * 1850
      paidAmount: 0.0,
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: salesUser.id,
      notes: 'Deck reference order: Product 92204 / SHOP-1842 / A-03 Rack 7 / Pending',
      items: {
        create: [
          {
            variantId: sku92204.id,
            quantity: 60,
            unitPrice: 1850.0,
            lineTotal: 111000.0,
          },
        ],
      },
    },
  });

  // Track stock deduction movement for confirmed order SHOP-1842
  await prisma.stockMovement.create({
    data: {
      organizationId: org.id,
      variantId: sku92204.id,
      fromLocationId: locA03.id,
      quantity: 60,
      type: MovementType.SALE,
      reference: 'Order SHOP-1842',
      createdBy: salesUser.id,
    },
  });

  // Generate ~29 more diverse orders across past 5 months to populate dashboard charts and tables
  const orderStatuses = [
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DISPATCHED,
    OrderStatus.PACKED,
    OrderStatus.CONFIRMED,
    OrderStatus.DRAFT,
  ];

  const allVariants = [
    sku92204, variant1B, variant1C, variant2A, variant2B,
    variant3A, variant3B, variant4A, variant4B, variant5A,
    variant6A, variant7A, variant8A,
  ];

  for (let i = 1; i <= 29; i++) {
    const custIndex = i % customers.length;
    const cust = customers[custIndex];
    const status = orderStatuses[i % orderStatuses.length];
    const seq = 1800 + i;
    const prefix = cust.type === CustomerType.SHOP ? 'SHOP' : 'WHL';
    const orderNo = `${prefix}-${seq}`;

    // Stagger dates over last 150 days
    const daysAgo = Math.floor(Math.random() * 140);
    const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Pick 1-3 items
    const itemCount = 1 + (i % 3);
    let orderTotal = 0;
    const orderItemsData = [];

    for (let j = 0; j < itemCount; j++) {
      const v = allVariants[(i + j * 3) % allVariants.length];
      const qty = cust.type === CustomerType.WHOLESALER ? (20 + (i % 5) * 15) : (10 + (i % 4) * 5);
      const lineTotal = qty * v.price;
      orderTotal += lineTotal;
      orderItemsData.push({
        variantId: v.id,
        quantity: qty,
        unitPrice: v.price,
        lineTotal,
      });
    }

    // Determine payment
    let paidAmount = 0;
    let paymentStatus = PaymentStatus.PENDING;
    const paymentsToCreate = [];

    if (status === OrderStatus.DELIVERED) {
      if (i % 4 === 0) {
        // Partial
        paidAmount = Math.round(orderTotal * 0.5);
        paymentStatus = PaymentStatus.PARTIAL;
        paymentsToCreate.push({
          organizationId: org.id,
          amount: paidAmount,
          method: PaymentMethod.BANK,
          receivedAt: new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          note: 'Advance 50% transfer via Meezan Bank',
        });
      } else {
        // Fully Paid
        paidAmount = orderTotal;
        paymentStatus = PaymentStatus.PAID;
        paymentsToCreate.push({
          organizationId: org.id,
          amount: orderTotal,
          method: i % 2 === 0 ? PaymentMethod.BANK : PaymentMethod.CASH,
          receivedAt: new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000),
          note: 'Full settlement upon delivery',
        });
      }
    } else if (status === OrderStatus.DISPATCHED || status === OrderStatus.PACKED) {
      if (i % 2 === 0) {
        paidAmount = Math.round(orderTotal * 0.3);
        paymentStatus = PaymentStatus.PARTIAL;
        paymentsToCreate.push({
          organizationId: org.id,
          amount: paidAmount,
          method: PaymentMethod.JAZZCASH,
          receivedAt: new Date(orderDate.getTime() + 1 * 24 * 60 * 60 * 1000),
          note: 'Token advance via JazzCash',
        });
      }
    }

    const createdOrder = await prisma.order.create({
      data: {
        organizationId: org.id,
        orderNo,
        orderSeq: seq,
        customerId: cust.id,
        status,
        paymentStatus,
        totalAmount: orderTotal,
        paidAmount,
        deliveryDate: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        createdBy: salesUser.id,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: orderItemsData,
        },
      },
    });

    for (const p of paymentsToCreate) {
      await prisma.payment.create({
        data: {
          ...p,
          orderId: createdOrder.id,
        },
      });
    }
  }

  console.log(`📋 Created 30 Orders with payments and deck trace card SHOP-1842!`);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
