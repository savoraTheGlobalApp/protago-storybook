// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navbar = document.querySelector('.navbar');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Parallax effect for floating elements
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.floating-card');
        
        parallaxElements.forEach(element => {
            const speed = element.getAttribute('data-speed') || 1;
            const yPos = -(scrolled * speed * 0.5);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.vision-card, .timeline-content, .age-card, .stat-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    document.addEventListener("DOMContentLoaded", () => {
        const contactForm = document.getElementById("contactForm");
      
        contactForm.addEventListener("submit", async (e) => {
          e.preventDefault();
      
          const recaptchaToken = grecaptcha.getResponse();
          if (!recaptchaToken) {
            alert("Please complete the reCAPTCHA.");
            return;
          }
      
          const formData = new FormData(contactForm);
          const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            role: formData.get("role"),
            message: formData.get("message"),
            recaptchaToken
          };
      
          try {
            const res = await fetch("/.netlify/functions/submit-contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
      
            const data = await res.json();
      
            if (data.success) {
              window.location.href = "/thank-you.html";
            } else {
              alert("Error: " + (data.error || "Something went wrong"));
            }
          } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
          }
        });
      });


    document.addEventListener("DOMContentLoaded", () => {
    const waitlistForm = document.getElementById("waitlistForm");
    if (waitlistForm) {
        waitlistForm.addEventListener("submit", async (e) => {
        e.preventDefault();
    
        const formData = new FormData(waitlistForm);
        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            mobile: formData.get("mobile")
        };
    
        try {
            const res = await fetch("/.netlify/functions/waitlist-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = "/thank-you.html";
            } else {
                alert("Error: " + (data.error || "Something went wrong"));
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        }
        });
    }
    });
      

    // Button click handlers
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.textContent.includes('Get Started') || this.textContent.includes('Request Demo')) {
                e.preventDefault();
                document.querySelector('#contact').scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Segmented slide-in animation for hero title (inspired by modern hero patterns like Pixa, adapted uniquely)
    const titlePart1 = document.querySelector('.title-part-1');
    const titlePart2 = document.querySelector('.title-part-2');
    if (titlePart1 && titlePart2) {
        // add vertical slide animation classes with a graceful stagger
        setTimeout(() => {
            titlePart1.classList.add('animate-in-left');
            setTimeout(() => {
                titlePart2.classList.add('animate-in-right');
            }, 420); // slower, more elegant stagger
        }, 300);
    }

    // Counter animation for stats
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        
        function updateCounter() {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        }
        updateCounter();
    }

    // Observe stats for counter animation
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                const text = statNumber.textContent;
                
                if (text !== '∞') {
                    const number = parseInt(text);
                    animateCounter(statNumber, number);
                }
                
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-card').forEach(card => {
        statsObserver.observe(card);
    });

    // Gradient animation for background orbs
    function animateGradients() {
        const orbs = document.querySelectorAll('.gradient-orb');
        orbs.forEach((orb, index) => {
            orb.style.animationDelay = `${index * 2}s`;
        });
    }

    animateGradients();

    // Add hover effects for interactive elements
    document.querySelectorAll('.vision-card, .age-card, .timeline-content').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Progressive background image loading
    function loadHighResBackground() {
        const hero = document.querySelector('.hero');
        if (hero) {
            // Determine which background to load based on screen size
            const isMobile = window.innerWidth <= 768;
            const imagePath = isMobile 
                ? 'images/icuriousAI_phone_background_image.png'
                : 'images/icuriousAI_background_image.png';
            
            // Preload the high-resolution PNG image
            const img = new Image();
            img.onload = function() {
                // Seamlessly switch to high-res image once loaded
                hero.style.backgroundImage = `url(${imagePath})`;
            };
            img.src = imagePath;
        }
    }

    // Load high-res background after initial page load
    window.addEventListener('load', function() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
            // Start loading high-res background after page is visible
            setTimeout(loadHighResBackground, 500);
        }, 100);
    });
});

// Add some modern CSS effects
const style = document.createElement('style');
style.textContent = `
    .btn-primary {
        position: relative;
        overflow: hidden;
    }
    
    .btn-primary::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
    }
    
    .btn-primary:hover::before {
        left: 100%;
    }
    
    .floating-card {
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
    }
    
    .vision-card, .age-card, .timeline-content {
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
    
    .gradient-text {
        background-size: 200% 200%;
        animation: shimmer 3s ease-in-out infinite;
    }

    .form-error {
      color: #ef4444;
      font-size: 0.9rem;
      margin-top: 8px;
      display: none; /* Hidden by default */
    }
`;

document.head.appendChild(style); 