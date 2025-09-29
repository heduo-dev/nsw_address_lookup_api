import express, { Request, Response } from "express";
import AddressService from "./services/AddressService";
import { AddressLookupResponse } from "./types";
import { extractStringFromQuery, validateAddress } from "./utilitis/addressQuery";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NSW Address Lookup API</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .example { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        code { background: #e8e8e8; padding: 2px 5px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏠 NSW Address Lookup Service</h1>
        <p>This API provides address lookup services for New South Wales, Australia.</p>
        
        <h2>📡 API Usage</h2>
        <p>To lookup an address, make a GET request to: /lookup?address=YOUR_ADDRESS</p>
        <p>The API returns JSON data with location coordinates, suburb, and electoral district information.</p>
        <h2> <a href="https://github.com/heduo-dev/nsw_address_lookup_api" target="_blank"/> Github</a></h2>
      </div>
    </body>
    </html>
  `;
  
  res.send(html);
});

app.get("/lookup", async (req: Request, res: Response) => {
  try {
    const addressService = new AddressService();
    const addressParam = extractStringFromQuery(req.query.address);
    const validation = validateAddress(addressParam);

    if (!validation.isValid) {
      const errorResponse: AddressLookupResponse = {
        success: false,
        error: validation.error!,
      };
      return res.status(400).json(errorResponse);
    }

    const address = addressParam!; // We know it's valid string now

    console.log(`Processing address lookup request for: ${address}`);

    const result = await addressService.lookupAddress(address);

    if (result.success) {
      res.json(result);
    } else {
      // Determine appropriate HTTP status code based on error
      let statusCode = 500;
      if (result.error?.code === "MISSING_ADDRESS") {
        statusCode = 400;
      } else if (result.error?.code === "ADDRESS_NOT_FOUND") {
        statusCode = 404;
      } else if (result.error?.code === "NETWORK_ERROR") {
        statusCode = 503;
      }

      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error("Unexpected error in lookup endpoint:", error);

    const errorResponse: AddressLookupResponse = {
      success: false,
      error: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      },
    };

    res.status(500).json(errorResponse);
  }
});
export default app;
