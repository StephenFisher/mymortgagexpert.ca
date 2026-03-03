// ===========================
// Mobile Menu Toggle
// ===========================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('active');
});

// Close menu when a nav link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
  });
});

// ===========================
// Hero — What Can You Afford?
// ===========================
const heroForm = document.getElementById('heroForm');
const heroOwnerToggle = document.getElementById('heroOwnerToggle');
const heroAdditionalToggle = document.getElementById('heroAdditionalToggle');
const heroAdditionalGroup = document.getElementById('heroAdditionalGroup');
const heroNotOwner = document.getElementById('heroNotOwner');
const heroResults = document.getElementById('heroResults');
const heroStartOver = document.getElementById('heroStartOver');

function heroFormatCurrency(value) {
  return '$' + Math.round(value).toLocaleString('en-CA');
}

function heroParseCurrency(str) {
  return Number(str.replace(/[^0-9]/g, '')) || 0;
}

function heroBindCurrency(input) {
  input.addEventListener('input', function() {
    const raw = this.value.replace(/[^0-9]/g, '');
    if (raw === '') { this.value = ''; return; }
    this.value = '$' + Number(raw).toLocaleString('en-CA');
  });
}

// Currency formatting on all money inputs
['heroHomeValue', 'heroMortgageBalance', 'heroAdditionalAmount'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el) heroBindCurrency(el);
});

// Homeowner toggle — Yes/No
heroOwnerToggle.addEventListener('click', function(e) {
  var btn = e.target.closest('.heloc__toggle-btn');
  if (!btn) return;
  heroOwnerToggle.querySelectorAll('.heloc__toggle-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');

  if (btn.dataset.value === 'yes') {
    heroForm.style.display = '';
    heroNotOwner.style.display = 'none';
    heroResults.style.display = 'none';
  } else {
    heroForm.style.display = 'none';
    heroNotOwner.style.display = '';
    heroResults.style.display = 'none';
  }
});

// Additional mortgages toggle
heroAdditionalToggle.addEventListener('click', function(e) {
  var btn = e.target.closest('.heloc__toggle-btn');
  if (!btn) return;
  heroAdditionalToggle.querySelectorAll('.heloc__toggle-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');

  if (btn.dataset.value === 'yes') {
    heroAdditionalGroup.style.display = '';
  } else {
    heroAdditionalGroup.style.display = 'none';
    document.getElementById('heroAdditionalAmount').value = '';
  }
});

// Form submit — calculate 80% LTV borrowing power
heroForm.addEventListener('submit', function(e) {
  e.preventDefault();

  var homeValue = heroParseCurrency(document.getElementById('heroHomeValue').value);
  var mortgageBalance = heroParseCurrency(document.getElementById('heroMortgageBalance').value);
  var additionalBtn = heroAdditionalToggle.querySelector('.heloc__toggle-btn.active');
  var additionalAmount = (additionalBtn && additionalBtn.dataset.value === 'yes')
    ? heroParseCurrency(document.getElementById('heroAdditionalAmount').value) : 0;

  var goal = document.getElementById('heroGoal').value;
  var maxLTV = homeValue * 0.80;
  var borrowingPower = Math.max(0, Math.round(maxLTV - mortgageBalance - additionalAmount));

  // Hide form, show page 2
  document.getElementById('heroOwnerStep').style.display = 'none';
  heroForm.style.display = 'none';
  heroResults.style.display = '';

  // Build page 2 dynamically based on goal
  buildHeroPage2(goal, borrowingPower, mortgageBalance);
});

// Semi-annual compounding monthly effective rate (Canadian standard)
function heroMonthlyRate(annualRate) {
  return Math.pow(1 + annualRate / 2, 1/6) - 1;
}

function heroCalcPayment(principal, annualRate, years) {
  if (principal <= 0) return 0;
  var r = heroMonthlyRate(annualRate);
  var n = years * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

var HERO_BEST_RATE = 4.04; // 5-year fixed

// Build page 2 content based on goal
function buildHeroPage2(goal, borrowingPower, mortgageBalance) {
  var container = document.getElementById('heroPage2Content');
  var html = '';

  if (goal === 'Refinance') {
    html =
      '<p style="font-size:0.85rem; color:var(--text-mid); margin-bottom:14px;">Let\'s see how much you could save by refinancing.</p>' +
      '<div class="form-group" style="margin-bottom:12px; text-align:left;">' +
        '<label for="heroCurrentRate">What rate are you currently paying?</label>' +
        '<input type="text" id="heroCurrentRate" placeholder="5.49" inputmode="decimal">' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:14px; text-align:left;">' +
        '<label for="heroAmort">Remaining amortization</label>' +
        '<select id="heroAmort">' +
          '<option value="10">10 Years</option>' +
          '<option value="15">15 Years</option>' +
          '<option value="20" selected>20 Years</option>' +
          '<option value="25">25 Years</option>' +
          '<option value="30">30 Years</option>' +
        '</select>' +
      '</div>' +
      '<button type="button" class="btn btn--primary btn--large" id="heroCalcBtn" style="width:100%;">See What You Could Save</button>' +
      '<div id="heroCalcResult" style="display:none;"></div>';

  } else if (goal === 'Consolidate Debt') {
    html =
      '<p style="font-size:0.85rem; color:var(--text-mid); margin-bottom:14px;">See how much you could save by rolling your debt into your mortgage.</p>' +
      '<div class="form-group" style="margin-bottom:12px; text-align:left;">' +
        '<label for="heroDebtTotal">How much unsecured debt do you have?</label>' +
        '<input type="text" id="heroDebtTotal" placeholder="$30,000" inputmode="numeric">' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:14px; text-align:left;">' +
        '<label for="heroDebtPayment">What are you paying monthly on that debt?</label>' +
        '<input type="text" id="heroDebtPayment" placeholder="$800" inputmode="numeric">' +
      '</div>' +
      '<button type="button" class="btn btn--primary btn--large" id="heroCalcBtn" style="width:100%;">See What You Could Save</button>' +
      '<div id="heroCalcResult" style="display:none;"></div>';

  } else if (goal === 'Home Equity Line of Credit') {
    html =
      '<p style="font-size:0.85rem; color:var(--text-mid); margin-bottom:14px;">See how much you could access through a HELOC.</p>' +
      '<div class="form-group" style="margin-bottom:14px; text-align:left;">' +
        '<label for="heroHelocAmount">How much would you like to access?</label>' +
        '<input type="text" id="heroHelocAmount" placeholder="$75,000" inputmode="numeric">' +
      '</div>' +
      '<button type="button" class="btn btn--primary btn--large" id="heroCalcBtn" style="width:100%;">Check Your Eligibility</button>' +
      '<div id="heroCalcResult" style="display:none;"></div>';

  } else if (goal === 'Switch/Transfer') {
    html =
      '<p style="font-size:0.85rem; color:var(--text-mid); margin-bottom:14px;">See how much you could save by switching lenders at renewal.</p>' +
      '<div class="form-group" style="margin-bottom:12px; text-align:left;">' +
        '<label for="heroCurrentRate">What rate are you currently paying?</label>' +
        '<input type="text" id="heroCurrentRate" placeholder="5.49" inputmode="decimal">' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:14px; text-align:left;">' +
        '<label for="heroAmort">Remaining amortization</label>' +
        '<select id="heroAmort">' +
          '<option value="10">10 Years</option>' +
          '<option value="15">15 Years</option>' +
          '<option value="20" selected>20 Years</option>' +
          '<option value="25">25 Years</option>' +
          '<option value="30">30 Years</option>' +
        '</select>' +
      '</div>' +
      '<button type="button" class="btn btn--primary btn--large" id="heroCalcBtn" style="width:100%;">See What You Could Save</button>' +
      '<div id="heroCalcResult" style="display:none;"></div>';

  } else if (goal === 'Home Purchase') {
    html =
      '<p style="font-size:0.85rem; color:var(--text-mid); margin-bottom:14px;">See how your equity can help fund your next purchase.</p>' +
      '<div class="form-group" style="margin-bottom:14px; text-align:left;">' +
        '<label for="heroDownNeeded">How much do you need for a down payment?</label>' +
        '<input type="text" id="heroDownNeeded" placeholder="$100,000" inputmode="numeric">' +
      '</div>' +
      '<button type="button" class="btn btn--primary btn--large" id="heroCalcBtn" style="width:100%;">Check Your Equity</button>' +
      '<div id="heroCalcResult" style="display:none;"></div>';
  }

  container.innerHTML = html;

  // Bind currency formatting on dynamic inputs
  ['heroDebtTotal', 'heroDebtPayment', 'heroHelocAmount', 'heroDownNeeded'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) heroBindCurrency(el);
  });

  // Bind calc button
  var calcBtn = document.getElementById('heroCalcBtn');
  if (calcBtn) {
    calcBtn.addEventListener('click', function() {
      var resultDiv = document.getElementById('heroCalcResult');
      var resultHtml = '';

      if (goal === 'Refinance' || goal === 'Switch/Transfer') {
        var currentRate = parseFloat(document.getElementById('heroCurrentRate').value) / 100 || 0;
        var amort = parseInt(document.getElementById('heroAmort').value);
        var currentPayment = heroCalcPayment(mortgageBalance, currentRate, amort);
        var newPayment = heroCalcPayment(mortgageBalance, HERO_BEST_RATE / 100, amort);
        var monthlySavings = Math.max(0, currentPayment - newPayment);
        var annualSavings = monthlySavings * 12;

        resultHtml =
          '<div style="border-top:1.5px solid var(--border); margin-top:16px; padding-top:16px;">' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Current monthly payment</span>' +
              '<span class="hero__result-value" style="color:#c0392b;">' + heroFormatCurrency(currentPayment) + '</span>' +
            '</div>' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">New estimated payment</span>' +
              '<span class="hero__result-value" style="color:#2A7D5B;">' + heroFormatCurrency(newPayment) + '</span>' +
            '</div>' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Monthly savings</span>' +
              '<span class="hero__result-value hero__result-value--hero">' + heroFormatCurrency(monthlySavings) + '</span>' +
            '</div>' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Annual savings</span>' +
              '<span class="hero__result-value">' + heroFormatCurrency(annualSavings) + '</span>' +
            '</div>';

        if (monthlySavings > 0) {
          resultHtml +=
            '<div style="text-align:center; margin:12px 0; font-weight:600; color:#2A7D5B;">&#10003; You could save ' + heroFormatCurrency(annualSavings) + ' per year</div>';
        }

        resultHtml +=
            '<a href="#" class="btn btn--primary btn--large hero__result-cta open-modal" id="heroResultCta">Speak to a Specialist &rarr;</a>' +
            '<a href="/calculators/' + (goal === 'Refinance' ? 'refinance' : 'renewal') + '.html" style="display:block; text-align:center; margin-top:8px; font-size:0.85rem; color:var(--green-mid);">See full calculator &rarr;</a>' +
          '</div>';

      } else if (goal === 'Consolidate Debt') {
        var debtTotal = heroParseCurrency(document.getElementById('heroDebtTotal').value);
        var debtPayment = heroParseCurrency(document.getElementById('heroDebtPayment').value);
        var withinLTV = debtTotal <= borrowingPower;
        var newDebtPayment = heroCalcPayment(debtTotal, HERO_BEST_RATE / 100, 25);
        var monthlySavings = Math.max(0, debtPayment - newDebtPayment);

        resultHtml =
          '<div style="border-top:1.5px solid var(--border); margin-top:16px; padding-top:16px;">' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Current debt payments</span>' +
              '<span class="hero__result-value" style="color:#c0392b;">' + heroFormatCurrency(debtPayment) + '/mo</span>' +
            '</div>' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">New estimated payment</span>' +
              '<span class="hero__result-value" style="color:#2A7D5B;">' + heroFormatCurrency(newDebtPayment) + '/mo</span>' +
            '</div>' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Monthly savings</span>' +
              '<span class="hero__result-value hero__result-value--hero">' + heroFormatCurrency(monthlySavings) + '</span>' +
            '</div>' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Available equity (80% LTV)</span>' +
              '<span class="hero__result-value">' + heroFormatCurrency(borrowingPower) + '</span>' +
            '</div>';

        if (withinLTV) {
          resultHtml +=
            '<div style="text-align:center; margin:12px 0; font-weight:600; color:#2A7D5B;">&#10003; Your debt fits within your available equity</div>';
        } else {
          resultHtml +=
            '<div style="text-align:center; margin:12px 0; font-weight:600; color:#c0392b;">&#10007; Your debt exceeds available equity — a specialist can explore options</div>';
        }

        resultHtml +=
            '<a href="#" class="btn btn--primary btn--large hero__result-cta open-modal" id="heroResultCta">Speak to a Specialist &rarr;</a>' +
            '<a href="/calculators/refinance.html" style="display:block; text-align:center; margin-top:8px; font-size:0.85rem; color:var(--green-mid);">See full calculator &rarr;</a>' +
          '</div>';

      } else if (goal === 'Home Equity Line of Credit') {
        var helocAmount = heroParseCurrency(document.getElementById('heroHelocAmount').value);
        var withinLTV = helocAmount <= borrowingPower && helocAmount > 0;
        var helocRate = 5.95;
        var monthlyInterest = helocAmount * heroMonthlyRate(helocRate / 100);

        resultHtml =
          '<div style="border-top:1.5px solid var(--border); margin-top:16px; padding-top:16px;">' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">HELOC amount requested</span>' +
              '<span class="hero__result-value">' + heroFormatCurrency(helocAmount) + '</span>' +
            '</div>' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Available equity (80% LTV)</span>' +
              '<span class="hero__result-value">' + heroFormatCurrency(borrowingPower) + '</span>' +
            '</div>' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Est. monthly interest payment</span>' +
              '<span class="hero__result-value">' + heroFormatCurrency(monthlyInterest) + '/mo</span>' +
            '</div>';

        if (withinLTV) {
          resultHtml +=
            '<div style="text-align:center; margin:12px 0; font-weight:600; color:#2A7D5B;">&#10003; You have enough equity for this HELOC</div>';
        } else {
          resultHtml +=
            '<div style="text-align:center; margin:12px 0; font-weight:600; color:#c0392b;">&#10007; Requested amount exceeds your equity — a specialist can help</div>';
        }

        resultHtml +=
            '<a href="#" class="btn btn--primary btn--large hero__result-cta open-modal" id="heroResultCta">Speak to a Specialist &rarr;</a>' +
            '<a href="/calculators/heloc.html" style="display:block; text-align:center; margin-top:8px; font-size:0.85rem; color:var(--green-mid);">See full calculator &rarr;</a>' +
          '</div>';

      } else if (goal === 'Home Purchase') {
        var downNeeded = heroParseCurrency(document.getElementById('heroDownNeeded').value);
        var withinEquity = downNeeded <= borrowingPower && downNeeded > 0;

        resultHtml =
          '<div style="border-top:1.5px solid var(--border); margin-top:16px; padding-top:16px;">' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Down payment needed</span>' +
              '<span class="hero__result-value">' + heroFormatCurrency(downNeeded) + '</span>' +
            '</div>' +
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Available equity (80% LTV)</span>' +
              '<span class="hero__result-value">' + heroFormatCurrency(borrowingPower) + '</span>' +
            '</div>';

        if (withinEquity) {
          var remaining = borrowingPower - downNeeded;
          resultHtml +=
            '<div class="hero__result-row">' +
              '<span class="hero__result-label">Equity remaining after purchase</span>' +
              '<span class="hero__result-value">' + heroFormatCurrency(remaining) + '</span>' +
            '</div>' +
            '<div style="text-align:center; margin:12px 0; font-weight:600; color:#2A7D5B;">&#10003; You have enough equity for your down payment</div>';
        } else {
          resultHtml +=
            '<div style="text-align:center; margin:12px 0; font-weight:600; color:#c0392b;">&#10007; Your equity may not cover the full down payment — a specialist can help</div>';
        }

        resultHtml +=
            '<a href="#" class="btn btn--primary btn--large hero__result-cta open-modal" id="heroResultCta">Speak to a Specialist &rarr;</a>' +
            '<a href="/calculators/purchase.html" style="display:block; text-align:center; margin-top:8px; font-size:0.85rem; color:var(--green-mid);">See full calculator &rarr;</a>' +
          '</div>';
      }

      resultDiv.innerHTML = resultHtml;
      resultDiv.style.display = '';
      calcBtn.style.display = 'none';

      // Bind CTA
      var cta = document.getElementById('heroResultCta');
      if (cta) {
        cta.onclick = function(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          document.getElementById('preApprovalModal').classList.add('active');
          document.body.style.overflow = 'hidden';
          return false;
        };
      }
    });
  }
}

// Start over button
heroStartOver.addEventListener('click', function() {
  heroResults.style.display = 'none';
  document.getElementById('heroPage2Content').innerHTML = '';
  document.getElementById('heroOwnerStep').style.display = '';
  heroForm.style.display = '';
  heroForm.reset();
  heroAdditionalGroup.style.display = 'none';
  heroAdditionalToggle.querySelectorAll('.heloc__toggle-btn').forEach(function(b) { b.classList.remove('active'); });
  heroAdditionalToggle.querySelector('[data-value="no"]').classList.add('active');
});

// ===========================
// Help Modal (2-page wizard)
// ===========================
const helpModal = document.getElementById('helpModal');
const helpModalInner = document.getElementById('helpModalInner');
const helpModalClose = document.getElementById('helpModalClose');
const helpPage1 = document.getElementById('helpPage1');
const helpPage2 = document.getElementById('helpPage2');
const helpProgressFill = document.getElementById('helpProgressFill');
const helpForm1 = document.getElementById('helpForm1');
const helpForm2 = document.getElementById('helpForm2');
const helpBorrowInput = document.getElementById('helpBorrow');

// Store original modal HTML so we can reset after broker result
const helpModalOriginalHTML = helpModalInner.innerHTML;

// --- Google Places Autocomplete ---
// Called by the Google Maps script callback, and also after modal reset
function initHelpAutocomplete() {
  const input = document.getElementById('helpAddress');
  if (!input || typeof google === 'undefined') return;
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'ca' }
  });
  // Prevent form submit on Enter while selecting a suggestion
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.querySelector('.pac-container:not([style*="display: none"])')) {
      e.preventDefault();
    }
  });
}
// Expose globally so the Google Maps script callback can call it
window.initHelpAutocomplete = initHelpAutocomplete;

// --- Currency formatting on borrow amount ---
helpBorrowInput.addEventListener('input', () => {
  const raw = helpBorrowInput.value.replace(/[^0-9]/g, '');
  if (raw === '') {
    helpBorrowInput.value = '';
    return;
  }
  helpBorrowInput.value = '$' + Number(raw).toLocaleString('en-CA');
});

// --- Open modal ---
document.querySelectorAll('.open-help-modal').forEach(btn => {
  btn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    helpModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    return false;
  };
});

// --- Close & reset helper ---
function closeHelpModal() {
  helpModal.classList.remove('active');
  document.body.style.overflow = '';
  // Reset to page 1 after close animation
  setTimeout(() => {
    helpModalInner.innerHTML = helpModalOriginalHTML;
    rebindHelpModal();
  }, 200);
}

// --- Rebind internal elements after HTML reset ---
function rebindHelpModal() {
  const close = document.getElementById('helpModalClose');
  const page1 = document.getElementById('helpPage1');
  const page2 = document.getElementById('helpPage2');
  const fill = document.getElementById('helpProgressFill');
  const form1 = document.getElementById('helpForm1');
  const form2 = document.getElementById('helpForm2');
  const borrow = document.getElementById('helpBorrow');

  close.addEventListener('click', closeHelpModal);

  // Currency formatting
  borrow.addEventListener('input', () => {
    const raw = borrow.value.replace(/[^0-9]/g, '');
    if (raw === '') { borrow.value = ''; return; }
    borrow.value = '$' + Number(raw).toLocaleString('en-CA');
  });

  // Page 1 → Page 2
  form1.addEventListener('submit', (e) => {
    e.preventDefault();
    page1.classList.remove('active');
    page2.classList.add('active');
    fill.style.width = '100%';
  });

  // Page 2 → Loading → Broker result
  form2.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = document.getElementById('helpFirstName').value;
    const lastName = document.getElementById('helpLastName').value;
    const helpEmail = document.getElementById('helpEmail').value;
    const helpPhone = document.getElementById('helpPhone').value;
    const goal = document.getElementById('helpGoal').value;
    const address = document.getElementById('helpAddress').value;
    const borrowAmt = document.getElementById('helpBorrow').value;

    // Submit lead to Supabase
    (async function() {
      const brokerId = await fetchActiveBrokerId();
      await submitLead({
        first_name: firstName,
        last_name: lastName,
        email: helpEmail,
        phone: helpPhone,
        source: 'help-wizard',
        page: window.location.pathname,
        goal: goal,
        property_address: address,
        borrow_amount: borrowAmt,
        broker_id: brokerId
      });
    })();

    helpModalInner.innerHTML =
      '<button class="modal__close" id="helpModalCloseLoading" aria-label="Close">&times;</button>' +
      '<div class="help-loading">' +
        '<div class="help-loading__spinner"></div>' +
        '<h2 class="help-loading__text">Pairing you with the best Broker</h2>' +
      '</div>';
    document.getElementById('helpModalCloseLoading').addEventListener('click', closeHelpModal);
    setTimeout(() => {
      showHelpBrokerResult(firstName);
    }, 3000);
  });

  // Re-attach Google Places autocomplete
  initHelpAutocomplete();
}

// --- Initial bindings ---
helpModalClose.addEventListener('click', closeHelpModal);

// Page 1 → Page 2
helpForm1.addEventListener('submit', (e) => {
  e.preventDefault();
  helpPage1.classList.remove('active');
  helpPage2.classList.add('active');
  helpProgressFill.style.width = '100%';
});

// --- Shared: show broker result ---
function showHelpBrokerResult(firstName) {
  helpModalInner.innerHTML =
    '<button class="modal__close" id="helpModalCloseResult" aria-label="Close">&times;</button>' +
    '<div class="broker-result">' +
      '<h2 class="broker-result__heading">You\'ve Been Matched!</h2>' +
      '<p class="broker-result__subtext">' + firstName + ', here is your matched broker:</p>' +
      '<img class="broker-result__logo" src="' + broker.logo + '" alt="' + broker.name + '">' +
      '<h3 class="broker-result__name">' + broker.name + '</h3>' +
      '<div class="broker-result__info">' +
        '<span>' + broker.phone + '</span>' +
        '<span>' + broker.licence + '</span>' +
      '</div>' +
      '<a href="tel:' + broker.phoneTel + '" class="btn btn--primary btn--large broker-result__cta">Call Now</a>' +
    '</div>';
  document.getElementById('helpModalCloseResult').addEventListener('click', closeHelpModal);
}

// Page 2 → Loading → Broker result
helpForm2.addEventListener('submit', (e) => {
  e.preventDefault();
  const firstName = document.getElementById('helpFirstName').value;
  const lastName = document.getElementById('helpLastName').value;
  const helpEmail = document.getElementById('helpEmail').value;
  const helpPhone = document.getElementById('helpPhone').value;
  const goal = document.getElementById('helpGoal').value;
  const address = document.getElementById('helpAddress').value;
  const borrowAmt = document.getElementById('helpBorrow').value;

  // Submit lead to Supabase
  (async function() {
    const brokerId = await fetchActiveBrokerId();
    await submitLead({
      first_name: firstName,
      last_name: lastName,
      email: helpEmail,
      phone: helpPhone,
      source: 'help-wizard',
      page: window.location.pathname,
      goal: goal,
      property_address: address,
      borrow_amount: borrowAmt,
      broker_id: brokerId
    });
  })();

  helpModalInner.innerHTML =
    '<button class="modal__close" id="helpModalCloseLoading" aria-label="Close">&times;</button>' +
    '<div class="help-loading">' +
      '<div class="help-loading__spinner"></div>' +
      '<h2 class="help-loading__text">Pairing you with the best Broker</h2>' +
    '</div>';
  document.getElementById('helpModalCloseLoading').addEventListener('click', closeHelpModal);
  setTimeout(() => {
    showHelpBrokerResult(firstName);
  }, 3000);
});

// --- Overlay & keyboard close ---
helpModal.addEventListener('click', (e) => {
  if (e.target === helpModal) closeHelpModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (helpModal.classList.contains('active')) closeHelpModal();
    var cm = document.getElementById('contactModal');
    if (cm && cm.classList.contains('active')) { cm.classList.remove('active'); document.body.style.overflow = ''; }
  }
});

// ===========================
// Pre-Approval Modal
// ===========================
const modal = document.getElementById('preApprovalModal');
const modalClose = document.getElementById('modalClose');
const preApprovalForm = document.getElementById('preApprovalForm');

// Open modal on any "Get Pre-Approved" button click
const openBtns = document.querySelectorAll('.open-modal');
openBtns.forEach(btn => {
  btn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('preApprovalModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    return false;
  };
});

// Close modal
modalClose.addEventListener('click', () => {
  modal.classList.remove('active');
  document.body.style.overflow = '';
});

// Close on overlay click
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modal.classList.contains('active')) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    var cm = document.getElementById('contactModal');
    if (cm && cm.classList.contains('active')) { cm.classList.remove('active'); document.body.style.overflow = ''; }
  }
});

// Broker info (defaults — overridden by Supabase if available)
var broker = {
  name: 'Lighthouse Lending',
  phone: '905-234-3323',
  phoneTel: '19052343323',
  licence: 'FSRA# 13301',
  logo: 'lighthouse-lending-logo.png'
};

// Form submission
preApprovalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;

  // Submit lead to Supabase (fire and forget — don't block the UI)
  (async function() {
    const brokerId = await fetchActiveBrokerId();
    const calcData = typeof getCalculatorData === 'function' ? getCalculatorData() : null;
    await submitLead({
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      source: calcData ? 'calculator' : 'pre-approval',
      page: window.location.pathname,
      calculator_type: calcData ? calcData.type : null,
      calculator_inputs: calcData ? calcData.inputs : null,
      calculator_results: calcData ? calcData.results : null,
      broker_id: brokerId
    });
  })();

  const modalEl = modal.querySelector('.modal') || modal.lastElementChild;
  modalEl.innerHTML = '<button class="modal__close" id="modalCloseLoading" aria-label="Close">&times;</button>' +
    '<div class="help-loading">' +
      '<div class="help-loading__spinner"></div>' +
      '<h2 class="help-loading__text">Pairing you with the best Broker</h2>' +
    '</div>';
  document.getElementById('modalCloseLoading').addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  });
  setTimeout(() => {
    modalEl.innerHTML = '<button class="modal__close" id="modalCloseResult" aria-label="Close">&times;</button>' +
      '<div class="broker-result">' +
        '<h2 class="broker-result__heading">You\'ve Been Matched!</h2>' +
        '<p class="broker-result__subtext">' + firstName + ', here is your matched broker:</p>' +
        '<img class="broker-result__logo" src="' + broker.logo + '" alt="' + broker.name + '">' +
        '<h3 class="broker-result__name">' + broker.name + '</h3>' +
        '<div class="broker-result__info">' +
          '<span>' + broker.phone + '</span>' +
          '<span>' + broker.licence + '</span>' +
        '</div>' +
        '<a href="tel:' + broker.phoneTel + '" class="btn btn--primary btn--large broker-result__cta">Call Now</a>' +
      '</div>';
    document.getElementById('modalCloseResult').addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }, 3000);
});

// ===========================
// Contact Modal
// ===========================
var contactModal = document.getElementById('contactModal');
if (contactModal) {
  var contactModalClose = document.getElementById('contactModalClose');
  document.querySelectorAll('.open-contact-modal').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      contactModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
  contactModalClose.addEventListener('click', function() { contactModal.classList.remove('active'); document.body.style.overflow = ''; });
  contactModal.addEventListener('click', function(e) { if (e.target === contactModal) { contactModal.classList.remove('active'); document.body.style.overflow = ''; } });
  document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var cName = document.getElementById('contactName').value;
    var cPhone = document.getElementById('contactPhone').value;
    var cEmail = document.getElementById('contactEmail').value;
    var cComments = document.getElementById('contactComments').value;
    (async function() {
      var brokerId = await fetchActiveBrokerId();
      await submitLead({ first_name: cName, last_name: '', email: cEmail, phone: cPhone, source: 'contact', page: window.location.pathname, broker_id: brokerId, notes: cComments });
    })();
    e.target.closest('.modal').innerHTML = '<button class="modal__close" id="contactModalCloseSuccess" aria-label="Close">&times;</button><div style="text-align:center; padding:40px 20px;"><h2 class="modal__title">Message Sent</h2><p class="modal__subtitle">Thanks, ' + cName + '. We\'ll be in touch shortly.</p></div>';
    document.getElementById('contactModalCloseSuccess').addEventListener('click', function() { contactModal.classList.remove('active'); document.body.style.overflow = ''; });
  });
}

// ===========================
// Navbar background on scroll
// ===========================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    navbar.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});
