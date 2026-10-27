export const LOAN_LIMITS = Object.freeze({
  principal: Object.freeze({ minimum: 100_000, maximum: 10_000_000 }),
  annualRate: Object.freeze({ minimum: 0, maximum: 30, maximumDecimalPlaces: 2 }),
  tenureYears: Object.freeze({ minimum: 1, maximum: 30 })
});

export function validateLoanInputs({ principal, annualRate, tenureYears }) {
  const issues = [];

  if (!Number.isFinite(principal)) {
    issues.push("Enter a valid loan amount.");
  } else if (principal < LOAN_LIMITS.principal.minimum || principal > LOAN_LIMITS.principal.maximum) {
    issues.push("Loan amount must be between ₹1 lakh and ₹1 crore.");
  } else if (!Number.isInteger(principal)) {
    issues.push("Loan amount must be entered in whole rupees.");
  }

  if (!Number.isFinite(annualRate)) {
    issues.push("Enter a valid annual interest rate.");
  } else if (annualRate < LOAN_LIMITS.annualRate.minimum || annualRate > LOAN_LIMITS.annualRate.maximum) {
    issues.push("Annual interest rate must be between 0% and 30%.");
  } else if (decimalPlaces(annualRate) > LOAN_LIMITS.annualRate.maximumDecimalPlaces) {
    issues.push("Interest rate can have at most two decimal places.");
  }

  if (!Number.isFinite(tenureYears)) {
    issues.push("Enter a valid loan tenure.");
  } else if (!Number.isInteger(tenureYears) || tenureYears < LOAN_LIMITS.tenureYears.minimum || tenureYears > LOAN_LIMITS.tenureYears.maximum) {
    issues.push("Loan tenure must be a whole number of years between 1 and 30.");
  }

  return issues;
}

export function calculateLoan({ principal, annualRate, tenureYears }) {
  const issues = validateLoanInputs({ principal, annualRate, tenureYears });
  if (issues.length > 0) {
    throw new RangeError(issues.join(" "));
  }

  const months = tenureYears * 12;
  const monthlyRate = annualRate / 100 / 12;
  const emi = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;

  if (![emi, totalPayment, totalInterest].every(Number.isFinite)) {
    throw new RangeError("These inputs produce a result outside the supported numeric range.");
  }

  return { principal, annualRate, tenureYears, months, emi, totalInterest, totalPayment };
}

function decimalPlaces(value) {
  const valueText = String(value).toLowerCase();
  const [coefficient, exponentText] = valueText.split("e");
  const fractionLength = coefficient.split(".")[1]?.length ?? 0;
  return Math.max(0, fractionLength - Number(exponentText ?? 0));
}
