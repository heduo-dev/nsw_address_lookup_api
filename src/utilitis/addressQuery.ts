export function extractStringFromQuery(param: unknown): string | null {
  // Handle string
  if (typeof param === "string") {
    const trimmed = param.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  // Handle array - take first string element
  if (Array.isArray(param)) {
    for (const item of param) {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }
  }

  // Everything else (objects, undefined, null, etc.) is invalid
  return null;
}

export function validateAddress(address: string | null): {
  isValid: boolean;
  error?: { message: string; code: string };
} {
  if (!address) {
    return {
      isValid: false,
      error: {
        message: "Address query parameter is required.",
        code: "MISSING_ADDRESS",
      },
    };
  }

  if (address.length < 3) {
    return {
      isValid: false,
      error: {
        message: "Address must be at least 3 characters long.",
        code: "INVALID_ADDRESS_FORMAT",
      },
    };
  }

  if (address.length > 200) {
    return {
      isValid: false,
      error: {
        message: "Address cannot exceed 200 characters.",
        code: "INVALID_ADDRESS_FORMAT",
      },
    };
  }

  return { isValid: true };
}
