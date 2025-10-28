import fs from "fs";

const START = "<!--ARCH-START-->";
const END = "<!--ARCH-END-->";

export function upsertReadmeSection(mdPath, newBlock) {
  const text = fs.readFileSync(mdPath, "utf8");
  const pattern = new RegExp(`${escapeForRegex(START)}[\\s\\S]*?${escapeForRegex(END)}`);
  const replacement = `${START}\n\n${newBlock}\n\n${END}`;

  const updated = pattern.test(text)
    ? text.replace(pattern, replacement)
    : ensureTrailingNewline(text) + "\n## Architecture\n" + replacement + "\n";

  fs.writeFileSync(mdPath, updated, "utf8");
}

function ensureTrailingNewline(s) {
  return s.endsWith("\n") ? s : s + "\n";
}

function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
