const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function corsResponse(status = 204): Response {
  return new Response(null, {
    status,
    headers: CORS_HEADERS,
  });
}

export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

export function successResponse(data: any, message = "Success", status = 200): Response {
  return jsonResponse({
    success: true,
    message,
    data,
  }, status);
}

export function errorResponse(message: string, status = 400, error?: any): Response {
  return jsonResponse({
    success: false,
    message,
    error: error || null,
  }, status);
}

export function paginatedResponse(data: any[], total: number, page: number, limit: number, status = 200): Response {
  const totalPages = Math.ceil(total / limit);
  return jsonResponse({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }, status);
}
