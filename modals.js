// =============================================
// MyMortgageExpert — Shared Modal Templates
// =============================================
//
// Usage:
//   <script src="modals.js"></script>
//   <script>initPreApprovalModal('quick');</script>
//
// Types:
//   'quick' — Simple name / phone / email form → broker match
//   'large' — 2-page wizard (mortgage details → contact info) → broker match
//
// Requires: global `broker` object, supabase-config.js loaded

(function() {

  /* ── helpers ── */

  function closeModal(overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showLoading(inner, overlay) {
    inner.innerHTML =
      '<button class="modal__close" aria-label="Close">&times;</button>' +
      '<div class="help-loading">' +
        '<div class="help-loading__spinner"></div>' +
        '<h2 class="help-loading__text">Pairing you with the best Broker</h2>' +
      '</div>';
    inner.querySelector('.modal__close').addEventListener('click', function() { closeModal(overlay); });
  }

  function showBrokerResult(inner, overlay, displayName) {
    inner.innerHTML =
      '<button class="modal__close" aria-label="Close">&times;</button>' +
      '<div class="broker-result">' +
        '<h2 class="broker-result__heading">You\'ve Been Matched!</h2>' +
        '<p class="broker-result__subtext">' + displayName + ', here is your matched broker:</p>' +
        '<img class="broker-result__logo" src="' + broker.logo + '" alt="' + broker.name + '">' +
        '<h3 class="broker-result__name">' + broker.name + '</h3>' +
        '<div class="broker-result__info">' +
          '<span>' + broker.phone + '</span>' +
          '<span>' + broker.licence + '</span>' +
        '</div>' +
        '<a href="tel:' + broker.phoneTel + '" class="btn btn--primary btn--large broker-result__cta">Call Now</a>' +
      '</div>';
    inner.querySelector('.modal__close').addEventListener('click', function() { closeModal(overlay); });
  }

  /* ── Quick modal HTML ── */

  function quickHTML() {
    return (
      '<button class="modal__close" aria-label="Close">&times;</button>' +
      '<h2 class="modal__title">Speak to a Specialist</h2>' +
      '<p class="modal__subtitle">Enter your details and we\'ll connect you with a licensed mortgage broker.</p>' +
      '<form class="modal__form" id="quickForm">' +
        '<div class="form-group">' +
          '<label for="qName">Name</label>' +
          '<input type="text" id="qName" placeholder="Your Name" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="qPhone">Phone Number</label>' +
          '<input type="tel" id="qPhone" placeholder="(555) 555-5555" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="qEmail">Email</label>' +
          '<input type="email" id="qEmail" placeholder="you@example.com" required>' +
        '</div>' +
        '<p class="modal__disclosure" style="margin-bottom:12px;">By clicking below you consent to being contacted by a licensed broker.</p>' +
        '<button type="submit" class="btn btn--primary btn--large modal__submit">Connect Me With My Broker</button>' +
      '</form>'
    );
  }

  function setupQuick(overlay, inner) {
    inner.querySelector('#quickForm').addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('qName').value;
      var phone = document.getElementById('qPhone').value;
      var email = document.getElementById('qEmail').value;

      // Include calculator data if available
      var notes = '';
      var calcType = null;
      if (typeof getCalculatorData === 'function') {
        var cd = getCalculatorData();
        calcType = cd.type || null;
        if (cd.inputs) {
          notes = Object.keys(cd.inputs).map(function(k) { return k + ': ' + cd.inputs[k]; }).join(' | ');
        }
        if (cd.results) {
          notes += (notes ? ' || Results: ' : 'Results: ') + Object.keys(cd.results).map(function(k) { return k + ': ' + cd.results[k]; }).join(' | ');
        }
      }

      (async function() {
        var brokerId = await fetchActiveBrokerId();
        await submitLead({
          first_name: name, last_name: '', email: email, phone: phone,
          source: 'calculator', page: window.location.pathname,
          broker_id: brokerId,
          calculator_type: calcType,
          notes: notes || undefined
        });
      })();

      showLoading(inner, overlay);
      setTimeout(function() { showBrokerResult(inner, overlay, name); }, 3000);
    });
  }

  /* ── Large modal HTML (2-page wizard) ── */

  function largeHTML() {
    return (
      '<button class="modal__close" aria-label="Close">&times;</button>' +
      '<div class="help-progress">' +
        '<div class="help-progress__fill" id="preApprovalProgress" style="width:50%"></div>' +
      '</div>' +

      /* Page 1 */
      '<div class="help-page active" id="preApprovalPage1">' +
        '<h2 class="modal__title">Get Pre-Approved</h2>' +
        '<p class="modal__subtitle">Tell us about your situation so we can match you with the right broker.</p>' +
        '<form class="modal__form" id="preApprovalForm1">' +
          '<div class="form-group">' +
            '<label for="paGoal">How can we help?</label>' +
            '<select id="paGoal" required>' +
              '<option value="" disabled selected>Select an option</option>' +
              '<option value="HELOC">HELOC</option>' +
              '<option value="Refinance">Refinance</option>' +
              '<option value="Debt Consolidation">Debt Consolidation</option>' +
              '<option value="Power of Sale Help">Power of Sale Help</option>' +
              '<option value="Home Purchase">Home Purchase</option>' +
              '<option value="Lower My Mortgage Rate">Lower My Mortgage Rate</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="paPropertyValue">Estimated property value</label>' +
            '<input type="text" id="paPropertyValue" placeholder="$500,000" inputmode="numeric" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="paBalance">Current mortgage balance</label>' +
            '<input type="text" id="paBalance" placeholder="$350,000" inputmode="numeric" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="paRate">Current rate (%)</label>' +
            '<input type="text" id="paRate" placeholder="5.49" inputmode="decimal" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Do you have a 2nd Mortgage or HELOC currently?</label>' +
            '<div class="heloc__toggle" id="paSecondMortgage">' +
              '<button type="button" class="heloc__toggle-btn" data-value="Yes">Yes</button>' +
              '<button type="button" class="heloc__toggle-btn active" data-value="No">No</button>' +
            '</div>' +
          '</div>' +
          '<div class="form-group" id="paSecondMortgageAmountGroup" style="display:none;">' +
            '<label for="paSecondMortgageAmount">2nd Mortgage / HELOC balance</label>' +
            '<input type="text" id="paSecondMortgageAmount" placeholder="$50,000" inputmode="numeric">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Are you behind on any payments?</label>' +
            '<div class="heloc__toggle" id="paBehind">' +
              '<button type="button" class="heloc__toggle-btn" data-value="Yes">Yes</button>' +
              '<button type="button" class="heloc__toggle-btn active" data-value="No">No</button>' +
            '</div>' +
          '</div>' +
          '<div class="form-group" id="paBehindAmountGroup" style="display:none;">' +
            '<label for="paBehindAmount">How much are you behind?</label>' +
            '<input type="text" id="paBehindAmount" placeholder="$5,000" inputmode="numeric">' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="paBorrow">How much do you want to borrow?</label>' +
            '<input type="text" id="paBorrow" placeholder="$100,000" inputmode="numeric" required>' +
          '</div>' +
          '<button type="submit" class="btn btn--primary btn--large modal__submit">Next</button>' +
        '</form>' +
      '</div>' +

      /* Page 2 */
      '<div class="help-page" id="preApprovalPage2">' +
        '<h2 class="modal__title">Almost There!</h2>' +
        '<p class="modal__subtitle">Enter your contact details so we can connect you with a specialist.</p>' +
        '<form class="modal__form" id="preApprovalForm2">' +
          '<div class="modal__row">' +
            '<div class="form-group">' +
              '<label for="paFirstName">First Name</label>' +
              '<input type="text" id="paFirstName" placeholder="First Name" required>' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="paLastName">Last Name</label>' +
              '<input type="text" id="paLastName" placeholder="Last Name" required>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="paPhone">Phone Number</label>' +
            '<input type="tel" id="paPhone" placeholder="(555) 555-5555" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="paEmail">Email</label>' +
            '<input type="email" id="paEmail" placeholder="you@example.com" required>' +
          '</div>' +
          '<button type="submit" class="btn btn--primary btn--large modal__submit">Find Your Broker</button>' +
        '</form>' +
        '<p class="modal__disclosure">By providing your contact information, you authorize the broker to contact you about your inquiry. MyMortgageExpert does not provide any mortgage services and is not responsible for any services offered by the broker.</p>' +
      '</div>'
    );
  }

  function setupLarge(overlay, inner) {
    // Page 1 → Page 2
    inner.querySelector('#preApprovalForm1').addEventListener('submit', function(e) {
      e.preventDefault();
      document.getElementById('preApprovalPage1').classList.remove('active');
      document.getElementById('preApprovalPage2').classList.add('active');
      document.getElementById('preApprovalProgress').style.width = '100%';
    });

    // Yes/No toggles with conditional amount fields
    var toggleMap = {
      paSecondMortgage: { group: 'paSecondMortgageAmountGroup', input: 'paSecondMortgageAmount' },
      paBehind: { group: 'paBehindAmountGroup', input: 'paBehindAmount' }
    };
    ['paSecondMortgage', 'paBehind'].forEach(function(id) {
      document.getElementById(id).addEventListener('click', function(e) {
        var btn = e.target.closest('.heloc__toggle-btn');
        if (!btn) return;
        this.querySelectorAll('.heloc__toggle-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var map = toggleMap[id];
        if (btn.dataset.value === 'Yes') {
          document.getElementById(map.group).style.display = '';
        } else {
          document.getElementById(map.group).style.display = 'none';
          document.getElementById(map.input).value = '';
        }
      });
    });

    // Currency formatting
    ['paPropertyValue', 'paBalance', 'paBorrow', 'paSecondMortgageAmount', 'paBehindAmount'].forEach(function(id) {
      document.getElementById(id).addEventListener('input', function() {
        var raw = this.value.replace(/[^0-9]/g, '');
        if (raw === '') { this.value = ''; return; }
        this.value = '$' + Number(raw).toLocaleString('en-CA');
      });
    });

    // Page 2 submit
    inner.querySelector('#preApprovalForm2').addEventListener('submit', function(e) {
      e.preventDefault();
      var firstName = document.getElementById('paFirstName').value;
      var lastName = document.getElementById('paLastName').value;
      var phone = document.getElementById('paPhone').value;
      var email = document.getElementById('paEmail').value;

      var goal = document.getElementById('paGoal').value;
      var propertyValue = document.getElementById('paPropertyValue').value;
      var balance = document.getElementById('paBalance').value;
      var rate = document.getElementById('paRate').value;
      var secondMortgage = document.querySelector('#paSecondMortgage .heloc__toggle-btn.active').dataset.value;
      var secondMortgageAmt = document.getElementById('paSecondMortgageAmount').value || 'N/A';
      var behind = document.querySelector('#paBehind .heloc__toggle-btn.active').dataset.value;
      var behindAmt = document.getElementById('paBehindAmount').value || 'N/A';
      var borrow = document.getElementById('paBorrow').value;

      (async function() {
        var brokerId = await fetchActiveBrokerId();
        await submitLead({
          first_name: firstName, last_name: lastName, email: email, phone: phone,
          source: 'pre-approval', page: window.location.pathname,
          broker_id: brokerId,
          notes: 'Goal: ' + goal + ' | Property Value: ' + propertyValue + ' | Balance: ' + balance + ' | Rate: ' + rate + '% | 2nd Mortgage/HELOC: ' + secondMortgage + (secondMortgage === 'Yes' ? ' (' + secondMortgageAmt + ')' : '') + ' | Behind on Payments: ' + behind + (behind === 'Yes' ? ' (' + behindAmt + ')' : '') + ' | Want to Borrow: ' + borrow
        });
      })();

      showLoading(inner, overlay);
      setTimeout(function() { showBrokerResult(inner, overlay, firstName); }, 3000);
    });
  }

  /* ── Init ── */

  window.initPreApprovalModal = function(type) {
    // Remove existing inline modal if present
    var existing = document.getElementById('preApprovalModal');
    if (existing) existing.remove();

    var originalHTML = (type === 'large') ? largeHTML() : quickHTML();

    // Create elements
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'preApprovalModal';

    var inner = document.createElement('div');
    inner.className = 'modal';
    inner.id = 'preApprovalModalInner';
    inner.innerHTML = originalHTML;
    overlay.appendChild(inner);
    document.body.appendChild(overlay);

    // Rebuild handlers (used after reset too)
    function attachHandlers() {
      // Close button
      var closeBtn = inner.querySelector('.modal__close');
      if (closeBtn) closeBtn.addEventListener('click', function() { closeModal(overlay); });

      // Form handlers
      if (type === 'large') {
        setupLarge(overlay, inner);
      } else {
        setupQuick(overlay, inner);
      }
    }

    attachHandlers();

    // Open handlers — any .open-modal button on the page
    document.querySelectorAll('.open-modal').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // If modal was submitted (no form left), reset it
        if (!inner.querySelector('form')) {
          inner.innerHTML = originalHTML;
          attachHandlers();
        }

        // Reset to page 1 for large modal
        if (type === 'large') {
          var p1 = document.getElementById('preApprovalPage1');
          var p2 = document.getElementById('preApprovalPage2');
          if (p1 && p2) {
            p1.classList.add('active');
            p2.classList.remove('active');
            document.getElementById('preApprovalProgress').style.width = '50%';
          }
        }

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        return false;
      });
    });

    // Overlay click to close
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal(overlay);
    });

    // Escape to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal(overlay);
    });
  };

})();
