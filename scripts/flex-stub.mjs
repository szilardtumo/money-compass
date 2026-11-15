/* eslint-disable no-console */
// A local stand-in for the IBKR Flex Web Service, serving the test fixture.
// Run `node scripts/flex-stub.mjs` and start the app with IBKR_FLEX_BASE_URL=http://localhost:3199.
//
// The mode sets the answers: "ok", "1019" (each statement is in progress once, then ready), "1012"
// (expired token) or "1003" (statement not available). Set it with FLEX_STUB_MODE, or while it runs
// with `curl localhost:3199/mode?set=1012`. Query IDs other than FLEX_STUB_QUERY_ID get 1014.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const PORT = 3199;
const QUERY_ID = process.env.FLEX_STUB_QUERY_ID ?? '1234567';
const fixture = readFileSync(
  new URL('../src/lib/investments/__fixtures__/flex-statement.xml', import.meta.url),
  'utf8',
);
const MESSAGES = {
  1003: 'Statement is not available.',
  1012: 'Token has expired.',
  1014: 'Query is invalid.',
  1019: 'Statement generation in progress. Please try again shortly.',
};

let mode = process.env.FLEX_STUB_MODE ?? 'ok';
const requests = new Map();

const response = (body) =>
  `<FlexStatementResponse timestamp="${new Date().toISOString()}">${body}</FlexStatementResponse>`;
const error = (code) =>
  response(
    `<Status>Fail</Status><ErrorCode>${code}</ErrorCode><ErrorMessage>${MESSAGES[code]}</ErrorMessage>`,
  );

/** The fixture with only the activity between fd and td, both yyyyMMdd */
function statement({ fd, td }) {
  return fixture
    .split('\n')
    .filter((line) => {
      if (!/<(Trade|CashTransaction|CorporateAction) /.test(line) || !fd) return true;
      const date = line.match(/(?:tradeDate|reportDate)="(\d{8})"/)[1];
      return date >= fd && date <= td;
    })
    .join('\n')
    .replace(/fromDate="\d+" toDate="\d+"/, `fromDate="${fd ?? ''}" toDate="${td ?? ''}"`);
}

function answer(url) {
  const params = Object.fromEntries(url.searchParams);

  if (url.pathname === '/mode') {
    mode = params.set ?? mode;
    return mode;
  }
  if (url.pathname.endsWith('/SendRequest')) {
    if (params.q !== QUERY_ID) return error(1014);
    if (mode === '1012') return error(1012);
    const reference = String(Math.floor(Math.random() * 1e10));
    requests.set(reference, { fd: params.fd, td: params.td, polls: 0 });
    return response(`<Status>Success</Status><ReferenceCode>${reference}</ReferenceCode>`);
  }
  if (url.pathname.endsWith('/GetStatement')) {
    const request = requests.get(params.q);
    if (mode === '1012' || mode === '1003') return error(mode);
    if (!request) return error(1003);
    if (mode === '1019' && request.polls++ === 0) return error(1019);
    return statement(request);
  }
  return error(1003);
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const body = answer(url);
  console.log(
    `${new Date().toISOString()} ${url.pathname} ${url.searchParams.toString().replace(/t=[^&]*/, 't=***')} mode=${mode}`,
  );
  res.writeHead(200, { 'Content-Type': 'text/xml' }).end(body);
}).listen(PORT, () => console.log(`Flex stub on http://localhost:${PORT}, mode ${mode}`));
