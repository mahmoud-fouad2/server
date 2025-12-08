// Share Modal Script - Safe Execution
(function () {
  'use strict';
  try {
    function initShare() {
      try {
        var shareBtn = document.getElementById('share-btn');
        
        if (!shareBtn) {
          // element not present on this page, nothing to do
          return;
        }

        if (typeof shareBtn.addEventListener !== 'function') {
          return;
        }

        var shareModal = document.getElementById('share-modal');
        
        // Additional null check before addEventListener
        if (!shareModal) {
          return;
        }

        shareBtn.addEventListener('click', function () {
          try {
            if (shareModal && shareModal.style) {
              shareModal.style.display = 'flex';
            }
          } catch (e) {
            // Silent fail
          }
        });
      } catch (e) {
        // Silent fail
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initShare);
    } else {
      setTimeout(initShare, 100);
    }
  } catch (e) {
    // Silent fail
  }
})();
