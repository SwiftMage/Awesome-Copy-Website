/**
 * Awesome Copy - Landing Page Scripts
 * Handles animations, interactions, and dynamic behavior
 */

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
    initNavigation();
    initScrollReveal();
    initFAQ();
    initSmoothScroll();
    initNavScrollEffect();
    initHeroDeviceReveal();
    initViewsShowcase();
});

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
 * Full-screen screenshot zooms out to reveal MacBook, then devices pop out
 */
function initHeroDeviceReveal() {
    const introOverlay = document.getElementById('intro-overlay');
    const introWhite = document.getElementById('intro-white');
    const introScreenshot = document.querySelector('.intro-screenshot');
    const heroDevices = document.querySelector('.hero-devices');
    const heroContent = document.querySelector('.hero-content');

    if (!introOverlay || !heroDevices) return;

    // Skip on mobile/tablet where devices are hidden
    if (window.innerWidth <= 1024) {
        introOverlay.classList.add('hidden');
        heroDevices.classList.add('revealed');
        if (heroContent) heroContent.classList.add('visible');
        return;
    }

    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        introOverlay.classList.add('hidden');
        heroDevices.classList.add('revealed');
        if (heroContent) heroContent.classList.add('visible');
        return;
    }

    let animationPhase = 0; // 0 = waiting for reveal, 1 = image revealed, 2 = zooming, 3 = revealing devices, 4 = done

    // Lock scrolling initially
    document.body.style.overflow = 'hidden';

    // Start the dramatic reveal sequence after a brief moment
    setTimeout(() => {
        // Fade out white, fade in screenshot
        if (introWhite) introWhite.classList.add('fade-out');
        if (introScreenshot) introScreenshot.classList.add('visible');
        animationPhase = 1;
    }, 500);

    function startAnimation() {
        if (animationPhase < 1) return; // Wait for initial reveal
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

    // Fallback: auto-start after 2.5 seconds (after white-to-image fade completes)
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
 * Views Showcase - Scroll-driven view switcher
 * Transitions from Card → Normal → Minimal as you scroll
 * Falls back to auto-cycling on smaller screens
 */
function initViewsShowcase() {
    const buttons = document.querySelectorAll('.view-btn');
    const images = document.querySelectorAll('.view-image');
    const indicator = document.querySelector('.view-btn-indicator');
    const section = document.querySelector('.feature-views');
    const showcase = document.querySelector('.views-showcase');

    if (!buttons.length || !images.length || !section) return;

    // Order for scroll: Card → Normal → Minimal
    const views = ['card', 'normal', 'minimal'];
    // Map view names to indicator positions (minimal=0, normal=1, card=2)
    const indicatorPositions = { 'minimal': 0, 'normal': 1, 'card': 2 };
    let currentView = 'card';
    let autoPlayInterval = null;
    let isPaused = false;

    function switchView(viewName) {
        if (viewName === currentView) return;
        currentView = viewName;

        // Update buttons
        buttons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.view-btn[data-view="${viewName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Update indicator position based on button order (minimal, normal, card)
        if (indicator) {
            const pos = indicatorPositions[viewName];
            indicator.style.transform = `translateX(calc(${pos * 100}% + ${pos * 4}px))`;
        }

        // Update images with crossfade
        images.forEach(img => img.classList.remove('active'));
        const activeImg = document.querySelector(`.view-image[data-view="${viewName}"]`);
        if (activeImg) activeImg.classList.add('active');
    }

    // Click handlers still work for manual selection
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
            // Reset auto-play if active
            if (autoPlayInterval) {
                startAutoPlay();
            }
        });
    });

    // Check if we're on a screen size where sticky scroll is disabled
    function isStickyDisabled() {
        return window.innerWidth <= 1024;
    }

    // Auto-play for smaller screens
    function nextView() {
        const currentIndex = views.indexOf(currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        switchView(views[nextIndex]);
    }

    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            if (!isPaused) nextView();
        }, 3000);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    // Scroll-driven transitions based on sticky scroll progress
    function handleScroll() {
        // Skip scroll handling on smaller screens
        if (isStickyDisabled()) return;

        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = section.offsetHeight;
        const windowHeight = window.innerHeight;

        // Calculate how far we've scrolled through the section
        // Progress goes from 0 (section just entered) to 1 (section about to leave)
        // The section has extra height (250vh), so we scroll through it while it's sticky
        const scrollableHeight = sectionHeight - windowHeight;
        const scrolled = -sectionTop; // How much of the section has scrolled past the top

        // Clamp progress between 0 and 1
        const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));

        // Divide into 3 zones: 0-0.33 = card, 0.33-0.66 = normal, 0.66-1 = minimal
        let targetView;
        if (progress < 0.33) {
            targetView = 'card';
        } else if (progress < 0.66) {
            targetView = 'normal';
        } else {
            targetView = 'minimal';
        }

        switchView(targetView);
    }

    // Use requestAnimationFrame for smooth scroll handling
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Pause auto-play on hover (for smaller screens)
    if (showcase) {
        showcase.addEventListener('mouseenter', () => isPaused = true);
        showcase.addEventListener('mouseleave', () => isPaused = false);
    }

    // Initialize based on screen size
    function init() {
        if (isStickyDisabled()) {
            // Use auto-play on smaller screens
            startAutoPlay();
        } else {
            // Use scroll-driven on larger screens
            stopAutoPlay();
            handleScroll();
        }
    }

    // Re-initialize on resize
    window.addEventListener('resize', () => {
        init();
    });

    // Initial setup
    init();
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
