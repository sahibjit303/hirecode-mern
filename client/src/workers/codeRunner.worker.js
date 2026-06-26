/**
 * Web Worker for safe client-side JavaScript code execution.
 * Runs in an isolated context — no DOM, no network.
 */

/* eslint-disable no-restricted-globals */
self.onmessage = function (e) {
  const { code, testCases, timeout = 5000 } = e.data;
  const results = [];

  for (const tc of testCases) {
    if (tc.isHidden && tc.expectedOutput === "[hidden]") {
      results.push({
        passed: null,
        input: tc.input,
        expected: "[hidden]",
        actual: "[evaluated server-side]",
        error: "",
      });
      continue;
    }

    try {
      // Build a function that captures console.log output
      let output = "";
      const mockConsole = {
        log: (...args) => {
          output += args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n";
        },
        error: (...args) => {
          output += args.map((a) => String(a)).join(" ") + "\n";
        },
        warn: (...args) => {
          output += args.map((a) => String(a)).join(" ") + "\n";
        },
      };

      // Wrap code to capture return value or console output
      const wrappedCode = `
        "use strict";
        const console = __mockConsole__;
        const input = __input__;
        ${code}
      `;

      let inputVal;
      try {
        inputVal = JSON.parse(tc.input);
      } catch {
        inputVal = tc.input;
      }

      // Execute with timeout
      const startTime = Date.now();
      const fn = new Function("__mockConsole__", "__input__", wrappedCode);

      // Simple timeout check (Web Workers don't have AbortController for sync code)
      const result = fn(mockConsole, inputVal);

      const elapsed = Date.now() - startTime;
      if (elapsed > timeout) {
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: "",
          error: `Timeout: exceeded ${timeout}ms`,
        });
        continue;
      }

      // Determine actual output: return value or console output
      let actual;
      if (result !== undefined) {
        actual = typeof result === "object" ? JSON.stringify(result) : String(result);
      } else {
        actual = output.trim();
      }

      const expected = tc.expectedOutput.trim();
      const passed = actual === expected;

      results.push({
        passed,
        input: tc.input,
        expected: tc.expectedOutput,
        actual,
        error: "",
      });
    } catch (err) {
      results.push({
        passed: false,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: "",
        error: err.message || String(err),
      });
    }
  }

  self.postMessage({ results });
};
