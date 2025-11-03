import { Octokit } from "octokit";
import { emitMermaid } from "./mermaidEmitter.js";

const {
  GH_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  BASE_BRANCH = "main",
  HEAD_BRANCH,
  PR_TITLE = "docs: update Architecture diagram",
  PR_BODY = "Automated update of Architecture section (Mermaid)."
} = process.env;

if (!GH_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error("Missing env: GH_TOKEN, GITHUB_OWNER, GITHUB_REPO are required.");
  process.exit(1);
}

const octokit = new Octokit({ auth: GH_TOKEN });

const START = "<!--ARCH-START-->";
const END = "<!--ARCH-END-->";

function upsertInString(text, newBlock) {
  const start = START;
  const end = END;
  const pattern = new RegExp(`${escapeForRegex(start)}[\\s\\S]*?${escapeForRegex(end)}`);
  const replacement = `${start}\n${newBlock}\n${end}`;

  if (pattern.test(text)) return text.replace(pattern, replacement);

  const header = "## Architecture";
  const needsNL = text.endsWith("\n") ? "" : "\n";
  return `${text}${needsNL}\n${header}\n${replacement}\n`;
}

function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
}

async function main() {
  const headBranch = HEAD_BRANCH || "arch-agent/architecture";
  const block = emitMermaid({}); // trivial for mvp
  const path = "README.md";

  // 1) Get base branch SHA
  const baseRef = await octokit.rest.git.getRef({
    owner: GITHUB_OWNER, repo: GITHUB_REPO, ref: `heads/${BASE_BRANCH}`
  });
  const baseSha = baseRef.data.object.sha;

  // 2) Create or reset head branch to base
  let headExists = true;
  try {
    await octokit.rest.git.getRef({ owner: GITHUB_OWNER, repo: GITHUB_REPO, ref: `heads/${headBranch}` });
  } catch {
    headExists = false;
  }
  if (!headExists) {
    await octokit.rest.git.createRef({
      owner: GITHUB_OWNER, repo: GITHUB_REPO,
      ref: `refs/heads/${headBranch}`, sha: baseSha
    });
  } else {
    // fast-forward head to base (update ref)
    await octokit.rest.git.updateRef({
      owner: GITHUB_OWNER, repo: GITHUB_REPO,
      ref: `heads/${headBranch}`, sha: baseSha, force: true
    });
  }

  // 3) Read README on base for latest content
  const readmeResp = await octokit.rest.repos.getContent({
    owner: GITHUB_OWNER, repo: GITHUB_REPO, path, ref: BASE_BRANCH
  });

  if (!("content" in readmeResp.data)) {
    throw new Error("README.md not a file");
  }
  const current = Buffer.from(readmeResp.data.content, "base64").toString("utf8");
  const updated = upsertInString(current, block);

  if (updated === current) {
    console.log("No changes required.");
  } else {
    // 4) Put updated README on head branch
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path,
      message: "chore: update Architecture diagram (Mermaid)",
      content: Buffer.from(updated, "utf8").toString("base64"),
      branch: headBranch,
      sha: readmeResp.data.sha
    });
    console.log("README updated on branch:", headBranch);
  }

  // 5) Create or update PR
  const prs = await octokit.rest.pulls.list({
    owner: GITHUB_OWNER, repo: GITHUB_REPO,
    state: "open", head: `${GITHUB_OWNER}:${headBranch}`, base: BASE_BRANCH
  });

  if (prs.data.length === 0) {
    const pr = await octokit.rest.pulls.create({
      owner: GITHUB_OWNER, repo: GITHUB_REPO,
      title: PR_TITLE, head: headBranch, base: BASE_BRANCH, body: PR_BODY
    });
    console.log("PR created:", pr.data.html_url);
  } else {
    const pr = prs.data[0];
    // Optionally update title/body to keep current
    await octokit.rest.pulls.update({
      owner: GITHUB_OWNER, repo: GITHUB_REPO, pull_number: pr.number,
      title: PR_TITLE, body: PR_BODY
    });
    console.log("PR updated:", pr.html_url);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});