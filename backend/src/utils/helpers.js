export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

export const calculateServiceFee = (amount) => {
  return amount * 0.1; // 10% service fee
};

export const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

export const calculateDeliveryDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const paginateResults = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    limit: parseInt(limit)
  };
}; 