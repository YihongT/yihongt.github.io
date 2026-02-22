// aHR0cHM6Ly9naXRodWIuY29tL2x1b3N0MjYvYWNhZGVtaWMtaG9tZXBhZ2U=
$(function () {
    lazyLoadOptions = {
        scrollDirection: 'vertical',
        effect: 'fadeIn',
        effectTime: 300,
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
        { id: 'harbor', label: 'Harbor', icon: 'fas fa-compass' }
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

    function preventOverscroll(e) {
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
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        var currentY = e.touches[0].clientY;
        var deltaY = currentY - touchStartY;
        if ((scrollTop <= 0 && deltaY > 0) || (scrollTop >= maxScroll && deltaY < 0)) {
            e.preventDefault();
        }
    }

    document.addEventListener('wheel', preventOverscroll, { passive: false });
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
})
