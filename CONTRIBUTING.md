# Contributing to RADA Frontend

Thanks for your interest in RADA! Bug reports, ideas and pull requests are all welcome.

Everyone taking part in the project follows the [OpenFROG Code of Conduct](https://github.com/OpenFoundationRenewableOperationGrids/.github/blob/main/CODE_OF_CONDUCT.md).

## Before you start

- **Bugs and ideas:** open an [issue](../../issues/new/choose) first, so we can agree on the approach before you write code.
- **Security issues:** don't open a public issue. Follow [SECURITY.md](SECURITY.md).
- **Backend changes:** the API lives in [rada-backend](https://github.com/OpenFoundationRenewableOperationGrids/rada-backend).

## Set up

You need Node.js 24 (see `.nvmrc`).

```bash
git clone https://github.com/OpenFoundationRenewableOperationGrids/rada-frontend.git
cd rada-frontend
npm install
cp .env.local.example .env.local   # then fill in the backend URL and key
npm run dev
```

You don't need a backend to run the tests. See [Tests](#tests).

## Branches

- `main` is production, deployed on Vercel.
- `develop` is the integration branch. **Open every pull request against `develop`.**
- Name your branch after the change: `feat/…`, `fix/…`, `docs/…`, `test/…`, `chore/…`.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
fix(dates): convert Paris times without depending on the host timezone
feat(bubbles): add an opt-in accessibility mode
```

Keep each commit focused on one change.

## Checks

CI runs these on every pull request, and all of them must pass:

```bash
npm run lint        # ESLint + Prettier, no warnings allowed
npm run typecheck   # strict TypeScript
npm test            # Vitest unit and component tests
npm run build
npm run test:e2e    # Playwright end-to-end tests
```

Run `npx playwright install chromium webkit` once before your first E2E run.

## Tests

- **Unit and component tests** (Vitest + Testing Library) sit next to the code, in `*.test.ts(x)` files. Shared API fixtures live in `src/__fixtures__`.
- **End-to-end tests** (Playwright) are in `e2e/`. They build the app and run it against a mock backend (`e2e/mock-backend.mts`) that serves the same fixtures. They run on an iPhone (WebKit), an Android phone and a desktop browser.

New features and bug fixes should come with tests. A bug fix should include a test that fails without the fix.

## Code guidelines

- **TypeScript strict:** no `any`, no `@ts-ignore`. API types live in `src/types`.
- **Mobile first:** the app is used mostly on phones, especially iPhones. Check your change on a small screen.
- **Paris time:** the API speaks UTC. Convert to `Europe/Paris` only for display, with the helpers in `src/lib/dateUtils.ts`. Never depend on the device's timezone.
- **Accessibility:** keyboard and screen-reader support goes behind the opt-in accessibility mode, so it never changes the touch experience or the design for other users.
- **Secrets:** the backend key stays server-side. Browser code calls the `/api/*` proxy routes, never the backend directly. Never commit `.env*` files.

## Pull requests

- Describe what changes and why, and how you tested it.
- Add screenshots for visual changes (a phone screenshot is best).
- Keep pull requests small. Several small ones are easier to review than a large one.

## License

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](LICENSE).
