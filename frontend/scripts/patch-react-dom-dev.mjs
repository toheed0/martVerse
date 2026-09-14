// Works around an upstream bug in the React DOM development build that ships
// inside Next.js 16.3.4.
//
// In addObjectDiffToProperties — the dev-only code that writes a component's
// changed props into the browser performance timeline — the null guard reads:
//
//     "object" === typeof key && ... && !          null !== key && ...
//                                       ^ stray "!"
//
// `!null` is `true`, so the test becomes `true !== key`, which passes for a
// null key. readReactElementTypeof(key) then runs `"$$typeof" in null` and
// throws "Cannot use 'in' operator to search for '$$typeof' in null", which
// tears down the render and leaves React reporting "Should not already be
// working." right behind it.
//
// It fires on a client-side navigation whenever a component re-renders with an
// object prop that holds a null somewhere inside — ordinary, correct app code.
// Only the development build carries the typo, so production is unaffected.
//
// Delete this script and its postinstall hook once Next ships a React DOM
// without the stray "!" — the check below already no-ops in that case.
import { readFileSync, writeFileSync } from "node:fs";

const TARGET =
  "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js";

// Matches the stray "!" and whatever whitespace the build left around it.
const BROKEN = /!\s*null !== key &&/;
const FIXED = "null !== key &&";

let source;

try {
  source = readFileSync(TARGET, "utf8");
} catch {
  // A fresh clone with no install yet, or a Next layout change. Neither is
  // worth failing an install over.
  console.log(`[patch-react-dom-dev] ${TARGET} not found — skipped`);
  process.exit(0);
}

if (!BROKEN.test(source)) {
  console.log("[patch-react-dom-dev] already correct — nothing to do");
  process.exit(0);
}

writeFileSync(TARGET, source.replace(BROKEN, FIXED), "utf8");

console.log(
  "[patch-react-dom-dev] restored the null guard in addObjectDiffToProperties"
);
