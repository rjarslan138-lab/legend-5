import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

describe('Order Lifecycle, Stock Deduction & Payment Tests', () => {
  let token = '';
  let orgId = '';
  let customerId = '';
  let variantId = '';
  let locId = '';
  let orderId = '';

  beforeAll(async () => {
    // Register owner
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        organizationName: 'Order Test Garments',
        name: 'Order Owner',
        email: `order_owner_${Date.now()}@test.com`,
        password: 'Password@123',
      });

    token = regRes.body.data.accessToken;
    orgId = regRes.body.data.user.organizationId;

    // Get location
    const whRes = await request(app)
      .get('/api/v1/warehouses')
      .set('Authorization', `Bearer ${token}`);
    locId = whRes.body.data[0].locations[0].id;

    // Create customer
    const custRes = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Target Shop Faisalabad',
        phone: '0300-1122334',
        city: 'Faisalabad',
        type: 'SHOP',
      });
    customerId = custRes.body.data.id;

    // Create product & variant
    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Export Polo Shirt',
        skuPrefix: 'EPS',
        category: 'Men',
        basePrice: 1500,
        variants: [
          {
            sku: `EPS-M-${Date.now()}`,
            size: 'M',
            color: 'Navy',
            price: 1500,
            costPrice: 750,
            reorderLevel: 5,
          },
        ],
      });
    variantId = prodRes.body.data.variants[0].id;

    // Receive stock (40 units)
    await request(app)
      .post('/api/v1/stock/receive')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variantId,
        locationId: locId,
        quantity: 40,
      });
  });

  afterAll(async () => {
    if (orgId) {
      await prisma.payment.deleteMany({ where: { organizationId: orgId } });
      await prisma.orderItem.deleteMany({ where: { order: { organizationId: orgId } } });
      await prisma.order.deleteMany({ where: { organizationId: orgId } });
      await prisma.stockMovement.deleteMany({ where: { organizationId: orgId } });
      await prisma.stockItem.deleteMany({ where: { variant: { organizationId: orgId } } });
      await prisma.productVariant.deleteMany({ where: { organizationId: orgId } });
      await prisma.product.deleteMany({ where: { organizationId: orgId } });
      await prisma.customer.deleteMany({ where: { organizationId: orgId } });
      await prisma.location.deleteMany({ where: { warehouse: { organizationId: orgId } } });
      await prisma.warehouse.deleteMany({ where: { organizationId: orgId } });
      await prisma.user.deleteMany({ where: { organizationId: orgId } });
      await prisma.organization.deleteMany({ where: { id: orgId } });
    }
    await prisma.$disconnect();
  });

  it('should create an order in DRAFT status', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        items: [
          {
            variantId,
            quantity: 10,
            unitPrice: 1500,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.paymentStatus).toBe('PENDING');
    expect(res.body.data.totalAmount).toBe(15000);
    orderId = res.body.data.id;
  });

  it('should confirm order and deduct stock atomically', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');

    // Verify stock is deducted: was 40, ordered 10 -> remaining 30
    const stockRes = await request(app)
      .get(`/api/v1/stock?variantId=${variantId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(stockRes.body.data[0].quantity).toBe(30);
  });

  it('should record partial payment and update paymentStatus to PARTIAL', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 5000,
        method: 'CASH',
        note: 'Advance deposit',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.order.paidAmount).toBe(5000);
    expect(res.body.data.order.paymentStatus).toBe('PARTIAL');
  });

  it('should record remaining payment and update paymentStatus to PAID', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 10000,
        method: 'BANK',
        note: 'Final settlement',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.order.paidAmount).toBe(15000);
    expect(res.body.data.order.paymentStatus).toBe('PAID');
  });
});
