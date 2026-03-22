import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from './Home';

export function JoinWaitlist() {
  const navigate = useNavigate();

  useEffect(() => {
    // Function to scroll to waitlist section
    const scrollToWaitlist = () => {
      const waitlistElement = document.getElementById('waitlist');
      if (waitlistElement) {
        // Calculate offset for fixed navigation
        const navHeight = 80; // Approximate navigation height
        const elementPosition = waitlistElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navHeight;

        window.scrollTo({
          top: Math.max(0, offsetPosition), // Ensure we don't scroll to negative position
          behavior: 'smooth'
        });

        // Redirect to home page URL (base URL) after a short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 300);

        return true;
      }
      return false;
    };

    // Try scrolling immediately
    if (!scrollToWaitlist()) {
      // If element not found, wait for it to render
      const timer = setTimeout(() => {
        if (scrollToWaitlist()) {
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 300);
        }
      }, 100);

      // Also try after a longer delay in case of slow rendering
      const fallbackTimer = setTimeout(() => {
        if (scrollToWaitlist()) {
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 300);
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
      };
    }
  }, [navigate]);

  return <Home />;
}

