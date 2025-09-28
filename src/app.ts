import express, { Request, Response } from "express";
import AddressService from "./services/AddressService";
import { AddressLookupResponse } from "./types";
import { extractStringFromQuery, validateAddress } from "./Utilitis/request";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.send(
    `Lookup address by adding address query parameter after '/lookup'. e.g. ${baseUrl}/lookup?address=346 panorama avenue bathurst`
  );
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
