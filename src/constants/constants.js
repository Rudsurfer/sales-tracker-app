export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_OF_WEEK_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
export const PAYMENT_METHODS = ['Cash', 'Credit', 'Debit', 'Amex', 'GC', 'Check'];
export const SALE_CATEGORIES = ["Outerwear", "Footwear", "Handbags", "Accessories", "Clothing", "CP"];
export const JOB_TITLES = ["Manager", "Co-Manager", "Asst. Manager", "3rd Key", "Sales Associate", "Cashier", "Stock Clerk", "Runner", "Greeter"];
export const OPERATING_HOURS = Array.from({ length: 13 }, (_, i) => `${i + 9}:00`);
export const TRANSACTION_TYPES = {
    REGULAR: 'Regular Sale',
    EMPLOYEE: 'Employee Purchase',
    GIFT_CARD: 'Gift Card Purchase',
    RETURN: 'Return'
};
export const FRENCH_STORES = ['0001', '0002', '0003', '0004', '0006', '0008', '0009', '0010', '0019', '0020', '0023', '0025', '0035'];
export const ENGLISH_STORES = ['0021', '0026', '0028', '0029', '0031', '0039', '0101', '0104', '0106', '0107'];
export const ALL_STORES = [...FRENCH_STORES, ...ENGLISH_STORES].sort();
export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#8884d8'];