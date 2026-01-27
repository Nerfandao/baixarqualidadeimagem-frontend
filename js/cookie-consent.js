// Cookie Consent Banner for LGPD/GDPR Compliance
(function () {
    'use strict';

    const COOKIE_CONSENT_KEY = 'cookieConsentAccepted';
    const COOKIE_EXPIRY_DAYS = 365;

    // Check if user has already accepted cookies
    function hasAcceptedCookies() {
        return localStorage.getItem(COOKIE_CONSENT_KEY) === 'true';
    }

    // Save cookie consent
    function acceptCookies() {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
        hideBanner();
    }

    // Hide the banner
    function hideBanner() {
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) {
            banner.style.opacity = '0';
            setTimeout(() => {
                banner.style.display = 'none';
            }, 300);
        }
    }

    // Create and show the banner
    function showBanner() {
        // Detect language
        const isEnglish = window.location.pathname.includes('/en');

        const bannerHTML = `
            <div id="cookieConsentBanner" style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #0B5FFF 0%, #0A4FD9 100%);
                color: white;
                padding: 20px;
                box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
                transition: opacity 0.3s ease;
            ">
                <div style="flex: 1; min-width: 300px; max-width: 800px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                        ${isEnglish
                ? 'We use cookies to analyze traffic and personalize ads. By continuing to browse, you agree to our <a href="/en/privacy.html" style="color: #FFD166; text-decoration: underline;">Privacy Policy</a>.'
                : 'Utilizamos cookies para analisar o tráfego e personalizar anúncios. Ao continuar navegando, você concorda com a nossa <a href="/privacidade.html" style="color: #FFD166; text-decoration: underline;">Política de Privacidade</a>.'}
                    </p>
                </div>
                <button id="acceptCookiesBtn" style="
                    background: white;
                    color: #0B5FFF;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    white-space: nowrap;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.25)';" 
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.15)';">
                    ${isEnglish ? 'Accept' : 'Aceitar'}
                </button>
            </div>
        `;

        // Insert banner into body
        document.body.insertAdjacentHTML('beforeend', bannerHTML);

        // Add event listener to accept button
        const acceptBtn = document.getElementById('acceptCookiesBtn');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', acceptCookies);
        }
    }

    // Initialize on page load
    function init() {
        if (!hasAcceptedCookies()) {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', showBanner);
            } else {
                showBanner();
            }
        }
    }

    init();
})();
