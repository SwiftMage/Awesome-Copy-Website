/**
 * Awesome Copy - Landing Page Scripts
 * Handles animations, interactions, and dynamic behavior
 */

// BEGIN AWESOME_COPY_DIRECT_RELEASE
const AWESOME_COPY_DIRECT_RELEASE_FALLBACK = {
    url: "https://github.com/kindparkllc/Awesome-Copy/releases/download/v8.0/AwesomeCopy-8.0-411.dmg",
    version: "8.0",
    build: "411",
    sizeBytes: 27408377,
    minimumSystemVersion: "13.0"
};
// END AWESOME_COPY_DIRECT_RELEASE


// TODO: Re-enable scroll-to-top for production
// Disable browser scroll restoration and scroll to top immediately
// if ('scrollRestoration' in history) {
//     history.scrollRestoration = 'manual';
// }
// window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    // TODO: Re-enable scroll-to-top for production
    // Ensure we're at the top for intro animation
    // window.scrollTo(0, 0);

    // Initialize all components
    initDirectReleaseMetadata();
    initNavigation();
    initScrollReveal();
    initFAQ();
    initSmoothScroll();
    initNavScrollEffect();
    initHeroDeviceReveal();
});

function initDirectReleaseMetadata() {
    const downloadLinks = [...document.querySelectorAll('[data-direct-download-url]')];
    if (!downloadLinks.length) return;

    applyDirectReleaseMetadata(AWESOME_COPY_DIRECT_RELEASE_FALLBACK);

    const releasePromise = fetchLatestBetaRelease().catch(() => AWESOME_COPY_DIRECT_RELEASE_FALLBACK);

    releasePromise.then(release => {
        applyDirectReleaseMetadata(release);
        downloadLinks.forEach(link => {
            link.dataset.directReleaseReady = 'true';
        });
    });

    downloadLinks.forEach(link => {
        link.addEventListener('click', async event => {
            if (link.dataset.directReleaseReady === 'true') return;

            event.preventDefault();
            const release = await releasePromise;
            applyDirectReleaseMetadata(release);
            link.dataset.directReleaseReady = 'true';
            link.click();
        });
    });
}

async function fetchLatestBetaRelease() {
    const response = await fetch(new URL('/appcast.xml', window.location.origin), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Could not load beta release feed (${response.status})`);

    const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('Could not parse beta release feed');

    const sparkleNamespace = 'http://www.andymatuschak.org/xml-namespaces/sparkle';
    const getSparkleValue = (item, name) =>
        item.getElementsByTagNameNS(sparkleNamespace, name)[0]?.textContent.trim() || '';
    const betaItem = [...xml.getElementsByTagName('item')].find(item =>
        getSparkleValue(item, 'channel') === 'beta'
    );
    if (!betaItem) throw new Error('No beta release found in release feed');

    const enclosure = betaItem.getElementsByTagName('enclosure')[0];
    const downloadUrl = enclosure?.getAttribute('url');
    const sizeBytes = Number(enclosure?.getAttribute('length'));
    const url = new URL(downloadUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' ||
        !url.pathname.startsWith('/kindparkllc/Awesome-Copy/releases/download/')) {
        throw new Error('Beta release feed contains an unexpected download URL');
    }

    const release = {
        url: url.href,
        version: getSparkleValue(betaItem, 'shortVersionString'),
        build: getSparkleValue(betaItem, 'version'),
        sizeBytes,
        minimumSystemVersion: getSparkleValue(betaItem, 'minimumSystemVersion') ||
            AWESOME_COPY_DIRECT_RELEASE_FALLBACK.minimumSystemVersion
    };
    if (!release.version || !release.build || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
        throw new Error('Beta release feed is missing version metadata');
    }

    return release;
}

function applyDirectReleaseMetadata(release) {
    document.querySelectorAll('[data-direct-download-url]').forEach(link => {
        link.href = release.url;
    });

    document.querySelectorAll('[data-direct-version]').forEach(element => {
        element.textContent = `Version ${release.version}`;
    });

    document.querySelectorAll('[data-direct-build]').forEach(element => {
        element.textContent = `Build ${release.build}`;
    });

    document.querySelectorAll('[data-direct-size]').forEach(element => {
        element.textContent = `${(release.sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    });

    const minimumSystemVersion = release.minimumSystemVersion.replace(/\.0$/, '');
    document.querySelectorAll('[data-direct-minimum-system]').forEach(element => {
        element.textContent = `macOS ${minimumSystemVersion}+`;
    });

    document.querySelectorAll('[data-direct-minimum-system-requirement]').forEach(element => {
        element.textContent = `macOS ${minimumSystemVersion} or later`;
    });
}

/**
 * Navigation Toggle (Mobile)
 */
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
}

/**
 * Navigation Scroll Effect
 */
function initNavScrollEffect() {
    const nav = document.getElementById('nav');
    let lastScroll = 0;

    if (nav) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Add/remove scrolled class for background change
            if (currentScroll > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }
}

/**
 * Hero Intro Animation
 * Full-screen app screenshot fades and zooms away to reveal the MacBook hero
 */
function initHeroDeviceReveal() {
    const introOverlay = document.getElementById('intro-overlay');
    const introFlash = document.getElementById('intro-flash');
    const introScreenshot = document.querySelector('.intro-screenshot');
    const heroDevices = document.querySelector('.hero-devices');
    const heroContent = document.querySelector('.hero-content');
    const heroMac = heroDevices?.querySelector('.hero-mac');
    const closePreviewButton = document.getElementById('intro-close');

    if (!introOverlay || !heroDevices) return;

    let previewOpen = false;
    let introReady = false;
    let previewCloseTimer;
    let bodyOverflowBeforePreview = '';

    function openFullScreenPreview() {
        if (!heroMac || !closePreviewButton || !introReady || previewOpen) return;

        clearTimeout(previewCloseTimer);
        previewOpen = true;
        bodyOverflowBeforePreview = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closePreviewButton.hidden = false;
        closePreviewButton.disabled = false;
        introOverlay.classList.add('preview-modal', 'zoom-out');
        introOverlay.classList.remove('hidden', 'preview-open');
        introOverlay.setAttribute('aria-hidden', 'false');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!previewOpen) return;
                introOverlay.classList.remove('zoom-out');
                introOverlay.classList.add('preview-open');
                closePreviewButton.focus({ preventScroll: true });
            });
        });
    }

    function closeFullScreenPreview() {
        if (!previewOpen || !closePreviewButton) return;

        previewOpen = false;
        closePreviewButton.disabled = true;
        introOverlay.classList.remove('preview-open');
        introOverlay.classList.add('zoom-out');
        introOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = bodyOverflowBeforePreview;
        heroMac?.focus({ preventScroll: true });

        clearTimeout(previewCloseTimer);
        previewCloseTimer = setTimeout(() => {
            if (previewOpen) return;
            introOverlay.classList.add('hidden');
            introOverlay.classList.remove('preview-modal');
            closePreviewButton.hidden = true;
            closePreviewButton.disabled = false;
        }, 1200);
    }

    function handlePreviewKeydown(event) {
        if (!previewOpen) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeFullScreenPreview();
        } else if (event.key === 'Tab') {
            event.preventDefault();
            closePreviewButton?.focus();
        }
    }

    heroMac?.addEventListener('click', openFullScreenPreview);
    closePreviewButton?.addEventListener('click', closeFullScreenPreview);
    window.addEventListener('keydown', handlePreviewKeydown);

    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (introFlash) introFlash.classList.add('fade-out');
        if (introScreenshot) introScreenshot.classList.add('visible');
        heroDevices.classList.add('revealed');
        if (heroContent) heroContent.classList.add('visible');
        setTimeout(() => {
            introOverlay.classList.add('hidden');
            introReady = true;
            if (heroMac) heroMac.disabled = false;
        }, 2500);
        return;
    }

    let animationPhase = 0; // 0 = screenshot fading in, 1 = ready to continue, 2 = zooming, 3 = revealing hero, 4 = done

    // Lock scrolling initially
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        if (introFlash) introFlash.classList.add('fade-out');
        if (introScreenshot) introScreenshot.classList.add('visible');
        animationPhase = 1;
    }, 500);

    function startAnimation() {
        if (animationPhase < 1) return; // Wait for the screenshot fade-in
        if (animationPhase >= 2) return; // Already started
        animationPhase = 2;

        // Phase 1: Zoom out the intro overlay
        introOverlay.classList.add('zoom-out');

        // Phase 2: After zoom starts, reveal devices
        setTimeout(() => {
            animationPhase = 3;
            heroDevices.classList.add('revealed');
        }, 1200);

        // Phase 3: Show title
        setTimeout(() => {
            if (heroContent) heroContent.classList.add('visible');
        }, 1800);

        // Phase 4: Hide overlay completely and unlock scrolling
        setTimeout(() => {
            introOverlay.classList.add('hidden');
            document.body.style.overflow = '';
            animationPhase = 4;
            introReady = true;
            if (heroMac) heroMac.disabled = false;
            cleanup();
        }, 3000);
    }

    // Listen for scroll attempt (wheel event)
    function handleWheel(e) {
        if (animationPhase <= 1 && e.deltaY > 0) {
            e.preventDefault();
            startAnimation();
        } else if (animationPhase > 0 && animationPhase < 3) {
            e.preventDefault();
        }
    }

    // Listen for touch swipe up
    let touchStartY = 0;
    function handleTouchStart(e) {
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchMove(e) {
        if (animationPhase <= 1) {
            const touchEndY = e.touches[0].clientY;
            const deltaY = touchStartY - touchEndY;

            if (deltaY > 30) {
                e.preventDefault();
                startAnimation();
            }
        } else if (animationPhase < 3) {
            e.preventDefault();
        }
    }

    // Listen for any key press or click
    function handleKeydown(e) {
        if (animationPhase <= 1 && (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter')) {
            e.preventDefault();
            startAnimation();
        }
    }

    function handleClick() {
        if (animationPhase <= 1) {
            startAnimation();
        }
    }

    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeydown);
    introOverlay.addEventListener('click', handleClick);

    // Clean up listeners
    function cleanup() {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('keydown', handleKeydown);
        introOverlay.removeEventListener('click', handleClick);
    }

    // Fallback: continue into the hero after the screenshot has been on screen briefly.
    setTimeout(() => {
        if (animationPhase <= 1) {
            startAnimation();
        }
    }, 2500);
}

/**
 * Scroll Reveal Animation
 * Uses Intersection Observer for performant scroll animations
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add staggered delay for elements in the same container
                    const delay = index * 50;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);

                    // Stop observing once revealed
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        revealElements.forEach(element => {
            element.classList.add('visible');
        });
    }
}

/**
 * FAQ Accordion
 */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        if (question) {
            question.addEventListener('click', () => {
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle current item
                item.classList.toggle('active');
            });
        }
    });
}

/**
 * Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Skip if it's just "#"
            if (href === '#') return;

            const target = document.querySelector(href);

            if (target) {
                e.preventDefault();

                const navHeight = document.getElementById('nav')?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Parallax Effect for Hero (Optional - reduced motion aware)
 */
function initParallax() {
    const hero = document.querySelector('.hero-devices');

    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.3;

        if (scrolled < window.innerHeight) {
            hero.style.transform = `translateY(${rate}px)`;
        }
    }, { passive: true });
}

/**
 * Lazy Loading Images (Native with fallback)
 */
function initLazyLoading() {
    // Modern browsers handle this natively with loading="lazy"
    // This is a fallback for older browsers

    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading is supported
        return;
    }

    // Fallback for browsers without native lazy loading
    const images = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => {
            imageObserver.observe(img);
        });
    }
}

/**
 * Add subtle hover effect to device images
 */
function initDeviceHover() {
    const devices = document.querySelectorAll('.hero-device');

    devices.forEach(device => {
        device.addEventListener('mouseenter', () => {
            device.style.transform = device.style.transform + ' scale(1.02)';
        });

        device.addEventListener('mouseleave', () => {
            // Reset to original transform
            if (device.classList.contains('hero-iphone')) {
                device.style.transform = 'translateX(30px) rotate(-3deg)';
            } else if (device.classList.contains('hero-ipad')) {
                device.style.transform = 'translateX(-30px) rotate(3deg)';
            } else {
                device.style.transform = '';
            }
        });
    });
}

/**
 * Testimonial Auto-rotate (Optional feature)
 */
function initTestimonialCarousel() {
    const testimonials = document.querySelectorAll('.testimonial-card');

    if (testimonials.length <= 3) return; // Only if there are many

    // This could be expanded into a full carousel
    // For now, we display all testimonials in a grid
}

/**
 * Analytics helper (placeholder)
 */
function trackEvent(category, action, label) {
    // Placeholder for analytics integration
    // Example: gtag('event', action, { 'event_category': category, 'event_label': label });
    console.log(`Event: ${category} - ${action} - ${label}`);
}

// Add click tracking to CTAs
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const text = this.textContent.trim();
        trackEvent('CTA', 'click', text);
    });
});

// Expose functions globally if needed
window.AwesomeCopy = {
    trackEvent,
    initScrollReveal
};
