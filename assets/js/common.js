// aHR0cHM6Ly9naXRodWIuY29tL2x1b3N0MjYvYWNhZGVtaWMtaG9tZXBhZ2U=
$(function () {
    lazyLoadOptions = {
        scrollDirection: 'vertical',
        effect: 'fadeIn',
        effectTime: 120,
        placeholder: "",
        onError: function(element) {
            console.log('[lazyload] Error loading ' + element.data('src'));
        },
        afterLoad: function(element) {
            if (element.is('img')) {
                // remove background-image style
                element.css('background-image', 'none');
            } else if (element.is('div')) {
                // set the style to background-size: cover; 
                element.css('background-size', 'cover');
                element.css('background-position', 'center');
            }
        }
    }

    $('img.lazy, div.lazy:not(.always-load)').Lazy({visibleOnly: true, ...lazyLoadOptions});
    $('div.lazy.always-load').Lazy({visibleOnly: false, ...lazyLoadOptions});

    $('[data-toggle="tooltip"]').tooltip()

    // Fallback modal controls for QR popups in case Bootstrap dismiss hooks
    // are interrupted by custom styles or runtime conflicts.
    function cleanupModalArtifacts() {
        $('body').removeClass('modal-open').css('padding-right', '');
        $('.modal-backdrop').remove();
    }

    function bindQrModalFallback(modalSelector) {
        var $modal = $(modalSelector);
        if (!$modal.length) return;

        $modal.on('hidden.bs.modal', function () {
            cleanupModalArtifacts();
        });

        $modal.on('click', '[data-dismiss="modal"], [data-bs-dismiss="modal"]', function (e) {
            e.preventDefault();
            $modal.modal('hide');
            // Let Bootstrap animate first, then clean up any stale backdrop.
            setTimeout(cleanupModalArtifacts, 250);
        });

        $modal.on('click', function (e) {
            if (e.target === this) {
                $modal.modal('hide');
            }
        });
    }

    bindQrModalFallback('#modal-wechat');
    bindQrModalFallback('#modal-rednote');

    // Bootstrap modals should live under <body> to avoid stacking-context issues.
    $('#modal-wechat, #modal-rednote, #modal-info').each(function () {
        var $modal = $(this);
        if ($modal.length && !$modal.parent().is('body')) {
            $modal.appendTo('body');
        }
    });

    var $grid = $('.grid').masonry({
        "percentPosition": true,
        "itemSelector": ".grid-item",
        "columnWidth": ".grid-sizer"
    });
    // layout Masonry after each image loads
    $grid.imagesLoaded().progress(function () {
        $grid.masonry('layout');
    });

    $(".lazy").on("load", function () {
        $grid.masonry('layout');
    });

    var themeToggle = document.getElementById('theme-toggle');
    var themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
    var themeLabel = themeToggle ? themeToggle.querySelector('.theme-toggle-label') : null;
    var themes = [
        { id: 'light', label: 'Linen', icon: 'fas fa-sun' },
        { id: 'dark', label: 'Midnight', icon: 'fas fa-moon' },
        { id: 'atelier', label: 'Atelier', icon: 'fas fa-palette' },
        { id: 'sage', label: 'Sage', icon: 'fas fa-leaf' },
        { id: 'harbor', label: 'Harbor', icon: 'fas fa-compass' },
        { id: 'newyorker', label: 'New Yorker', icon: 'fas fa-newspaper' }
    ];

    function getThemeConfig(theme) {
        for (var i = 0; i < themes.length; i += 1) {
            if (themes[i].id === theme) {
                return themes[i];
            }
        }
        return themes[0];
    }

    function applyTheme(theme) {
        var themeConfig = getThemeConfig(theme);
        document.documentElement.setAttribute('data-theme', themeConfig.id);
        localStorage.setItem('theme', themeConfig.id);

        if (themeToggle) {
            themeToggle.setAttribute('aria-label', 'Switch theme');
            themeToggle.setAttribute('title', 'Switch theme');
        }

        if (themeLabel) {
            themeLabel.textContent = 'Theme: ' + themeConfig.label;
        }

        if (themeIcon) {
            themeIcon.className = themeConfig.icon;
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var currentTheme = document.documentElement.getAttribute('data-theme') || themes[0].id;
            var currentIndex = 0;
            for (var i = 0; i < themes.length; i += 1) {
                if (themes[i].id === currentTheme) {
                    currentIndex = i;
                    break;
                }
            }
            var nextTheme = themes[(currentIndex + 1) % themes.length].id;
            applyTheme(nextTheme);
        });

        applyTheme(document.documentElement.getAttribute('data-theme') || themes[0].id);
    }

    function fallbackCopyText(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    function setBibtexButtonLabel(button, label) {
        var labelNode = button.querySelector('span');
        if (labelNode) {
            labelNode.textContent = label;
        }
    }

    function resetBibtexButton(button) {
        window.setTimeout(function () {
            setBibtexButtonLabel(button, 'BibTeX');
            button.classList.remove('is-copied');
        }, 1600);
    }

    document.addEventListener('click', function (event) {
        var button = event.target.closest('.bibtex-copy-btn');
        if (!button) return;

        var targetId = button.getAttribute('data-bibtex-target');
        var source = targetId ? document.getElementById(targetId) : null;
        if (!source) return;

        var bibtex = (source.textContent || '').trim();
        if (!bibtex) return;

        function onSuccess() {
            setBibtexButtonLabel(button, 'Copied');
            button.classList.add('is-copied');
            resetBibtexButton(button);
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(bibtex).then(onSuccess).catch(function () {
                fallbackCopyText(bibtex);
                onSuccess();
            });
            return;
        }

        fallbackCopyText(bibtex);
        onSuccess();
    });

    function getScrollableParent(node) {
        var current = node;
        while (current && current !== document.body && current !== document.documentElement) {
            if (current instanceof Element) {
                var style = window.getComputedStyle(current);
                var overflowY = style.overflowY;
                var canScroll = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
                    && current.scrollHeight > current.clientHeight;
                if (canScroll) {
                    return current;
                }
            }
            current = current.parentNode;
        }
        return null;
    }

    function canScrollWithin(element, deltaY) {
        if (!element || !deltaY) return false;
        var top = element.scrollTop;
        var maxTop = element.scrollHeight - element.clientHeight;
        if (deltaY > 0) {
            return top < maxTop;
        }
        return top > 0;
    }

    function preventOverscroll(e) {
        var scrollableParent = getScrollableParent(e.target);
        if (canScrollWithin(scrollableParent, e.deltaY)) {
            return;
        }
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if ((scrollTop <= 0 && e.deltaY < 0) || (scrollTop >= maxScroll && e.deltaY > 0)) {
            e.preventDefault();
        }
    }

    var touchStartY = 0;
    function onTouchStart(e) {
        if (e.touches && e.touches.length) {
            touchStartY = e.touches[0].clientY;
        }
    }

    function onTouchMove(e) {
        if (!e.touches || !e.touches.length) return;
        var scrollableParent = getScrollableParent(e.target);
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        var currentY = e.touches[0].clientY;
        var deltaY = currentY - touchStartY;
        if (canScrollWithin(scrollableParent, -deltaY)) {
            return;
        }
        if ((scrollTop <= 0 && deltaY > 0) || (scrollTop >= maxScroll && deltaY < 0)) {
            e.preventDefault();
        }
    }

    document.addEventListener('wheel', preventOverscroll, { passive: false });
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
})
