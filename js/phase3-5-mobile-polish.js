// Phase 3.5: mobile viewport polish
// Keeps CSS --app-vh aligned with the real visual viewport on mobile Safari.

(function () {
  'use strict';

  function setViewportHeight() {
    var height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-vh', (height * 0.01) + 'px');
  }

  setViewportHeight();

  window.addEventListener('resize', setViewportHeight, { passive: true });
  window.addEventListener('orientationchange', function () {
    setTimeout(setViewportHeight, 250);
  }, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setViewportHeight, { passive: true });
  }
})();
