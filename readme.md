# NSW Address Lookup Service

A robust, serverless Express.js application built with TypeScript and AWS CDK that provides address lookup services using NSW Government APIs. Input an address and get back location coordinates, suburb information, and electoral district details.

## Deployed AWS Lambda function URL: 
`https://a60jvaibnl.execute-api.ap-southeast-2.amazonaws.com/prod/`

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or later

### Installation

```bash
# Clone the repository
git clone git@github.com:heduo-dev/nsw_address_lookup_api.git
cd nsw_address_lookup_api

# Install dependencies
npm install


### Local Development

```bash
# Start the development server
npm run dev

# Server will start on http://localhost:3000
```

### Testing the API

Once the development server is running:

```bash
# Root endpoint with instructions
curl http://localhost:3000/

# Valid address lookup
curl "http://localhost:3000/lookup?address=346%20PANORAMA%20AVENUE%20BATHURST"

# Example response:
# {
#   "success": true,
#   "data": {
#     "address": "346 PANORAMA AVENUE BATHURST",
#     "location": {
#       "latitude": -33.4296842928957,
#       "longitude": 149.56705027262
#     },
#     "suburb": "BATHURST",
#     "stateElectoralDistrict": "BATHURST",
#   }
# }
```


## 📡 API Reference

### Base URL
- **Local Development**: `http://localhost:3000`
- **Production**: `https://a60jvaibnl.execute-api.ap-southeast-2.amazonaws.com/prod/`

### Endpoints

#### `GET /`
Home page with usage instructions and example URL.

**Response**: HTML page with API documentation

#### `GET /lookup`
Look up address information using query parameter.

**Parameters:**
- `address` (string, required): The NSW address to look up

**Example Request:**
```bash
GET /lookup?address=346%20PANORAMA%20AVENUE%20BATHURST
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "address": "346 PANORAMA AVENUE BATHURST",
    "location": {
      "latitude": -33.4296842928957,
      "longitude": 149.56705027262
    },
    "suburb": "BATHURST",
    "stateElectoralDistrict": "BATHURST",
    "propertyId": 3725744
  }
}
```

**Error Response (400/404/500):**
```json
{
  "success": false,
  "error": {
    "message": "Address not found",
    "code": "ADDRESS_NOT_FOUND"
  }
}
```

## 🛡️ Error Handling

The API provides detailed error responses with appropriate HTTP status codes:

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `MISSING_ADDRESS` | Address parameter is required |
| 404 | `ADDRESS_NOT_FOUND` | No results found for the provided address |
| 404 | `ROUTE_NOT_FOUND` | API endpoint does not exist |
| 500 | `GEOCODING_API_ERROR` | Error calling NSW Geocoding API |
| 500 | `BOUNDARIES_API_ERROR` | Error calling NSW Boundaries API |
| 503 | `NETWORK_ERROR` | Network connectivity issues |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### Input Validation

- **Minimum Length**: 3 characters
- **Maximum Length**: 200 characters
- **Type Safety**: Handles malformed query parameters (arrays, objects) gracefully
- **Sanitization**: Trims whitespace and normalizes input

### Malformed Parameters

The API safely handles malformed query parameters that would normally crash Express applications:

```bash
# These return proper error responses instead of crashing:
curl "http://localhost:3000/lookup?address[]=invalid"
curl "http://localhost:3000/lookup?address[key]=value"
curl "http://localhost:3000/lookup?address=first&address=second"
```

## 🔧 Development

### Project Structure

```
nsw_address_lookup_api/
├── src/
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   ├── utilities/
│   │   └── addressQuery.ts          # ulility functions for address query parameter
│   ├── services/
│   │   └── AddressService.ts        # Address lookup business logic
│   ├── app.ts                       # Express application setup
│   ├── lambda.ts                    # AWS Lambda handler
│   ├── server.ts                    # Local development server
│   └── __tests__/                   # Integration tests
│       ├── addressService.test.ts
│       └── app.test.ts
├── lib/
│   └── express-app-stack.ts      # CDK infrastructure definition
├── bin/
│   └── express-app.ts                       # CDK app entry point
├── dist/                            # Compiled output (generated)
├── cdk.out/                         # CDK output (generated)
├── coverage/                        # Test coverage (generated)
└── README.md
```

### Running Tests

```bash
# Run all integration tests (requires internet connection)
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```
