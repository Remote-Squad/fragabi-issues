# Fragabi Auto Close Issues Action

This GitHub Action automatically manages issues in Fragabi web app projects by ensuring they follow the provided issue templates. It helps maintain consistency in issue reporting and makes it easier for maintainers to handle issues effectively.

## Features

- 🔍 Automatically checks if new issues follow the provided template
- 🚫 Closes issues that don't follow the template
- 💬 Adds a friendly comment explaining why the issue was closed
- 🏷️ Labels non-compliant issues for easy tracking
- ♻️ Automatically reopens issues when they're updated to follow the template

### Issue Templates

The action looks for templates in the `.github/ISSUE_TEMPLATE/` directory. By default, it includes:

- `bug_report.md`: Template for reporting bugs

You can add more templates by creating additional `.md` files in the same directory.

Made with ❤️ for Fragabi web app projects 