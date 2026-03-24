export const COUNTRIES = [
  { name: "United States", code: "USD", symbol: "$" },
  { name: "United Kingdom", code: "GBP", symbol: "£" },
  { name: "India", code: "INR", symbol: "₹" },
  { name: "Canada", code: "CAD", symbol: "$" },
  { name: "Australia", code: "AUD", symbol: "$" }
];
     
export function getCurrencyByCountry(country: string) {
  const c = COUNTRIES.find(c => c.name === country);
  return c || { name: "United States", code: "USD", symbol: "$" };
}
