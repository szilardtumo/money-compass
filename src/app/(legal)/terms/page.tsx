import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms | Money Compass',
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms</h1>
      <p>
        Money Compass is a personal, non-commercial project for keeping track of your own finances.
        It is provided as is, without any warranty, and may change or stop working at any time.
      </p>
      <ul>
        <li>
          The app shows the data you enter and import. It can contain mistakes, and it isn&apos;t
          financial advice.
        </li>
        <li>
          Connecting a bank gives the app read-only access to the accounts you choose, until the
          consent expires, you delete the integration, or you revoke the consent at your bank.
        </li>
        <li>
          The bank connection runs through Enable Banking, under their own{' '}
          <a href="https://auth.enablebanking.com/terms">terms</a>.
        </li>
      </ul>
      <p>
        See the <Link href="/privacy">privacy page</Link> for what data the app stores.
      </p>
    </>
  );
}
