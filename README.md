# Money Compass

Money Compass is a web application that helps you manage your finances. It is built with Next.js, Tailwind CSS, and ShadCN.

Check out the live demo [here](https://money-compass-seven.vercel.app/)!

This project uses:

- **[Next.js](https://nextjs.org/)** (with **App Directory** and **Server Actions**) - React framework for creating high-quality web applications
- **[Supabase](https://supabase.io/)** - An open-source alternative to Firebase
- **[Tailwind CSS](https://tailwindcss.com/)** - A utility-first CSS framework for rapid UI development
- **[ShadCN](https://ui.shadcn.com/)** - A collection of beautiful, free, and open-source components for Tailwind CSS
- **[Tremor](https://www.tremor.so/)** - React components to build charts
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

2. Run the development server:

```bash
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Scripts Overview

The following scripts are available in `package.json`:
- `dev`: Starts the development server
- `build`: Builds the application for production
- `start`: Starts the production server
- `lint`: Lints the code
- `check-types`: Checks the code for type errors
- `validate`: Runs `lint` and `check-types`
- `test`: Runs the unit tests
- `test:watch`: Runs the unit tests in watch mode
- `test:cov`: Runs the unit tests and generates coverage report
- `test:watch-cov`: Runs the unit tests in watch mode and generates coverage report
- `cy:open`: Opens the Cypress Test Runner
- `cy:run`: Runs the Cypress tests
- `supa:gen-types`: Generates TypeScript types for the Supabase database schema

## Supabase

This project uses [Supabase](https://supabase.io/) for authentication and database. 

### Database migrations

To pull the latest schema from the remote Supabase database, run:

```bash
npx supabase db pull
npx supabase migration squash
npx supabase migration repair --status reverted '<old_migration_name>'
```

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

