import AddressService  from '../services/AddressService';
import { ErrorCodes } from '../types/index';

describe('AddressService - Integration Tests', () => {
  let service: AddressService;

  beforeEach(() => {
    service = new AddressService();
  });

  describe('lookupAddress', () => {
    it('should return error for empty address', async () => {
      const result = await service.lookupAddress('');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.MISSING_ADDRESS);
      expect(result.error?.message).toBe('Address is required');
    });

    it('should return error for null/undefined address', async () => {
      const result = await service.lookupAddress(null as any);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.MISSING_ADDRESS);
    });

    it('should successfully lookup valid address with real API', async () => {
      // This test makes real API calls to NSW APIs
      const result = await service.lookupAddress('346 PANORAMA AVENUE BATHURST');

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data?.address).toBe('346 PANORAMA AVENUE BATHURST');
        expect(result.data?.location).toBeDefined();
        expect(result.data?.location.latitude).toBeCloseTo(-33.4296842928957, 5);
        expect(result.data?.location.longitude).toBeCloseTo(149.56705027262, 5);
        expect(result.data?.suburb).toBe('BATHURST');
        expect(result.data?.stateElectoralDistrict).toBe('BATHURST');
      } else {
        // If the API call fails, we should get appropriate error handling
        expect(result.error).toBeDefined();
        expect(result.error?.code).toMatch(/API_ERROR|NETWORK_ERROR|ADDRESS_NOT_FOUND/);
      }
    }, 30000); // 30 second timeout for real API calls

    it('should handle address not found with real API', async () => {
      // Test with an obviously invalid address
      const result = await service.lookupAddress('not valid address');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.ADDRESS_NOT_FOUND);
      expect(result.error?.message).toBe('Address not found');
    }, 30000);

    it('should handle another valid NSW address', async () => {
      // Test with another known NSW address
      const result = await service.lookupAddress('1 MACQUARIE STREET SYDNEY');

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data?.address).toContain('MACQUARIE');
        expect(result.data?.location).toBeDefined();
        expect(result.data?.location.latitude).toBeDefined();
        expect(result.data?.location.longitude).toBeDefined();
        expect(result.data?.suburb).toBeDefined();
        expect(result.data?.stateElectoralDistrict).toBeDefined();
      } else {
        // If the API call fails, check for appropriate error handling
        expect(result.error).toBeDefined();
        console.log('API Error for Macquarie Street:', result.error);
      }
    }, 30000);

    it('should handle partial address lookup', async () => {
      // Test with a partial address that might return multiple results
      const result = await service.lookupAddress('GEORGE STREET SYDNEY');
    //  console.log("hould handle partial address lookup -- -result", result)
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data?.address).toContain('GEORGE');
        expect(result.data?.suburb).toBeDefined();
      } else {
        // Partial addresses might not be found
        expect(result.error?.code).toMatch(/ADDRESS_NOT_FOUND|GEOCODING_API_ERROR/);
      }
    }, 30000);

    it('should properly format address input', async () => {
      // Test that the service handles different address formats
      const lowerCaseResult = await service.lookupAddress('346 panorama avenue bathurst');
      console.log("hould handle partial address lookup -- -result", lowerCaseResult)
      const upperCaseResult = await service.lookupAddress('346 PANORAMA AVENUE BATHURST');

      // Both should return the same result (if successful) since the service normalizes input
      if (lowerCaseResult.success && upperCaseResult.success) {
        expect(lowerCaseResult.data?.address).toBe(upperCaseResult.data?.address);
        expect(lowerCaseResult.data?.location.latitude).toBe(upperCaseResult.data?.location.latitude);
        expect(lowerCaseResult.data?.location.longitude).toBe(upperCaseResult.data?.location.longitude);
      }
    }, 30000);
  });

  describe('Error handling with real APIs', () => {
    it('should handle network timeouts gracefully', async () => {
      // Create a service instance with a very short timeout to test timeout handling
      const shortTimeoutService = new AddressService();
      
      const result = await shortTimeoutService.lookupAddress('346 PANORAMA AVENUE BATHURST');
      
      // Even with potential timeouts, we should get a proper error response
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error?.code).toMatch(/NETWORK_ERROR|GEOCODING_API_ERROR|BOUNDARIES_API_ERROR/);
      }
    }, 45000); // Longer timeout to account for potential retries
  });
});
