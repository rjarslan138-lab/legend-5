import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

describe('Auth & Multi-Tenant Security Flow', () => {
  const testEmailA = `owner_a_${Date.now()}@test.com`;
  const testEmailB = `owner_b_${Date.now()}@test.com`;

  let tokenA = '';
  let tokenB = '';
  let orgIdA = '';
  let orgIdB = '';

  afterAll(async () => {
    // Cleanup created test orgs
    if (orgIdA) await prisma.organization.deleteMany({ where: { id: orgIdA } });
    if (orgIdB) await prisma.organization.deleteMany({ where: { id: orgIdB } });
    await prisma.$disconnect();
  });

  it('should register a new organization and OWNER user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        organizationName: 'Alpha Textiles',
        name: 'Alpha Owner',
        email: testEmailA,
        password: 'Password@123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('OWNER');
    expect(res.body.data.user.email).toBe(testEmailA);
    expect(res.body.data.accessToken).toBeDefined();

    tokenA = res.body.data.accessToken;
    orgIdA = res.body.data.user.organizationId;
  });

  it('should login the registered owner and set cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmailA,
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should enforce tenant isolation (User A cannot view User B resources)', async () => {
    // Register Organization B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        organizationName: 'Beta Garments',
        name: 'Beta Owner',
        email: testEmailB,
        password: 'Password@123',
      });

    expect(resB.status).toBe(201);
    tokenB = resB.body.data.accessToken;
    orgIdB = resB.body.data.user.organizationId;

    // Create a warehouse in Org B
    const whResB = await request(app)
      .post('/api/v1/warehouses')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Beta Secret Warehouse',
        address: 'Lahore',
      });

    expect(whResB.status).toBe(201);
    const betaWhId = whResB.body.data.id;

    // Org A tries to access Org B's warehouse by ID
    const unauthorizedAccess = await request(app)
      .get(`/api/v1/warehouses/${betaWhId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    // Must be 404 (not found in Org A's tenant boundary)
    expect(unauthorizedAccess.status).toBe(404);
  });
});
