// ==UserScript==
// @name         YouTube Upload Date & Time (Below Title - JSON-LD Fix)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Shows exact upload date + time in your local timezone right BELOW the video title. Uses JSON-LD for reliability.
// @author       You
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Format ISO date → nice local date & time
    function formatDate(isoString) {
        const date = new Date(isoString);
        if (isNaN(date)) return null;

        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,          // set to true if you want 12-hour (AM/PM)
            // timeZoneName: 'short' // Uncomment to add IST, PST, etc.
        }).format(date);
    }

    function addUploadDateBelowTitle() {
        // Only run on watch pages
        if (!location.pathname.startsWith('/watch')) return;

        // Parse upload date from JSON-LD (reliable source)
        const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
        if (!jsonLdScript) return;

        let jsonLd;
        try {
            jsonLd = JSON.parse(jsonLdScript.textContent);
            if (!Array.isArray(jsonLd)) jsonLd = [jsonLd]; // Sometimes it's an array
        } catch (e) {
            return;
        }

        let uploadIso = null;
        for (const item of jsonLd) {
            if (item['@type'] === 'VideoObject' && item.uploadDate) {
                uploadIso = item.uploadDate;
                break;
            }
        }
        if (!uploadIso) return;

        const niceDate = formatDate(uploadIso);
        if (!niceDate) return;

        // Prevent adding multiple times
        if (document.getElementById('local-upload-date-below-title')) return;

        // Precise title selector for 2025 layout
        const titleElement = document.querySelector('ytd-watch-flexy #title h1 yt-formatted-string');
        if (!titleElement) return;

        const container = document.createElement('div');
        container.id = 'local-upload-date-below-title';
        container.textContent = `Uploaded on ${niceDate}`;
        container.style.cssText = `
            margin-top: 8px;
            font-size: 15px;
            color: var(--yt-spec-text-secondary);
            font-weight: 400;
            line-height: 1.4;
        `;

        // Insert after the title element
        titleElement.parentNode.appendChild(container);

        console.log('✅ Upload date added via JSON-LD!'); // Debug: Check console (F12)
    }

    // Aggressive polling: Every 100ms for up to 20s (catches JS injection)
    let pollInterval;
    function startPolling() {
        if (pollInterval) return;
        let attempts = 0;
        const maxAttempts = 200; // 20 seconds
        pollInterval = setInterval(() => {
            attempts++;
            addUploadDateBelowTitle();
            if (document.getElementById('local-upload-date-below-title') || attempts >= maxAttempts) {
                clearInterval(pollInterval);
                pollInterval = null;
                console.log('⏹️ Polling stopped after', attempts, 'attempts');
            }
        }, 100);
    }

    // YouTube SPA events
    function setupNavigationListeners() {
        const finishHandler = () => {
            if (pollInterval) clearInterval(pollInterval);
            setTimeout(() => {
                addUploadDateBelowTitle();
                startPolling();
            }, 200);
        };
        const startHandler = () => {
            const oldDate = document.getElementById('local-upload-date-below-title');
            if (oldDate) oldDate.remove();
        };

        document.addEventListener('yt-navigate-finish', finishHandler);
        document.addEventListener('yt-navigate-start', startHandler);
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupNavigationListeners();
            addUploadDateBelowTitle();
            startPolling();
        });
    } else {
        setupNavigationListeners();
        addUploadDateBelowTitle();
        startPolling();
    }

    // Extra layers
    window.addEventListener('load', () => {
        addUploadDateBelowTitle();
        if (!pollInterval) startPolling();
    });
    setTimeout(addUploadDateBelowTitle, 0);
    setTimeout(addUploadDateBelowTitle, 1000);

    window.addEventListener('popstate', () => {
        setTimeout(() => {
            addUploadDateBelowTitle();
            startPolling();
        }, 200);
    });
})();