# Money Compass

Money Compass is a web application that helps you manage your finances. It is built with Next.js, Tailwind CSS, and ShadCN.

Check out the live demo [here](https://money-compass-seven.vercel.app/)!

This project uses:

- **[Next.js](https://nextjs.org/)** (with **App Directory** and **Server Actions**) - React framework for creating high-quality web applications
- **[Supabase](https://supabase.io/)** - An open-source alternative to Firebase
- **[Tailwind CSS](https://tailwindcss.com/)** - A utility-first CSS framework for rapid UI development
- **[ShadCN](https://ui.shadcn.com/)** - A collection of beautiful, free, and open-source components for Tailwind CSS
- **[Tremor Raw](https://www.tremor.so/)** - React components to build charts
- **[React Hook Form](https://react-hook-form.com/)** - Performant, flexible, and extensible forms with easy-to-use validation
- **[ESlint](https://eslint.org/)** and **[Prettier](https://prettier.io/)** - For clean, consistent, and error-free code
- **[TypeScript](https://www.typescriptlang.org/)** with **[ts-reset](https://github.com/total-typescript/ts-reset)** - For type safety
- **[GitHub Actions](https://github.com/features/actions)** - Pre-configured actions for smooth workflows
- **[Vercel](https://vercel.com/)** - For deployment and hosting
- **[Husky](https://typicode.github.io/husky/)** - For pre-commit hooks
- **[Jest](https://jestjs.io/)** and **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)**- For unit-testing components and utilities
- **[Cypress](https://www.cypress.io/)** - For end-to-end testing

**Note**: This project is inspired by [Next.js Enterprise Boilerplate](https://github.com/Blazity/next-enterprise/tree/main) and [bulletproof-react](https://github.com/alan2207/bulletproof-react.)

## Getting Started

1. Install the dependencies:

   ```bash
   yarn install --frozen-lockfile
   ```

2. Configure GitHub OAuth:

   Register a new OAuth App [on GitHub](https://github.com/settings/developers) with the following callback URL: `http://localhost:54321/auth/v1/callback`

   Create a `.env.local` file in the root of your project and define your GitHub Client ID and Secret.

   _More info about GitHub OAuth Apps can be found in the [official docs](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)._

3. Set up and run Supabase:

   ```bash
   yarn db:reset
   yarn supa:start
   ```

   The Supabase Studio will be available at http://localhost:54323.

   _More info about running Supabase locally can be found in the [official docs](https://supabase.com/docs/guides/local-development/cli/getting-started#running-supabase-locally)._

4. Define your local Supabase credentials in `.env.local`

5. Run the Next.js development server:

   ```bash
   yarn dev --turbo
   ```

   The application will be available at http://localhost:3000.

## Scripts Overview

The following scripts are available in `package.json`:

- `dev`: Starts the development server
- `build`: Builds the application for production
- `start`: Starts the production server
- `lint`: Lints the code with ESLint
- `check-styles`: Checks the code styles with Prettier
- `check-types`: Checks the code for type errors
- `validate`: Runs ESLint, Prettier and TS type check
- `test`: Runs the unit tests
- `test:watch`: Runs the unit tests in watch mode
- `test:cov`: Runs the unit tests and generates coverage report
- `test:watch-cov`: Runs the unit tests in watch mode and generates coverage report
- `cy:open`: Opens the Cypress Test Runner
- `cy:run`: Runs the Cypress tests
- `supa:start`: Starts the local Supabase service
- `db:generate`: Generates database migrations based on schema changes
- `db:migrate`: Applies database migrations to the local database
- `db:migrate:remote`: Applies database migrations to the remote database
- `db:backup`: Creates a local backup of the local database
- `db:backup:remote`: Creates a local backup of the remote database
- `db:reset`: Resets the local database

## Project structure

```js
├──app
│  ├──api
│  │  ├──<api_route>    // API routes
│  │  │  └──route.ts
│  ├──<page>            // Pages
│  │  ├──_components    // Page-specific components
│  │  ├──layout.tsx
│  │  └──page.tsx
├──components           // Reusable components
│  ├──cards
│  ├──charts
│  ├──dialogs
│  ├──providers
│  └──ui
├──lib
│  ├──db                // Database queries and mutations
│  ├──types             // Global types
│  └──utils             // Utility functions
└──middleware.ts
```

## Database migrations

Migrations are handled with a codebase first approach ([option 5 from Drizzle Docs](https://orm.drizzle.team/docs/migrations)):

1. The source of truth is the Drizzle schema defined in the codebase
2. Migration files are generated based on schema changes with Drizzle Kit: `yarn db:generate`
3. Migrations are applied to the local database with Supabase CLI: `yarn db:migrate`
4. Migrations are applied to production database in a GitHub Workflow

## Testing

This project uses Jest and React Testing Library for unit-testing components and utilities. Cypress is used for end-to-end testing.

### Unit Testing

To run the unit tests, use the following command:

```bash
yarn test
```

For other commands related to unit testing, check the [Scripts Overview](#scripts-overview) section.

### End-to-End Testing

To run the Cypress tests, use the following command:

```bash
yarn cy:run
```

For other commands related to end-to-end testing, check the [Scripts Overview](#scripts-overview) section.

## Deployment

This project is deployed and hosted on [Vercel](https://vercel.com/). The production build is automatically deployed to Vercel when changes are pushed to the `main` branch.

Preview deployments are created for pull requests. These deployments are automatically updated as new commits are added to the pull request.
