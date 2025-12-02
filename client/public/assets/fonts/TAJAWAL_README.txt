How to add Tajawal local fonts

1) Download Tajawal woff2 files (e.g., from Google Fonts -> Tajawal) and place them here with these names:
   - Tajawal-Regular.woff2
   - Tajawal-Medium.woff2
   - Tajawal-Bold.woff2

2) After placing the files, hard-refresh your browser (Ctrl+Shift+R) to load the new fonts.

Notes:
- The project expects fonts under `/chat1/assets/fonts/` so the references in CSS are /chat1/assets/fonts/Tajawal-*.woff2
- If you want to use different filenames, update `client/src/app/globals.css` src URLs accordingly.
