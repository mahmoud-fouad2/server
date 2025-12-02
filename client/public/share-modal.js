// Share Modal Script - Fixed
(function() {
  'use strict';
  try {
    function initShare() {
      var shareBtn = document.getElementById('share-btn');
      var shareModal = document.getElementById('share-modal');
      
      if (shareBtn && shareModal) {
        shareBtn.addEventListener('click', function() {
          if (shareModal) shareModal.style.display = 'flex';
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initShare);
    } else {
      initShare();
    }
  } catch (e) {
    console.log('Share modal safe exit');
  }
})();
