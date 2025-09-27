import request from 'supertest';
import app from '../app';

describe('App', () => {
  it('should respond with a message on GET /', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
      
    expect(response.body).toEqual({
      message: 'Hello World from TypeScript Express!'
    });
  });
});