/**
 * Input Validation Utilities
 * Provides consistent error messages and validation logic
 */

const ValidationErrors = {
  REQUIRED_FIELD: (fieldName) => `${fieldName} is required. Please provide a valid value.`,
  INVALID_TYPE: (fieldName, expectedType) => `${fieldName} must be a valid ${expectedType}. You entered an invalid value.`,
  INVALID_EMAIL: (email) => `"${email}" is not a valid email address. Please enter a valid email.`,
  INVALID_PHONE: (phone) => `"${phone}" is not a valid phone number. Phone numbers should contain only digits.`,
  INVALID_NUMBER: (fieldName) => `${fieldName} must be a valid number.`,
  MINIMUM_LENGTH: (fieldName, min) => `${fieldName} must be at least ${min} character(s) long.`,
  MAXIMUM_LENGTH: (fieldName, max) => `${fieldName} cannot exceed ${max} character(s).`,
  INVALID_PRICE: (fieldName) => `${fieldName} must be a positive number.`,
  INVALID_QUANTITY: (fieldName) => `${fieldName} must be at least 1.`,
  NO_ITEMS: () => `Your order must contain at least one item.`,
  INVALID_ADDRESS: () => `Please provide a complete delivery address including street, city, and area.`,
  INVALID_PAYMENT_METHOD: () => `Payment method must be "cod" (cash), or "instapay".`,
  INVALID_ORDER_TYPE: () => `Order type must be either "delivery" or "pickup".`,
  ORDER_NOT_FOUND: () => `Order not found. Please check the order number and try again.`,
  UNAUTHORIZED: () => `You don't have permission to access this. Please sign in first.`,
  SERVER_ERROR: () => `Something went wrong. Please try again later.`,
};

/**
 * Validates a required string field
 */
const validateRequiredString = (value, fieldName) => {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { valid: false, error: ValidationErrors.REQUIRED_FIELD(fieldName) };
  }
  return { valid: true };
};

/**
 * Validates email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: ValidationErrors.REQUIRED_FIELD('Email') };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: ValidationErrors.INVALID_EMAIL(email) };
  }

  return { valid: true };
};

/**
 * Validates phone number (should contain only digits and +)
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: ValidationErrors.REQUIRED_FIELD('Phone number') };
  }

  const phoneRegex = /^[\d+\s\-()]+$/;
  if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
    return { valid: false, error: ValidationErrors.INVALID_PHONE(phone) };
  }

  return { valid: true };
};

/**
 * Validates a positive number
 */
const validatePositiveNumber = (value, fieldName) => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: ValidationErrors.INVALID_PRICE(fieldName) };
  }
  return { valid: true, value: num };
};

/**
 * Validates quantity (must be >= 1)
 */
const validateQuantity = (value) => {
  const num = parseInt(value);
  if (isNaN(num) || num < 1) {
    return { valid: false, error: ValidationErrors.INVALID_QUANTITY('Quantity') };
  }
  return { valid: true, value: num };
};

/**
 * Validates payment method
 */
const validatePaymentMethod = (method) => {
  const validMethods = ['cod', 'instapay'];
  if (!method || !validMethods.includes(String(method).toLowerCase())) {
    return { valid: false, error: ValidationErrors.INVALID_PAYMENT_METHOD() };
  }
  return { valid: true };
};

/**
 * Validates order type
 */
const validateOrderType = (type) => {
  const validTypes = ['delivery', 'pickup'];
  if (!type || !validTypes.includes(type.toLowerCase())) {
    return { valid: false, error: ValidationErrors.INVALID_ORDER_TYPE() };
  }
  return { valid: true };
};

/**
 * Validates customer info object
 */
const validateCustomerInfo = (customerInfo) => {
  const errors = [];

  if (!customerInfo) {
    return { valid: false, error: ValidationErrors.REQUIRED_FIELD('Customer information') };
  }

  // Validate name
  const nameValidation = validateRequiredString(customerInfo.name, 'Name');
  if (!nameValidation.valid) errors.push(nameValidation.error);

  // Validate phone
  const phoneValidation = validatePhone(customerInfo.phone);
  if (!phoneValidation.valid) errors.push(phoneValidation.error);

  const emailTrimmed =
    customerInfo.email != null && String(customerInfo.email).trim() !== ''
      ? String(customerInfo.email).trim()
      : '';
  if (emailTrimmed) {
    const emailValidation = validateEmail(emailTrimmed);
    if (!emailValidation.valid) errors.push(emailValidation.error);
  }

  if (errors.length > 0) {
    return { valid: false, error: errors[0] };
  }

  return { valid: true };
};

/**
 * Validates order items (pricing is computed server-side; client price is ignored).
 */
const validateOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: ValidationErrors.NO_ITEMS() };
  }

  for (const item of items) {
    const qtyValidation = validateQuantity(item.quantity);
    if (!qtyValidation.valid) {
      return { valid: false, error: qtyValidation.error };
    }

    const nameValidation = validateRequiredString(item.name, 'Item name');
    if (!nameValidation.valid) {
      return { valid: false, error: nameValidation.error };
    }

    const idNum = parseInt(item.menuItem, 10);
    if (Number.isNaN(idNum) || idNum < 1) {
      return { valid: false, error: ValidationErrors.INVALID_TYPE('Menu item id', 'number') };
    }
  }

  return { valid: true };
};

module.exports = {
  ValidationErrors,
  validateRequiredString,
  validateEmail,
  validatePhone,
  validatePositiveNumber,
  validateQuantity,
  validatePaymentMethod,
  validateOrderType,
  validateCustomerInfo,
  validateOrderItems,
};
