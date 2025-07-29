const fs = require("fs");
const core = require("@actions/core");
const { getOctokit, context } = require("@actions/github");
const mdjson = require("mdjson");

const ISSUE_TEMPLATE_DIR = ".github/ISSUE_TEMPLATE";

// Grab the closing message from params or fallback to a default message
const getIssueCloseMessage = () => {
  const message =
    core.getInput("issue-close-message") ||
    "@${issue.user.login}: hello! :wave:\n\nThis issue is being automatically closed because it does not follow the issue template.";

  const { payload } = context;

  return Function(
    ...Object.keys(payload),
    `return \`${message}\``
  )(...Object.values(payload));
};

(async () => {
  try {
    const octokit = getOctokit(
      core.getInput("github-token", { required: true })
    );

    const { payload } = context;
    const { owner, repo } = context.repo;

    const issueBodyMarkdown = payload.issue.body || '';
    // Get all the markdown titles from the issue body
    const issueBodyTitles = Object.keys(mdjson(issueBodyMarkdown));

    // Get a list of the templates
    const issueTemplates = fs.readdirSync(ISSUE_TEMPLATE_DIR);

    // Compare template titles with issue body
    const doesIssueMatchAnyTemplate = issueTemplates.some(template => {
      const templateMarkdown = fs.readFileSync(
        `${ISSUE_TEMPLATE_DIR}/${template}`,
        "utf-8"
      );
      const templateTitles = Object.keys(mdjson(templateMarkdown));

      return templateTitles.every(title => issueBodyTitles.includes(title));
    });

    const closedIssueLabel = core.getInput("closed-issues-label");

    if (doesIssueMatchAnyTemplate || payload.action !== "opened") {
      // Only reopen the issue if there's a `closed-issues-label` so it knows that
      // it was previously closed because of the wrong template
      if (payload.issue.state === "closed" && closedIssueLabel) {
        const { data: labels } = await octokit.rest.issues.listLabelsOnIssue({
          owner,
          repo,
          issue_number: context.issue.number
        });

        const labelNames = labels.map(({ name }) => name);

        if (!labelNames.includes(closedIssueLabel)) {
          return;
        }

        await octokit.rest.issues.removeLabel({
          owner,
          repo,
          issue_number: context.issue.number,
          name: closedIssueLabel
        });

        await octokit.rest.issues.update({
          owner,
          repo,
          issue_number: context.issue.number,
          state: "open"
        });

        return;
      }

      return;
    }

    // If a closed issue label was provided, add it to the issue
    if (closedIssueLabel) {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: context.issue.number,
        labels: [closedIssueLabel]
      });
    }

    // Add the issue closing comment
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: context.issue.number,
      body: getIssueCloseMessage()
    });

    // Close the issue
    await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: context.issue.number,
      state: "closed"
    });
  } catch (error) {
    core.setFailed(error.message);
  }
})();