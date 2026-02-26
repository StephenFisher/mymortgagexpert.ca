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
// Hero Affordability Calculator
// ===========================
const heroForm = document.getElementById('heroForm');
const heroIncomeInput = document.getElementById('heroIncome');
const heroDebtsInput = document.getElementById('heroDebts');
const heroSubmit = document.getElementById('heroSubmit');
const heroResult = document.getElementById('heroResult');
const heroResultMessage = document.getElementById('heroResultMessage');
const heroMaxPrice = document.getElementById('heroMaxPrice');
const heroMonthly = document.getElementById('heroMonthly');
const heroDown = document.getElementById('heroDown');

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
heroBindCurrency(heroIncomeInput);
heroBindCurrency(heroDebtsInput);

function heroCalcPayment(principal, annualRate, years) {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function heroCalcMaxMortgage(payment, annualRate, years) {
  if (payment <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return payment * n;
  return payment * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
}

function heroCalcMinDown(price) {
  if (price <= 0) return 0;
  if (price >= 1000000) return price * 0.20;
  if (price <= 500000) return price * 0.05;
  return 500000 * 0.05 + (price - 500000) * 0.10;
}

heroForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const annualIncome = heroParseCurrency(heroIncomeInput.value);
  const monthlyDebts = heroParseCurrency(heroDebtsInput.value);

  if (annualIncome <= 0) return;

  const monthlyIncome = annualIncome / 12;
  const maxGDS = monthlyIncome * 0.39;
  const maxTDS = monthlyIncome * 0.44 - monthlyDebts;
  const maxHousing = Math.min(maxGDS, maxTDS);

  if (maxHousing <= 0) {
    heroResult.classList.remove('active');
    heroResultMessage.classList.add('active');
    heroResultMessage.textContent = 'Your monthly debts are too high relative to your income. Try paying down some debt to increase your buying power.';
    heroSubmit.textContent = 'Recalculate';
    return;
  }

  const bestRate = 4.04;
  const stressRate = Math.max(bestRate + 2, 5.25) / 100;
  const actualRate = bestRate / 100;
  const amortYears = 25;
  const heating = 150;

  // Given a mortgage, solve for purchase price: price = mortgage + minDown(price)
  function mortgageToPrice(m) {
    let p = m / 0.95; // try ≤500K: down=5%, mortgage=0.95*price
    if (p <= 500000) return p;
    p = (m - 25000) / 0.90; // 500K–999K: mortgage=0.90*price+25K
    if (p < 1000000) return p;
    return m / 0.80; // ≥1M: down=20%, mortgage=0.80*price
  }

  // Iterative solve: property tax depends on price
  let price = 500000;
  for (let i = 0; i < 10; i++) {
    const propTax = price * 0.01 / 12;
    const avail = maxHousing - propTax - heating;
    if (avail <= 0) { price = 0; break; }
    const mortgage = heroCalcMaxMortgage(avail, stressRate, amortYears);
    price = mortgageToPrice(mortgage);
  }

  // Final pass with converged price
  const propTax = price * 0.01 / 12;
  const avail = maxHousing - propTax - heating;
  const finalMortgage = avail > 0 ? heroCalcMaxMortgage(avail, stressRate, amortYears) : 0;
  const finalPrice = Math.round(mortgageToPrice(finalMortgage));
  const finalMinDown = Math.round(heroCalcMinDown(finalPrice));
  const actualMonthly = heroCalcPayment(finalMortgage, actualRate, amortYears);

  if (finalPrice <= 0) {
    heroResult.classList.remove('active');
    heroResultMessage.classList.add('active');
    heroResultMessage.textContent = 'Based on your income and debts, affordability is limited. Consider paying down debt or increasing your income.';
    heroSubmit.textContent = 'Recalculate';
    return;
  }

  heroResultMessage.classList.remove('active');
  heroResult.classList.add('active');
  heroMaxPrice.textContent = heroFormatCurrency(finalPrice);
  heroMonthly.textContent = heroFormatCurrency(actualMonthly);
  heroDown.textContent = heroFormatCurrency(finalMinDown);
  heroSubmit.textContent = 'Recalculate';

  // Rebind the new CTA button to open the modal
  const ctaBtn = heroResult.querySelector('.open-modal');
  if (ctaBtn) {
    ctaBtn.onclick = function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      document.getElementById('preApprovalModal').classList.add('active');
      document.body.style.overflow = 'hidden';
      return false;
    };
  }
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
  if (e.key === 'Escape' && helpModal.classList.contains('active')) closeHelpModal();
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
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
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
