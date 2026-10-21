import request from 'supertest';
import app from '../src/index';
import db from '../src/db';

describe('Companies API', () => {
  let companyId: number;

  beforeAll(() => {
    const info = db.prepare(`
      INSERT INTO companies (name, type)
      VALUES (?, ?)
    `).run('Test Company', 'production');
    companyId = info.lastInsertRowid as number;
  });

  afterAll(() => {
    db.prepare('DELETE FROM companies').run();
  });

  it('should return a list of companies', async () => {
    const res = await request(app).get('/companies');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should fetch a company by id', async () => {
    const res = await request(app).get(`/companies/${companyId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('name', 'Test Company');
  });

  let newCompanyId: number;

  it('should create a new company', async () => {
    const res = await request(app).post('/companies').send({
      name: 'New Company',
      type: 'production'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('name', 'New Company');
    newCompanyId = res.body.data.id;
  });

  it('should fail to create a company without a name', async () => {
    const res = await request(app).post('/companies').send({
      type: 'production'
    });
    expect(res.status).toBe(400);
  });

  it('should update a company', async () => {
    const res = await request(app).put(`/companies/${newCompanyId}`).send({
      type: 'streaming'
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('type', 'streaming');
  });

  it('should return 404 when updating non-existent company', async () => {
    const res = await request(app).put('/companies/99999').send({
      name: 'Should Fail'
    });
    expect(res.status).toBe(404);
  });

  it('should delete a company', async () => {
    const res = await request(app).delete(`/companies/${newCompanyId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when deleting a non-existent company', async () => {
    const res = await request(app).delete('/companies/99999');
    expect(res.status).toBe(404);
  });
});
