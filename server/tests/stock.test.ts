import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

describe('Stock Movement & Non-Negative Inventory Tests', () => {
  let token = '';
  let orgId = '';
  let variantId = '';
  let loc1Id = '';
  let loc2Id = '';

  beforeAll(async () => {
    // Register owner
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        organizationName: 'Stock Test Mill',
        name: 'Stock Manager',
        email: `stock_mgr_${Date.now()}@test.com`,
        password: 'Password@123',
      });

    token = regRes.body.data.accessToken;
    orgId = regRes.body.data.user.organizationId;

    // Get default warehouse and locations
    const whRes = await request(app)
      .get('/api/v1/warehouses')
      .set('Authorization', `Bearer ${token}`);

    const wh = whRes.body.data[0];
    loc1Id = wh.locations[0].id;
    loc2Id = wh.locations[1].id;

    // Create product and variant
    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Cotton Shirt',
        skuPrefix: 'TCS',
        category: 'Test',
        basePrice: 1000,
        variants: [
          {
            sku: `TCS-M-${Date.now()}`,
            size: 'M',
            color: 'White',
            price: 1000,
            costPrice: 500,
            reorderLevel: 10,
          },
        ],
      });

    variantId = prodRes.body.data.variants[0].id;
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it('should receive stock into location and record ledger movement', async () => {
    const res = await request(app)
      .post('/api/v1/stock/receive')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variantId,
        locationId: loc1Id,
        quantity: 50,
        reference: 'Initial Batch Intake',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stockItem.quantity).toBe(50);
    expect(res.body.data.movement.type).toBe('RECEIVE');
  });

  it('should transfer stock between locations', async () => {
    const res = await request(app)
      .post('/api/v1/stock/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variantId,
        fromLocationId: loc1Id,
        toLocationId: loc2Id,
        quantity: 20,
        reference: 'Relocate to WIP',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updatedSource.quantity).toBe(30);
    expect(res.body.data.updatedDest.quantity).toBe(20);
  });

  it('should reject transfer when stock is insufficient (no negative stock)', async () => {
    const res = await request(app)
      .post('/api/v1/stock/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variantId,
        fromLocationId: loc1Id,
        toLocationId: loc2Id,
        quantity: 100, // Available is only 30
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Insufficient stock');
  });
});
