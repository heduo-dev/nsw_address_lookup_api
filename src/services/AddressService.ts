import axios, { AxiosError } from "axios";
import {
  GeocodingResponse,
  AdministrativeBoundariesResponse,
  AddressLookupResponse,
  ErrorCodes,
  ErrorResponse,
} from "../types/index";
import config from "../config";

export default class AddressService {
  private static readonly GEOCODING_BASE_URL =
    config.addressService.geocodingUrl;

  private static readonly BOUNDARIES_BASE_URL =
    config.addressService.boudariesUrl;

  private static readonly REQUEST_TIMEOUT =
    config.addressService.requestTimeout;

  /**
   * Main method to lookup address information
   */
  public async lookupAddress(address: string): Promise<AddressLookupResponse> {
    try {
      console.log(`Starting address lookup for: ${address}`);

      // Step 1: Validate input
      if (!address || address?.trim().length === 0) {
        return this.createErrorResponse(
          "Address is required",
          ErrorCodes.MISSING_ADDRESS
        );
      }

      const cleanAddress = address.trim().toUpperCase();

      // Step 2: Get geocoding information
      const geocodingData = await this.getGeocodingInfo(cleanAddress);
      if (!geocodingData) {
        return this.createErrorResponse(
          "Address not found",
          ErrorCodes.ADDRESS_NOT_FOUND
        );
      }

      const { latitude, longitude, originalAddress, propertyId } =
        geocodingData;

      // Step 3: Get administrative boundaries information
      const boundariesData = await this.getAdministrativeBoundaries(
        latitude,
        longitude
      );
      if (!boundariesData) {
        return this.createErrorResponse(
          "Unable to retrieve suburb information",
          ErrorCodes.BOUNDARIES_API_ERROR
        );
      }

      // Step 4: Create successful response
      const response: AddressLookupResponse = {
        success: true,
        data: {
          address: originalAddress,
          location: {
            latitude,
            longitude,
          },
          suburb: boundariesData.districtname,
          stateElectoralDistrict: boundariesData.districtname
        },
      };

      console.log("Address lookup successful:", response.data);
      return response;
    } catch (error) {
      console.error("Address lookup error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get geocoding information for an address
   */
  private async getGeocodingInfo(address: string): Promise<{
    latitude: number;
    longitude: number;
    originalAddress: string;
    propertyId: number;
  } | null> {
    try {
      const response = await axios.get<GeocodingResponse>(
        AddressService.GEOCODING_BASE_URL,
        {
          timeout: AddressService.REQUEST_TIMEOUT,
          headers: {
            Accept: "application/json",
          },
          params: {
            where: `address='${address}'`,
            outFields: "*",
            f: "geojson",
          },
        }
      );

      console.log("Geocoding API response status:", response.status);
      console.log(
        "Geocoding API response data:",
        JSON.stringify(response.data, null, 2)
      );

      if (!response.data.features || response.data.features.length === 0) {
        console.log("No features found in geocoding response");
        return null;
      }

      const feature = response.data.features[0];
      const [longitude, latitude] = feature.geometry.coordinates;

      return {
        latitude,
        longitude,
        originalAddress: feature.properties.address,
        propertyId:
          feature.properties.principaladdresssiteoid || feature.properties.rid,
      };
    } catch (error) {
      console.error("Geocoding API error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Geocoding API error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      throw new Error(
        `Geocoding API failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get administrative boundaries information for coordinates
   */
  private async getAdministrativeBoundaries(
    latitude: number,
    longitude: number
  ): Promise<{
    districtname: string;
  } | null> {
    try {
      const response = await axios.get<AdministrativeBoundariesResponse>(
        AddressService.BOUNDARIES_BASE_URL,
        {
          timeout: AddressService.REQUEST_TIMEOUT,
          headers: {
            Accept: "application/json",
            "User-Agent": "NSW-Address-Lookup-Service/1.0",
          },
          params: {
            geometry: `${longitude},${latitude}`,
            geometryType: "esriGeometryPoint",
            inSR: "4326",
            spatialRel: "esriSpatialRelIntersects",
            outFields: "*",
            returnGeometry: "false",
            f: "geoJSON",
          },
        }
      );

      console.log("Boundaries API response status:", response.status);
      console.log(
        "Boundaries API response data:",
        JSON.stringify(response.data, null, 2)
      );

      if (!response.data.features || response.data.features.length === 0) {
        console.log("No features found in boundaries response");
        return null;
      }

      const feature = response.data.features[0];

      return {
        districtname: feature.properties.districtname,
      };
    } catch (error) {
      console.error("Boundaries API error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Boundaries API error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      throw new Error(
        `Boundaries API failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    message: string,
    code: ErrorCodes
  ): ErrorResponse {
    return {
      success: false,
      error: {
        message,
        code,
      },
    };
  }

  /**
   * Handle various types of errors
   */
  private handleError(error: unknown): ErrorResponse {
    if (error instanceof Error) {
      if (error.message.includes("Geocoding API failed")) {
        return this.createErrorResponse(
          error.message,
          ErrorCodes.GEOCODING_API_ERROR
        );
      }
      if (error.message.includes("Boundaries API failed")) {
        return this.createErrorResponse(
          error.message,
          ErrorCodes.BOUNDARIES_API_ERROR
        );
      }
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
          return this.createErrorResponse(
            "Request timeout",
            ErrorCodes.NETWORK_ERROR
          );
        }
        if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
          return this.createErrorResponse(
            "Network connection error",
            ErrorCodes.NETWORK_ERROR
          );
        }
      }
      return this.createErrorResponse(error.message, ErrorCodes.INTERNAL_ERROR);
    }

    return this.createErrorResponse(
      "An unexpected error occurred",
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
