export interface GeocodingResponse {
  type: "FeatureCollection";
  features: GeocodingFeature[];
}

export interface GeocodingFeature {
  type: "Feature";
  id: number;
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [longitude, latitude, elevation]
  };
  properties: {
    rid: number;
    gurasid: number;
    principaladdresssiteoid: number;
    addressstringoid: number;
    address: string;
    housenumber: string;
    createdate: number;
    addresspointtype: number;
    containment: number;
    startdate: number;
    enddate: number;
    lastupdate: number;
    msoid: number;
    urbanity: string;
    changetype: string;
    [key: string]: any;
  };
}

export interface AdministrativeBoundariesResponse {
  type: "FeatureCollection";
  features: AdministrativeBoundariesFeature[];
}

export interface AdministrativeBoundariesFeature {
  type: "Feature";
  id: number;
  geometry: null;
  properties: {
    rid: number;
    cadid: number;
    createdate: number;
    modifieddate: number;
    districtname: string;
    startdate: number;
    enddate: number;
    lastupdate: number;
    msoid: number;
    urbanity: string;
    changetype: string;
    Shape__Length: number;
    Shape__Area: number;
    [key: string]: any;
  };
}

export interface AddressLookupResponse {
  success: boolean;
  data?: {
    address: string;
    location: {
      latitude: number;
      longitude: number;
    };
    suburb: string;
    stateElectoralDistrict: string;
    propertyId?: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

export enum ErrorCodes {
  MISSING_ADDRESS = "MISSING_ADDRESS",
  ADDRESS_NOT_FOUND = "ADDRESS_NOT_FOUND",
  GEOCODING_API_ERROR = "GEOCODING_API_ERROR",
  BOUNDARIES_API_ERROR = "BOUNDARIES_API_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  INVALID_ADDRESS_FORMAT = 'INVALID_ADDRESS_FORMAT',
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND'
}
