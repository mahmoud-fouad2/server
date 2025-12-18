CLEANUP_SUMMARY - archive_removed_docs/2025-12-18

Date: 2025-12-18
Branch: cleanup/remove-docs-dead-code

Summary:
- Moved non-critical documentation and small README files into `archive_removed_docs/2025-12-18/` to reduce repository clutter and centralize legacy docs.
- This operation is reversible (files moved via `git mv` on the cleanup branch).

Files moved (top-level):
- RENDER_DEPLOYMENT_GUIDE.md
- PROJECT_STATUS.md
- QUICK_REFERENCE.md
- PAYMENT_SYSTEM_IMPLEMENTATION.md
- MIGRATION_INSTRUCTIONS.md
- IMPLEMENTATION_SUMMARY.md
- IMPLEMENTATION_STATUS.md
- FIXES_SUMMARY.md
- FIXES_APPLIED.md
- GIT_COMMIT_SUMMARY.md
- DEPLOYMENT_TO_PROD.md
- DEPLOYMENT_RECORD_AR.md
- DEPLOYMENT_READY_SUMMARY.md
- DEPLOYMENT_CHECKLIST.md
- CRITICAL_ISSUES_ANALYSIS.md
- CRITICAL_FIXES_COMPLETED.md
- COMPREHENSIVE_IMPROVEMENTS_SUMMARY.md
- CODE_REVIEW_REPORT.md
- CODE_CLEANUP_REPORT.md
- BOT_RESPONSE_IMPROVEMENTS.md
- BOT_IMPROVEMENTS.md
- ARCHITECTURE.md
- ARCHITECTURAL_REVIEW.md
- REMEDIATION_PLAN.md
- ADMIN_PANEL_ENHANCEMENTS.md
- PHASE2_CONSOLIDATION_PLAN.md
- PHASE2_IMPROVEMENTS_COMPLETED.md

Files moved (.github templates):
- .github/ISSUE_TEMPLATE/bug_report.md
- .github/PULL_REQUEST_TEMPLATE.md

Client docs moved:
- client/README_E2E.md
- client/public/assets/fonts/README.md

Server docs moved:
- server/SECURITY_UPDATES.md
- server/pgbouncer/README.md
- server/scripts/migrate-uploads-README.md
- server/scripts/README.md
- server/TESTING_MONITORING.md
- server/README.DEV.md
- server/MIGRATION_INSTRUCTIONS.md
- server/DOCS_UPLOADS.md
- server/docs/S3_SETUP.md
- server/docs/EMBEDDINGS.md
- server/tests/integration/README.md

Kept (not moved):
- DEPLOYMENT_SUMMARY.md (critical)
- PRODUCTION_FIX_GUIDE.md (critical)
- COMPREHENSIVE_AUDIT_REPORT.md (critical)

Restore instructions:
- To restore a file: `git mv archive_removed_docs/2025-12-18/<subdir>/<file> ./`
- To undo the entire cleanup: `git checkout main -- archive_removed_docs/2025-12-18/` then move files back or merge the branch and revert commit.

Notes:
- I recommend reviewing `archive_removed_docs/2025-12-18/` before merging the cleanup branch. If you want an aggressive cleanup (delete permanently), we can delete the archive folder and commit the deletion on your confirmation.
- Next steps: run lint/tests and address any incidental issues.

If you'd like a different policy (e.g., keep fewer or more docs), tell me and I will adjust.
