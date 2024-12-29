/**
 * Standard API response format
 */
export const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 */
export const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };
  return res.status(statusCode).json(response);
};

/**
 * Validation error response format
 */
export const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 422, 'Validation Error', errors);
};

/**
 * Common HTTP status codes and their standard responses
 */
export const httpResponses = {
  badRequest: (res, message = 'Bad Request', errors = null) => 
    errorResponse(res, 400, message, errors),
    
  unauthorized: (res, message = 'Unauthorized', errors = null) => 
    errorResponse(res, 401, message, errors),
    
  forbidden: (res, message = 'Forbidden', errors = null) => 
    errorResponse(res, 403, message, errors),
    
  notFound: (res, message = 'Resource Not Found', errors = null) => 
    errorResponse(res, 404, message, errors),
    
  conflict: (res, message = 'Resource Conflict', errors = null) => 
    errorResponse(res, 409, message, errors),
    
  tooMany: (res, message = 'Too Many Requests', errors = null) => 
    errorResponse(res, 429, message, errors),
    
  serverError: (res, message = 'Internal Server Error', errors = null) => 
    errorResponse(res, 500, message, errors)
};

/**
 * Format validation errors from express-validator
 */
export const formatValidationErrors = (errors) => {
  return errors.array().reduce((acc, error) => {
    if (!acc[error.param]) {
      acc[error.param] = [];
    }
    acc[error.param].push(error.msg);
    return acc;
  }, {});
};

/**
 * Create a paginated response
 */
export const paginatedResponse = (res, {
  items,
  total,
  page,
  limit,
  message = 'Success'
}) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return successResponse(res, 200, message, {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  });
}; 