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
// Hero Form Tab Switching
// ===========================
const tabs = document.querySelectorAll('.hero__tab');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// ===========================
// Form Submission (prevent default)
// ===========================
const heroForm = document.getElementById('heroForm');

heroForm.addEventListener('submit', (e) => {
  e.preventDefault();
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

  // Page 2 → Broker result
  form2.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = document.getElementById('helpFirstName').value;
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

// Page 2 → Broker result
helpForm2.addEventListener('submit', (e) => {
  e.preventDefault();
  const firstName = document.getElementById('helpFirstName').value;
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

// Broker info (hardcoded for now)
const broker = {
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
  const modalEl = document.querySelector('.modal');
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
  // Re-bind close button
  document.getElementById('modalCloseResult').addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  });
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
