export const COUNTRIES = [
  { name: "United States", code: "USD", symbol: "$" },
  { name: "United Kingdom", code: "GBP", symbol: "£" },
  { name: "India", code: "INR", symbol: "₹" },
  { name: "Canada", code: "CAD", symbol: "$" },
  { name: "Australia", code: "AUD", symbol: "$" }
];

export function getCurrencyByCountry(country: string) {
  const map: Record<string, { code: string; symbol: string }> = {
    "United States": { code: "USD", symbol: "$" },
    "United Kingdom": { code: "GBP", symbol: "£" },
    "India": { code: "INR", symbol: "₹" },
    "Canada": { code: "CAD", symbol: "$" },
    "Australia": { code: "AUD", symbol: "$" },
  };

  return map[country] || { code: "USD", symbol: "$" };
}