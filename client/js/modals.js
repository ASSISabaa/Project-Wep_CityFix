/**
 * CityFix - About & Privacy Modals
 * Founder: Seba Assi • Established 2025
 * Drop-in script: no CSS changes required
 */

// ==================== Footer Links Handler ====================
function setupFooterLinks() {
    try {
        const aboutLinks = document.querySelectorAll('a[href*="about"], a[href*="About"]');
        const privacyLinks = document.querySelectorAll('a[href*="privacy"], a[href*="Privacy"]');

        aboutLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showAboutModal();
            });
        });

        privacyLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showPrivacyModal();
            });
        });
    } catch (e) {
        console.warn('Footer links setup skipped:', e);
    }
}

// ==================== Helper Functions ====================
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

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close on ESC key
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    });

    return { modal, content };
}

// ==================== About Modal ====================
function showAboutModal() {
    const existing = document.querySelector('.custom-modal');
    if (existing) existing.remove();

    const { modal, content } = createBaseModal();

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                <img src="assets/CityFix-logo.svg" alt="CityFix" style="width: 48px; height: 48px;">
                <h1 style="
                    font-size: 34px;
                    font-weight: 800;
                    letter-spacing: 0.2px;
                    background: linear-gradient(135deg, #2563EB, #1d4ed8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin: 0;
                ">CityFix</h1>
            </div>
            <p style="color: #64748b; font-size: 16px; margin: 0;">
                Connecting Municipalities and Citizens
            </p>
        </div>

        <div style="
            background: rgba(37, 99, 235, 0.05);
            border-radius: 16px;
            padding: 22px;
            margin-bottom: 22px;
            border-left: 4px solid #2563EB;
        ">
            <h2 style="
                color: #1e293b;
                margin: 0 0 10px;
                font-size: 22px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>🚀</span> About CityFix
            </h2>
            <p style="color: #475569; line-height: 1.8; margin: 0;">
                <strong>CityFix</strong> is a civic-tech platform founded in <strong>2025</strong> by
                <strong>Seba Assi</strong>, an engineering student at 
                <strong>Shenkar College of Engineering, Design and Art</strong>,
                to bridge the gap between residents and local authorities.
                We make it effortless to report city issues, track progress in real time, and collaborate
                transparently with municipal teams—so neighborhoods become safer, cleaner, and more responsive.
            </p>
        </div>

        <div style="display: grid; gap: 16px; margin-bottom: 20px;">
            <div style="
                background: #fff;
                border-radius: 12px;
                padding: 18px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
            ">
                <h3 style="
                    color: #1e293b;
                    margin: 0 0 8px;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <span>🎯</span> Mission
                </h3>
                <p style="color: #64748b; line-height: 1.7; margin: 0;">
                    Empower citizens and municipal teams with modern, accessible tools so issues are 
                    reported faster, resolved smarter, and documented openly.
                </p>
            </div>

            <div style="
                background: #fff;
                border-radius: 12px;
                padding: 18px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
            ">
                <h3 style="
                    color: #1e293b;
                    margin: 0 0 8px;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <span>🌆</span> Vision
                </h3>
                <p style="color: #64748b; line-height: 1.7; margin: 0;">
                    A responsive city where people and public services work as one—clear timelines 
                    and measurable impact for every neighborhood.
                </p>
            </div>
        </div>

        <div style="
            background: linear-gradient(135deg, #2563EB, #1d4ed8);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 18px;
            color: white;
        ">
            <h3 style="
                margin: 0 0 12px;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>✨</span> What We Deliver
            </h3>
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
                gap: 12px;
                font-weight: 500;
            ">
                <div style="display: flex; align-items: center; gap: 8px;">📱 Citizen-first UX</div>
                <div style="display: flex; align-items: center; gap: 8px;">⚡ Fast triage & routing</div>
                <div style="display: flex; align-items: center; gap: 8px;">🔎 Transparent tracking</div>
                <div style="display: flex; align-items: center; gap: 8px;">🤝 Direct comms with city</div>
                <div style="display: flex; align-items: center; gap: 8px;">📊 Actionable analytics</div>
                <div style="display: flex; align-items: center; gap: 8px;">🔒 Enterprise-grade security</div>
            </div>
        </div>

        <div style="
            background: #f0fdf4;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 16px;
        ">
            <h3 style="
                color: #1e293b;
                margin: 0 0 8px;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>🌱</span> Values & Impact
            </h3>
            <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 18px;">
                <li><strong>Transparency:</strong> clear statuses and full history on every report.</li>
                <li><strong>Accessibility:</strong> mobile-friendly, multilingual by design.</li>
                <li><strong>Equity:</strong> prioritize safety and essential services for all areas.</li>
                <li><strong>Privacy-first:</strong> collect the minimum, protect the maximum.</li>
            </ul>
        </div>

        <div style="text-align: center; padding-top: 12px; border-top: 1px solid #e2e8f0;">
            <p style="color:#94a3b8;margin:0 0 12px;font-size:13px;">
              Founded by <strong>Seba Assi</strong>, Software Engineering Student at Shenkar College · © 2025 CityFix — All Rights Reserved
            </p>
            <button onclick="closeModal()" style="
                background: linear-gradient(135deg, #2563EB, #1d4ed8);
                color: #fff;
                border: none;
                padding: 12px 26px;
                border-radius: 10px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 18px rgba(37, 99, 235, 0.4)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(37, 99, 235, 0.3)'">
                Close
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

// ==================== Privacy Modal ====================
function showPrivacyModal() {
    const existing = document.querySelector('.custom-modal');
    if (existing) existing.remove();

    const { modal, content } = createBaseModal();

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="
                color: #1e293b;
                margin: 0 0 6px;
                font-size: 28px;
                font-weight: 800;
            ">🔒 Privacy Policy</h1>
            <p style="color: #64748b; font-size: 14px; margin: 0;">
                Effective: January 2025 · Owner: CityFix (founded by Seba Assi)
            </p>
        </div>

        <div style="
            background: #f8fafc;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 18px;
            border-left: 3px solid #2563EB;
        ">
            <p style="color: #475569; line-height: 1.7; margin: 0;">
                CityFix is a civic-tech platform created in 2025 by <strong>Seba Assi</strong> 
                (Shenkar College) to help citizens communicate effectively with their municipality. 
                We respect your privacy and design our services to collect the minimum information 
                necessary to operate securely and transparently.
            </p>
        </div>

        <section style="margin-bottom: 16px;">
            <h2 style="
                color: #1e293b;
                font-size: 18px;
                margin: 0 0 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>📋</span> Data We Collect
            </h2>
            <ul style="color: #64748b; line-height: 1.8; margin: 0; padding-left: 18px;">
                <li><strong>Account:</strong> name, email, password (hashed), optional phone & profile photo.</li>
                <li><strong>Reports:</strong> titles, descriptions, categories, photos, and locations you submit.</li>
                <li><strong>Usage & Device:</strong> basic telemetry (pages, actions, browser type, IP for security).</li>
                <li><strong>Support:</strong> messages sent via contact/tickets and related attachments.</li>
            </ul>
        </section>

        <section style="margin-bottom: 16px;">
            <h2 style="
                color: #1e293b;
                font-size: 18px;
                margin: 0 0 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>🎯</span> How We Use Your Data
            </h2>
            <ul style="color: #64748b; line-height: 1.8; margin: 0; padding-left: 18px;">
                <li>Authenticate users and personalize your experience (name & avatar in the header).</li>
                <li>Create, route, and track city reports and notify you about status changes.</li>
                <li>Provide support (ticket replies, service updates, critical notices).</li>
                <li>Improve reliability, prevent abuse, and generate aggregate (non-identifying) analytics.</li>
            </ul>
        </section>

        <section style="margin-bottom: 16px;">
            <h2 style="
                color: #1e293b;
                font-size: 18px;
                margin: 0 0 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>⚖️</span> Legal Bases & Retention
            </h2>
            <p style="color: #64748b; line-height: 1.7; margin: 0;">
                We process data on the basis of contract (to deliver the service), legitimate interests
                (security, quality), and consent where required. We retain data only as long as needed
                for the purposes above or to comply with legal obligations.
            </p>
        </section>

        <section style="margin-bottom: 16px;">
            <h2 style="
                color: #1e293b;
                font-size: 18px;
                margin: 0 0 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>🔐</span> Security
            </h2>
            <ul style="color: #64748b; line-height: 1.8; margin: 0; padding-left: 18px;">
                <li>HTTPS everywhere; passwords hashed; role-based access controls for staff.</li>
                <li>Regular backups and monitoring; least-privilege infrastructure access.</li>
                <li>Attachment types restricted and scanned to reduce risk.</li>
            </ul>
        </section>

        <section style="margin-bottom: 16px;">
            <h2 style="
                color: #1e293b;
                font-size: 18px;
                margin: 0 0 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>🤝</span> Sharing
            </h2>
            <p style="color: #64748b; line-height: 1.7; margin: 0 0 6px;">
                We do <strong>not</strong> sell your personal data. We may share limited information with:
            </p>
            <ul style="color: #64748b; line-height: 1.8; margin: 0; padding-left: 18px;">
                <li>Municipal staff responsible for handling your reports.</li>
                <li>Service providers (hosting, email) under strict data protection agreements.</li>
                <li>Legal authorities when required by law or to protect safety.</li>
            </ul>
        </section>

        <section style="margin-bottom: 16px;">
            <h2 style="
                color: #1e293b;
                font-size: 18px;
                margin: 0 0 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>✅</span> Your Rights
            </h2>
            <ul style="color: #64748b; line-height: 1.8; margin: 0; padding-left: 18px;">
                <li><strong>Access:</strong> Request a copy of your personal data.</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> Request removal of your account and associated data.</li>
                <li><strong>Portability:</strong> Receive your data in a structured format.</li>
                <li><strong>Objection:</strong> Opt out of certain processing activities.</li>
            </ul>
        </section>

        <section style="margin-bottom: 16px;">
            <h2 style="
                color: #1e293b;
                font-size: 18px;
                margin: 0 0 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>🍪</span> Cookies
            </h2>
            <p style="color: #64748b; line-height: 1.7; margin: 0;">
                We use essential cookies for authentication and preferences. Analytics cookies (if any) 
                are optional and can be disabled in your browser settings. We respect "Do Not Track" signals.
            </p>
        </section>

        <div style="
            background: #eff6ff;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 16px;
        ">
            <h2 style="
                color: #1e293b;
                font-size: 18px;
                margin: 0 0 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>📧</span> Contact Us
            </h2>
            <p style="color: #475569; margin: 0 0 10px;">
                For privacy questions or to exercise your rights:
            </p>
            <div style="color: #2563EB;">
                <p style="margin: 4px 0;">📧 privacy@cityfix.com</p>
                <p style="color: #64748b; margin: 8px 0 0; font-size: 13px;">
                    Response time: Within 48 business hours
                </p>
            </div>
        </div>

        <div style="text-align: center; padding-top: 12px; border-top: 1px solid #e2e8f0;">
            <button onclick="closeModal()" style="
                background: linear-gradient(135deg, #2563EB, #1d4ed8);
                color: #fff;
                border: none;
                padding: 12px 26px;
                border-radius: 10px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 18px rgba(37, 99, 235, 0.4)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(37, 99, 235, 0.3)'">
                I Understand
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

// ==================== CSS Animations ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .custom-modal.fade-out {
        animation: fadeOut 0.18s ease forwards;
    }
    
    .custom-modal::-webkit-scrollbar {
        width: 8px;
    }
    
    .custom-modal::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .custom-modal::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }
    
    .custom-modal::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
    }

    @media (max-width: 768px) {
        .custom-modal > div {
            padding: 25px !important;
            margin: 10px;
        }
    }
`;
document.head.appendChild(style);

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', setupFooterLinks);

// Export functions to window for manual calls
window.showAboutModal = showAboutModal;
window.showPrivacyModal = showPrivacyModal;
window.closeModal = closeModal;

console.log('✅ CityFix About & Privacy modals loaded - Founded by Seba Assi, 2025');