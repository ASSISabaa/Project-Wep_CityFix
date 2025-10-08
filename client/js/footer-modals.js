/**
 * CityFix - Contact & Privacy Modals
 */

function closeModal() {
  const modal = document.querySelector('.custom-modal');
  if (!modal) return;
  modal.classList.add('fade-out');
  setTimeout(() => modal.remove(), 180);
}

function createBaseModal() {
  const modal = document.createElement('div');
  modal.className = 'custom-modal';
  modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
      animation: fadeIn 0.25s ease;
      padding: 20px;
      overflow-y: auto;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
      background: #fff;
      border-radius: 20px;
      padding: 40px;
      max-width: 760px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.18);
      transform: scale(0.96);
      transition: transform 0.25s ease;
      border: 1px solid rgba(37, 99, 235, 0.08);
  `;

  modal.appendChild(content);
  setTimeout(() => (content.style.transform = 'scale(1)'), 10);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  });

  return { modal, content };
}

/* ==================== Contact IT Modal ==================== */
function showContactModal() {
  const existing = document.querySelector('.custom-modal');
  if (existing) existing.remove();

  const { modal, content } = createBaseModal();

  content.innerHTML = `
    <div style="text-align:center; margin-bottom:20px;">
      <h1 style="font-size:28px; font-weight:800; color:#1e293b;">📞 Contact IT Support</h1>
      <p style="color:#64748b; margin:0; font-size:14px;">Need technical help? Reach out to our IT team.</p>
    </div>

    <div style="background:#f8fafc; border-radius:12px; padding:18px; margin-bottom:16px; border-left:3px solid #2563EB;">
      <p style="color:#475569; line-height:1.7; margin:0;">
        Our IT department is here to help with account issues, system access, bug reports, or 
        technical difficulties while using CityFix. Please choose one of the options below:
      </p>
    </div>

    <ul style="color:#64748b; line-height:1.8; padding-left:18px; margin-bottom:20px;">
      <li>Email support: <strong>cityfix.contact@gmail.com</strong></li>
      <li>Phone hotline: <strong>+972-3-123-4567</strong></li>
      <li>Live chat (available Mon–Fri, 9 AM–6 PM)</li>
    </ul>

    <div style="text-align:center; padding-top:12px; border-top:1px solid #e2e8f0;">
      <button onclick="closeModal()" style="
          background:linear-gradient(135deg,#2563EB,#1d4ed8);
          color:#fff; border:none; padding:12px 26px;
          border-radius:10px; font-weight:600; font-size:15px;
          cursor:pointer; transition:all 0.2s ease;
          box-shadow:0 4px 12px rgba(37,99,235,0.3);">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}


/* ==================== Privacy Policy Modal ==================== */
function showPrivacyModal() {
  const existing = document.querySelector('.custom-modal');
  if (existing) existing.remove();

  const { modal, content } = createBaseModal();

  content.innerHTML = `
    <div style="text-align:center; margin-bottom:20px;">
      <h1 style="font-size:28px; font-weight:800; color:#1e293b;">🔒 Privacy Policy</h1>
      <p style="color:#64748b; margin:0; font-size:14px;">Effective: January 2025 · CityFix Platform</p>
    </div>

    <section style="margin-bottom:16px;">
      <h2 style="font-size:18px; color:#1e293b; margin-bottom:10px;">📋 What We Collect</h2>
      <ul style="color:#64748b; line-height:1.8; padding-left:18px;">
        <li>Account details (name, email, secure password hash).</li>
        <li>Reports you submit (text, photos, location).</li>
        <li>Basic usage logs (IP, browser type, actions).</li>
      </ul>
    </section>

    <section style="margin-bottom:16px;">
      <h2 style="font-size:18px; color:#1e293b; margin-bottom:10px;">🎯 How We Use Data</h2>
      <p style="color:#475569; line-height:1.7; margin:0;">
        We use your data only to provide core services: authenticating your account, routing 
        reports to municipalities, updating you on progress, and ensuring platform security.
      </p>
    </section>

    <section style="margin-bottom:16px;">
      <h2 style="font-size:18px; color:#1e293b; margin-bottom:10px;">✅ Your Rights</h2>
      <ul style="color:#64748b; line-height:1.8; padding-left:18px;">
        <li>Request a copy or deletion of your data.</li>
        <li>Update your information anytime in settings.</li>
        <li>Contact our privacy team for further assistance.</li>
      </ul>
    </section>

    <div style="text-align:center; padding-top:12px; border-top:1px solid #e2e8f0;">
      <button onclick="closeModal()" style="
          background:linear-gradient(135deg,#2563EB,#1d4ed8);
          color:#fff; border:none; padding:12px 26px;
          border-radius:10px; font-weight:600; font-size:15px;
          cursor:pointer; transition:all 0.2s ease;
          box-shadow:0 4px 12px rgba(37,99,235,0.3);">
        I Understand
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

/* ==================== CSS Animations ==================== */
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  @keyframes fadeOut { from{opacity:1;} to{opacity:0;} }
  .custom-modal.fade-out { animation: fadeOut 0.18s ease forwards; }
`;
document.head.appendChild(style);

/* ==================== Initialize ==================== */
document.addEventListener('DOMContentLoaded', () => {
  const contactLinks = document.querySelectorAll('a[href*="contact"]');
  const privacyLinks = document.querySelectorAll('a[href*="privacy"]');

  contactLinks.forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    showContactModal();
  }));

  privacyLinks.forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    showPrivacyModal();
  }));
});

/* Export */
window.showContactModal = showContactModal;
window.showPrivacyModal = showPrivacyModal;
window.closeModal = closeModal;