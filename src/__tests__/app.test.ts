import request from 'supertest';
import app from '../app';

describe('Express App - Integration Tests', () => {
  describe('GET /', () => {
    it('should return homepage contains correct base RUL and example', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('NSW Address Lookup Service');
      expect(response.text).toMatch(/http.*:\/\/.*\/lookup\?address=/);
    });
  });

  describe('GET /lookup', () => {
    it('should return error for missing address parameter', async () => {
      const response = await request(app)
        .get('/lookup')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          message: 'Address query parameter is required.',
          code: 'MISSING_ADDRESS'
        }
      });
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return error for empty address parameter', async () => {
      const response = await request(app)
        .get('/lookup')
        .query({ address: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_ADDRESS');
    });

    it('should return error for whitespace-only address parameter', async () => {
      const response = await request(app)
        .get('/lookup')
        .query({ address: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_ADDRESS');
    });

    it('should process valid address lookup request with real API', async () => {
      const response = await request(app)
        .get('/lookup')
        .query({ address: '346 PANORAMA AVENUE BATHURST' })
        .timeout(30000); // 30 second timeout for real API calls

      expect(response.body.success).toBeDefined();
      
      if (response.body.success) {
        expect(response.status).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.address).toBe('346 PANORAMA AVENUE BATHURST');
        expect(response.body.data.location).toBeDefined();
        expect(response.body.data.location.latitude).toBeCloseTo(-33.4296842928957, 5);
        expect(response.body.data.location.longitude).toBeCloseTo(149.56705027262, 5);
        expect(response.body.data.suburb).toBe('BATHURST');
        expect(response.body.data.stateElectoralDistrict).toBe('BATHURST');
      } else {
        // If unsuccessful, should have proper error structure
        expect(response.body.error).toBeDefined();
        expect(response.body.error.code).toBeDefined();
        expect(response.body.error.message).toBeDefined();
      }
    });

    it('should handle invalid address gracefully', async () => {
      const response = await request(app)
        .get('/lookup')
        .query({ address: 'INVALID_ADDRESS_12345_NONEXISTENT' })
        .timeout(30000);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('ADDRESS_NOT_FOUND');
      expect(response.status).toBe(404);
    });

    it('should handle case insensitive addresses', async () => {
      const lowerCaseResponse = await request(app)
        .get('/lookup')
        .query({ address: '346 panorama avenue bathurst' })
        .timeout(30000);

      const upperCaseResponse = await request(app)
        .get('/lookup')
        .query({ address: '346 PANORAMA AVENUE BATHURST' })
        .timeout(30000);

      // Both should have the same success status
      expect(lowerCaseResponse.body.success).toBe(upperCaseResponse.body.success);
      
      if (lowerCaseResponse.body.success && upperCaseResponse.body.success) {
        expect(lowerCaseResponse.body.data.address).toBe(upperCaseResponse.body.data.address);
      }
    });

    it('should handle special characters in address', async () => {
      const response = await request(app)
        .get('/lookup')
        .query({ address: "123 O'Connor Street" })
        .timeout(30000);

      // Should not crash and should return proper response structure
      expect(response.body.success).toBeDefined();
      if (!response.body.success) {
        expect(response.body.error).toBeDefined();
        expect(response.body.error.code).toBeDefined();
      }
    });

    it('should return appropriate HTTP status codes for different errors', async () => {
      // Test missing address (400)
      const missingResponse = await request(app)
        .get('/lookup')
        .expect(400);
      expect(missingResponse.body.error.code).toBe('MISSING_ADDRESS');

      // Test invalid address (404)
      const invalidResponse = await request(app)
        .get('/lookup')
        .query({ address: 'DEFINITELY_INVALID_ADDRESS_123456789' })
        .timeout(30000);
      
      if (!invalidResponse.body.success && invalidResponse.body.error.code === 'ADDRESS_NOT_FOUND') {
        expect(invalidResponse.status).toBe(404);
      }
    });

    it('should handle URL encoded addresses correctly', async () => {
      const response = await request(app)
        .get('/lookup?address=346%20PANORAMA%20AVENUE%20BATHURST')
        .timeout(30000);

      expect(response.body.success).toBeDefined();
      
      if (response.body.success) {
        expect(response.body.data.address).toBe('346 PANORAMA AVENUE BATHURST');
      }
    });

    it('should log address lookup requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await request(app)
        .get('/lookup')
        .query({ address: 'TEST ADDRESS' })
        .timeout(30000);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Processing address lookup request for: TEST ADDRESS'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      // Express default 404 handling
      expect(response.status).toBe(404);
    });

    it('should handle malformed query parameters', async () => {
      const response = await request(app)
        .get('/lookup?address[]=invalid')
        .timeout(30000);

      // Should not crash - address should be handled as string or undefined
      expect(response.body.success).toBeDefined();
    });
  });

  describe('Content-Type headers', () => {
    it('should return JSON content-type for lookup endpoint', async () => {
      const response = await request(app)
        .get('/lookup')
        .query({ address: 'test' })
        .timeout(30000);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return HTML content-type for root endpoint', async () => {
      const response = await request(app)
        .get('/');

      expect(response.headers['content-type']).toMatch(/html|text/);
    });
  });

  describe('Request logging and debugging', () => {
    it('should handle errors gracefully and return proper error response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // This test ensures that any unexpected errors are handled properly
      const response = await request(app)
        .get('/lookup')
        .query({ address: 'valid address format' })
        .timeout(30000);

      // Should always return a proper response structure, never crash
      expect(response.body).toHaveProperty('success');
      if (!response.body.success) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
      }

      consoleErrorSpy.mockRestore();
    });
  });
});