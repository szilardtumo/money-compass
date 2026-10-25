import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy | Money Compass',
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy</h1>
      <p>
        Money Compass is a personal, non-commercial project. This page describes what data the app
        stores and where. It is a description of how the app works today, not a legal agreement.
      </p>

      <h2>What the app stores</h2>
      <ul>
        <li>Your user account: email address, and your name if you sign in with GitHub.</li>
        <li>The accounts, subaccounts and transactions you enter.</li>
        <li>
          If you connect a bank: the bank&apos;s name, the name, IBAN and currency of the accounts
          you share, and their balances and booked transactions (amount, date, description and
          counterparty name).
        </li>
      </ul>

      <h2>How the app reads bank data</h2>
      <p>
        Bank data comes through <a href="https://enablebanking.com">Enable Banking</a>, a registered
        account information service provider. You give consent on your bank&apos;s website, for a
        limited time. The access is read-only: the app can&apos;t make payments. Deleting an
        integration in the app closes its bank session, and you can also revoke the consent at your
        bank.
      </p>

      <h2>Where the data is</h2>
      <p>
        The app runs on <a href="https://vercel.com">Vercel</a>, and stores its data and user
        accounts in <a href="https://supabase.com">Supabase</a>. The data isn&apos;t sold, and the
        app doesn&apos;t send it to anyone besides these services and Enable Banking.
      </p>

      <h2>Questions</h2>
      <p>
        The source code is on <a href="https://github.com/szilardtumo/money-compass">GitHub</a>,
        where you can also open an issue.
      </p>
    </>
  );
}
