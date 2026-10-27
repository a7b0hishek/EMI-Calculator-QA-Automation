export const DEFAULT_MONEY_TOLERANCE = 0.01;

/**
 * Independent test oracle for the fixed-payment EMI calculation.
 * Monetary comparison values are rounded to the nearest paisa; tolerance is INR.
 */
export function calculateExpectedEmi({ principal, annualRate, tenureYears }) {
  validateInputs({ principal, annualRate, tenureYears });

  const paymentCount = tenureYears * 12;
  const monthlyRate = (annualRate / 100) / 12;
  const emi = monthlyRate === 0
    ? principal / paymentCount
    : principal * monthlyRate * ((1 + monthlyRate) ** paymentCount)
      / (((1 + monthlyRate) ** paymentCount) - 1);
  const totalPayment = emi * paymentCount;
  const totalInterest = totalPayment - principal;

  if (![emi, totalPayment, totalInterest].every(Number.isFinite)) {
    throw new RangeError("The supplied loan values do not produce finite expected results.");
  }

  return Object.freeze({
    principal,
    annualRate,
    tenureYears,
    paymentCount,
    monthlyRate,
    emi,
    totalPayment,
    totalInterest,
    rounded: Object.freeze({
      emi: roundCurrency(emi),
      principal: roundCurrency(principal),
      totalPayment: roundCurrency(totalPayment),
      totalInterest: roundCurrency(totalInterest)
    })
  });
}

export function roundCurrency(amount) {
  if (!Number.isFinite(amount)) throw new TypeError("Only finite amounts can be rounded.");
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function isWithinMoneyTolerance(actual, expected, tolerance = DEFAULT_MONEY_TOLERANCE) {
  return Number.isFinite(actual)
    && Number.isFinite(expected)
    && Number.isFinite(tolerance)
    && tolerance >= 0
    && Math.abs(actual - expected) <= tolerance;
}

function validateInputs({ principal, annualRate, tenureYears }) {
  if (!Number.isFinite(principal) || !Number.isInteger(principal) || principal < 100_000 || principal > 10_000_000) {
    throw new RangeError("Principal must be a whole INR amount from ₹1 lakh through ₹1 crore.");
  }
  if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 30 || decimalPlaces(annualRate) > 2) {
    throw new RangeError("Annual interest must be from 0% through 30%, to at most two decimal places.");
  }
  if (!Number.isFinite(tenureYears) || !Number.isInteger(tenureYears) || tenureYears < 1 || tenureYears > 30) {
    throw new RangeError("Tenure must be a whole number of years from 1 through 30.");
  }
}

function decimalPlaces(value) {
  const [coefficient, exponentText] = String(value).toLowerCase().split("e");
  const fractionLength = coefficient.split(".")[1]?.length ?? 0;
  return Math.max(0, fractionLength - Number(exponentText ?? 0));
}
