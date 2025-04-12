# Money Compass

Money Compass is a web application that helps you manage your finances. It is built with Next.js, Tailwind CSS, and ShadCN.

Check out the live demo [here](https://money-compass-seven.vercel.app/)!

## Getting Started

1. Install the dependencies:

   ```bash
   yarn install
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
   yarn dev
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
├──hooks                // Reusable hooks
├──lib
│  ├──middleware        // Middleware functions
│  ├──supabase
│  ├──types             // Global types
│  └──utils             // Utility functions
├──server
│  ├──api
│  │  ├──actions        // Server actions
│  │  └──queries        // Queries
│  └──db
│     └──schema         // Drizzle ORM schema
└──middleware.ts
```

## Database migrations

Migrations are handled with a codebase first approach ([option 5 from Drizzle Docs](https://orm.drizzle.team/docs/migrations)):

1. The source of truth is the Drizzle schema defined in the codebase
2. Migration files are generated based on schema changes with Drizzle Kit: `yarn db:generate`
3. Migrations are applied to the local database with Supabase CLI: `yarn db:migrate`
4. Migrations are applied to production database in a GitHub Workflow
