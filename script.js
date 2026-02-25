document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('#mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('is-active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuToggle.classList.contains('is-active')) {
                menuToggle.classList.remove('is-active');
                navMenu.classList.remove('active');
            }
        });
    });

    // Intersection Observer for scroll animations (fade in)
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = {
        threshold: 0,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // Mobile "See More" Expand Logic
    const expandSkillsBtn = document.getElementById('expand-skills-btn');
    const skillsGrid = document.querySelector('.skills');
    if (expandSkillsBtn && skillsGrid) {
        expandSkillsBtn.addEventListener('click', () => {
            skillsGrid.classList.remove('collapsed');
            expandSkillsBtn.style.display = 'none'; // Ensure the button hides after clicking
        });
    }

    const expandProjectsBtn = document.getElementById('expand-projects-btn');
    const projectsGrid = document.querySelector('.projects-grid');
    if (expandProjectsBtn && projectsGrid) {
        expandProjectsBtn.addEventListener('click', () => {
            projectsGrid.classList.remove('collapsed');
            expandProjectsBtn.style.display = 'none'; // Ensure the button hides after clicking
        });
    }
});
