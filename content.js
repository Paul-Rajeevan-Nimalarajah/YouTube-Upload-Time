(function () {
    'use strict';

    const DATE_ID = 'local-upload-date-below-title';
    let titleObserver = null;

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

    function getUploadDate() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                let data = JSON.parse(script.textContent);
                if (!Array.isArray(data)) data = [data];
                for (const item of data) {
                    if (item['@type'] === 'VideoObject' && item.uploadDate) {
                        return item.uploadDate;
                    }
                }
            } catch {}
        }
        return null;
    }

    function addUploadDateBelowTitle() {
        if (!location.pathname.startsWith('/watch')) return;
        if (document.getElementById(DATE_ID)) return;

        const uploadIso = getUploadDate();
        if (!uploadIso) return;

        const niceDate = formatDate(uploadIso);
        if (!niceDate) return;

        const titleWrapper = document.querySelector('ytd-watch-flexy #title');
        if (!titleWrapper) return;

        const container = document.createElement('div');
        container.id = DATE_ID;
        container.textContent = `Uploaded on ${niceDate}`;
        container.style.cssText = `
            margin-top: 4px;
            font-size: 14px;
            color: var(--yt-spec-text-secondary);
            font-weight: 400;
            line-height: 1.4;
            display: block;
        `;

        if (titleWrapper.parentNode) {
            titleWrapper.parentNode.insertBefore(container, titleWrapper.nextSibling);
        }

        observeTitleChanges();
    }

    function observeTitleChanges() {
        if (titleObserver) return;

        const titleContainer = document.querySelector('ytd-watch-flexy #title');
        if (!titleContainer) return;

        titleObserver = new MutationObserver(() => {
            if (!document.getElementById(DATE_ID)) {
                addUploadDateBelowTitle();
            }
        });

        titleObserver.observe(titleContainer, {
            childList: true,
            subtree: true
        });
    }

    function reset() {
        const old = document.getElementById(DATE_ID);
        if (old) old.remove();

        if (titleObserver) {
            titleObserver.disconnect();
            titleObserver = null;
        }
    }

    document.addEventListener('yt-navigate-start', reset);
    document.addEventListener('yt-navigate-finish', () => {
        setTimeout(addUploadDateBelowTitle, 200);
    });

    addUploadDateBelowTitle();
    window.addEventListener('load', addUploadDateBelowTitle);

})();
