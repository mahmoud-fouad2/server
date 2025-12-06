// Share Modal Script - Fixed
(function () {
  'use strict';
  try {
    function initShare() {
      try {
        var shareBtn = document.getElementById('share-btn');
        var shareModal = document.getElementById('share-modal');

        if (!shareBtn) {
          // element not present on this page, nothing to do
          return;
        }

        if (typeof shareBtn.addEventListener !== 'function') {
          console.warn('share-modal: shareBtn has no addEventListener');
          return;
        }

        shareBtn.addEventListener('click', function () {
          try {
            if (shareModal) shareModal.style.display = 'flex';
          } catch (e) {
            console.warn('share-modal: failed to open modal', e);
          }
        });
      } catch (e) {
        console.warn('share-modal: init failure', e);
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
