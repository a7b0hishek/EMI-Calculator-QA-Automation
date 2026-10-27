import { calculateLoan, validateLoanInputs } from "/js/emi-calculator.js";

const form = document.querySelector("#loan-form");
const amountInput = document.querySelector("#loan-amount");
const rateInput = document.querySelector("#interest-rate");
const tenureInput = document.querySelector("#tenure-years");
const validationMessage = document.querySelector("#validation-message");
const reportLink = document.querySelector("#report-link");
const chartCanvas = document.querySelector("#repayment-chart");
const chartEmpty = document.querySelector("#chart-empty");

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

let repaymentChart;

function getInputs() {
  return {
    principal: readNumber(amountInput),
    annualRate: readNumber(rateInput),
    tenureYears: readNumber(tenureInput)
  };
}

function readNumber(input) {
  return input.value.trim() === "" ? Number.NaN : Number(input.value);
}

function clearResults(message = "Update the values and calculate again to refresh your estimate.") {
  document.querySelector("#monthly-emi").textContent = "—";
  document.querySelector("#emi-caption").textContent = "Calculate to see your estimate";
  document.querySelector("#principal-total").textContent = "—";
  document.querySelector("#interest-total").textContent = "—";
  document.querySelector("#total-payment").textContent = "—";
  document.querySelector("#chart-summary").textContent = message;
  reportLink.removeAttribute("href");
  reportLink.classList.add("is-disabled");
  reportLink.setAttribute("aria-disabled", "true");
  chartEmpty.hidden = false;
  chartCanvas.setAttribute("aria-label", "No chart data. Calculate a valid loan to view principal and interest.");

  if (repaymentChart) {
    repaymentChart.destroy();
    repaymentChart = undefined;
  }
}

function showValidation(issues) {
  const inputs = getInputs();
  const inputIssues = new Map([
    [amountInput, validateLoanInputs({ principal: inputs.principal, annualRate: 0, tenureYears: 1 })],
    [rateInput, validateLoanInputs({ principal: 100_000, annualRate: inputs.annualRate, tenureYears: 1 })],
    [tenureInput, validateLoanInputs({ principal: 100_000, annualRate: 0, tenureYears: inputs.tenureYears })]
  ]);

  validationMessage.textContent = issues.join(" ");
  validationMessage.hidden = issues.length === 0;
  for (const [input, fieldIssues] of inputIssues) {
    input.setAttribute("aria-invalid", String(fieldIssues.length > 0));
  }
}

function renderResult(loan) {
  const roundedPrincipal = roundToCents(loan.principal);
  const roundedInterest = roundToCents(loan.totalInterest);
  const roundedTotalPayment = roundToCents(loan.totalPayment);

  document.querySelector("#monthly-emi").textContent = formatMoney(loan.emi);
  document.querySelector("#emi-caption").textContent = `per month for ${loan.tenureYears} ${loan.tenureYears === 1 ? "year" : "years"}`;
  document.querySelector("#principal-total").textContent = formatMoney(roundedPrincipal);
  document.querySelector("#interest-total").textContent = formatMoney(roundedInterest);
  document.querySelector("#total-payment").textContent = formatMoney(roundedTotalPayment);

  const interestShare = roundedTotalPayment === 0 ? 0 : roundedInterest / roundedTotalPayment * 100;
  const principalShare = 100 - interestShare;
  document.querySelector("#chart-summary").textContent = `Principal ${formatMoney(roundedPrincipal)} (${formatPercent(principalShare)}); total interest ${formatMoney(roundedInterest)} (${formatPercent(interestShare)}).`;
  chartEmpty.hidden = true;
  chartCanvas.setAttribute("aria-label", `Repayment breakdown: principal ${formatMoney(roundedPrincipal)}, total interest ${formatMoney(roundedInterest)}.`);

  if (repaymentChart) repaymentChart.destroy();
  repaymentChart = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels: ["Principal", "Total interest"],
      datasets: [{
        data: [roundedPrincipal, roundedInterest],
        backgroundColor: ["#71c6b3", "#f47764"],
        borderColor: ["#153f3b", "#153f3b"],
        borderWidth: 3,
        hoverOffset: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (context) => `${context.label}: ${formatMoney(context.raw)}` }
        }
      }
    }
  });

  const query = new URLSearchParams({
    principal: String(loan.principal),
    annualRate: String(loan.annualRate),
    tenureYears: String(loan.tenureYears)
  });
  reportLink.href = `/report.html?${query.toString()}`;
  reportLink.classList.remove("is-disabled");
  reportLink.setAttribute("aria-disabled", "false");
}

function formatMoney(value) {
  return moneyFormatter.format(value);
}

function roundToCents(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value)}%`;
}

for (const range of document.querySelectorAll("[data-range-for]")) {
  const target = document.getElementById(range.dataset.rangeFor);
  updateRangeTrack(range);
  range.addEventListener("input", () => {
    target.value = range.value;
    updateRangeTrack(range);
    invalidateEstimate();
  });
  target.addEventListener("input", () => {
    if (target.value !== "") {
      range.value = target.value;
      updateRangeTrack(range);
    }
    invalidateEstimate();
  });
}

function updateRangeTrack(range) {
  const minimum = Number(range.min);
  const maximum = Number(range.max);
  const value = Number(range.value);
  const progress = ((value - minimum) / (maximum - minimum)) * 100;
  range.style.background = `linear-gradient(90deg, var(--teal-bright) ${progress}%, #dce7e2 ${progress}%)`;
}

function invalidateEstimate() {
  showValidation([]);
  clearResults();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const inputs = getInputs();
  const issues = validateLoanInputs(inputs);
  showValidation(issues);

  if (issues.length > 0) {
    clearResults("Correct the highlighted loan details and calculate again.");
    validationMessage.focus();
    return;
  }

  try {
    renderResult(calculateLoan(inputs));
  } catch (error) {
    showValidation([error.message || "Unable to calculate this estimate."]);
    clearResults("No chart or estimate is shown until the input is valid.");
  }
});

clearResults("Enter your details to view the principal and interest split.");
