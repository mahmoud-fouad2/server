# Contributing

Thank you for contributing! Please follow these steps to keep the project stable:

1. Create a feature branch from `main`.
2. Run tests and linter locally:
   - Server: `cd server && npm ci && npm test`
   - Client: `cd client && npm ci && npm run build`
3. Add tests for any new behavior.
4. Ensure ESLint passes and run `npm run lint:fix` where appropriate.
5. Open a PR and assign reviewers; changes to core areas will require review by `CODEOWNERS`.

Failing to follow this process may result in a rejected PR.
