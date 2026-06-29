<p align="center">
  <img alt="Tissues" width="100%" height="auto" src="https://castled.codes/assets/tissues-banner.png?v=2">
</p>

<p align="center">
  <a href="https://addons.mozilla.org/en-US/firefox/addon/tissues/"><img alt="Download on Firefox Add-ons" src="https://img.shields.io/badge/Download%20on-Firefox%20Add--ons-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white"></a>
  <a href="https://chromewebstore.google.com/detail/tissues/bmlogcbjapfmoilololendjaleaeckjj"><img alt="Download on Chrome Web Store" src="https://img.shields.io/badge/Download%20on-Chrome%20Web%20Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <a href="https://github.com/castledking/Tissues/issues"><img src="https://img.shields.io/badge/GitHub-Issues-181717?style=for-the-badge&logo=github" alt="GitHub Issues"></a>
</p>

# Tissues (Track Issues)

A browser extension that helps you track the status of issues across repositories you've forked on GitHub. Adds a simple **□ → ⏳ → ✅** status indicator to each issue row in GitHub's issue lists, so you can keep track of what you need to work on at a glance.

## Features

- **One-click issue tracking** — Click the indicator on any issue to cycle through To-Do (□), In Progress (⏳), and Done (✅) states
- **Fork-only activation** — Only activates on repositories you've forked, keeping unrelated repos clean
- **No API token required** — Fork detection works by checking GitHub's /fork page
- **Persistent state** — Issue states are saved locally and survive page reloads and navigation
- **React-aware** — Uses per-row MutationObservers to maintain indicators across GitHub's React re-renders
- **Cross-browser** — Available for Chrome/Chromium and Firefox

## Installation

### Firefox

Install from [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tissues/).

### Chrome / Chromium

Install from [Chrome Web Store](https://chromewebstore.google.com/detail/tissues/bmlogcbjapfmoilololendjaleaeckjj).

## Usage

1. Navigate to the issues page of a repository you've forked on GitHub
2. Each issue row will show a status indicator on the right side
3. Click the indicator to cycle: **□** (To-Do) → **⏳** (In Progress) → **✅** (Done) → back to **□**
4. States are saved automatically and persist across page loads

## Bug Reports & Feature Requests

Found a bug or have an idea? [Open an issue](https://github.com/castledking/Tissues/issues) on GitHub.

## License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html) — see [LICENSE.txt](LICENSE.txt) for details.
