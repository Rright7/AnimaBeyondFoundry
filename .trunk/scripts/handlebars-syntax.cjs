const fs = require('node:fs');
const path = require('node:path');

// Resolve Trunk's pinned parser before any workspace dependency.
const Handlebars = require(
  require.resolve('handlebars', {
    paths: process.env.NODE_PATH
      ? process.env.NODE_PATH.split(path.delimiter)
      : [process.cwd()]
  })
);

const results = [];
for (const file of process.argv.slice(2)) {
  try {
    Handlebars.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    const loc = error.hash?.loc;
    const line =
      loc?.first_line ??
      error.lineNumber ??
      Number(error.message.match(/Parse error on line (\d+)/)?.[1] ?? 1);
    const column = loc?.first_column ?? error.column ?? 0;
    results.push({
      ruleId: 'syntax',
      level: 'error',
      message: { text: error.message },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: file },
            region: {
              startLine: Math.max(1, line),
              startColumn: Math.max(1, column + 1)
            }
          }
        }
      ]
    });
  }
}

console.log(
  JSON.stringify({
    version: '2.1.0',
    runs: [{ tool: { driver: { name: 'handlebars-syntax' } }, results }]
  })
);
process.exitCode = results.length ? 1 : 0;
