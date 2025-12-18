(function () {
    'use strict';

    const DATE_ID = 'local-upload-date-below-title';
    let lastVideoId = null;

    function formatDate(isoString) {
        const date = new Date(isoString);
        if (isNaN(date)) return null;
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    }

    function getVideoId() {
        return new URLSearchParams(location.search).get('v');
    }

    function getUploadDate() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const items = Array.isArray(data) ? data : [data];
                for (const item of items) {
                    if (item['@type'] === 'VideoObject' && item.uploadDate) {
                        return item.uploadDate;
                    }
                }
            } catch {}
        }
        return null;
    }

    function removeOld() {
        const old = document.getElementById(DATE_ID);
        if (old) old.remove();
    }

    function insertDate() {
        if (!location.pathname.startsWith('/watch')) return;

        const videoId = getVideoId();
        if (!videoId || videoId === lastVideoId) return;

        const uploadIso = getUploadDate();
        if (!uploadIso) return;

        const title = document.querySelector('ytd-watch-flexy #title');
        if (!title) return;

        removeOld();

        const dateText = formatDate(uploadIso);
        if (!dateText) return;

        const el = document.createElement('div');
        el.id = DATE_ID;
        el.textContent = `Uploaded on ${dateText}`;
        el.style.cssText = `
            margin-top: 4px;
            font-size: 14px;
            color: var(--yt-spec-text-secondary);
            font-weight: 400;
            line-height: 1.4;
        `;

        title.parentNode?.insertBefore(el, title.nextSibling);
        lastVideoId = videoId;
    }

    function waitForJsonLdAndInsert() {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (getUploadDate()) {
                clearInterval(interval);
                insertDate();
            }
            if (attempts > 20) clearInterval(interval);
        }, 300);
    }

    document.addEventListener('yt-navigate-finish', () => {
        lastVideoId = null;
        removeOld();
        waitForJsonLdAndInsert();
    });

    waitForJsonLdAndInsert();
})();
