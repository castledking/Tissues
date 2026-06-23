// Tissues (Track Issues) - content.js
// Injects a □ → ⏳ → ✅ status button into each issue row on GitHub issue list pages.

'use strict';

const STORAGE_KEY = 'tissues_states';
const STATES = ['todo', 'inprogress', 'done'];
const LABELS = { todo: '□', inprogress: '⏳', done: '✅' };
const TITLES = { todo: 'Mark in progress', inprogress: 'Mark done', done: 'Clear' };

// ── Storage helpers ────────────────────────────────────────────────────────────

function loadStates(cb) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    cb(result[STORAGE_KEY] || {});
  });
}

function saveState(issueNum, state) {
  loadStates((states) => {
    if (state === 'todo') {
      delete states[issueNum];
    } else {
      states[issueNum] = state;
    }
    chrome.storage.local.set({ [STORAGE_KEY]: states });
  });
}

// ── State cycling ──────────────────────────────────────────────────────────────

function cycleState(current) {
  const idx = STATES.indexOf(current);
  return STATES[(idx + 1) % STATES.length];
}

function applyState(btn, state) {
  btn.dataset.tissuesState = state;
  btn.textContent = LABELS[state];
  btn.title = TITLES[state];
}

// ── DOM injection ──────────────────────────────────────────────────────────────

// Extract issue number from a list-item element.
// The <li> has an aria-label like "Placing a chest... #2606 In GriefPrevention/..."
// We also try the description span that contains "#NNNN".
function extractIssueNumber(li) {
  // Most reliable: the description item that shows "#2606"
  const descSpan = li.querySelector('[data-testid="list-row-repo-name-and-number"] span');
  if (descSpan) {
    const m = descSpan.textContent.match(/#(\d+)/);
    if (m) return m[1];
  }
  // Fallback: aria-label on the <li>
  const label = li.getAttribute('aria-label') || '';
  const m2 = label.match(/#(\d+)/);
  if (m2) return m2[1];
  return null;
}

function processRow(li, states) {
  // Already processed?
  if (li.querySelector('.tissues-indicator')) return;

  const issueNum = extractIssueNumber(li);
  if (!issueNum) {
    console.log('[tissues] could not extract issue number from row', li);
    return;
  }

  // Find the metadata container — it holds the PR links, comment count, assignees, etc.
  // Selector uses data-testid on one of its known children to locate the parent reliably.
  const assigneesDiv = li.querySelector('[data-testid="list-row-assignees"]');
  if (!assigneesDiv) {
    console.log('[tissues] no assignees div in row for issue #' + issueNum);
    return;
  }

  const state = states[issueNum] || 'todo';

  const wrapper = document.createElement('div');
  wrapper.className = 'tissues-wrapper';
  // Match the inline style used by sibling metadata divs so it sits in the flex row
  wrapper.style.cssText = 'display:flex;align-items:center;flex-shrink:0;margin-left:4px;';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tissues-indicator';
  btn.dataset.tissuesNum = issueNum;
  applyState(btn, state);

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = cycleState(btn.dataset.tissuesState);
    applyState(btn, next);
    saveState(issueNum, next);
    console.log('[tissues] #' + issueNum + ' → ' + next);
  });

  wrapper.appendChild(btn);
  // Insert after the assignees div so the tissues box sits to the right of
  // linked PR count, comment count, and all other metadata items.
  assigneesDiv.insertAdjacentElement('afterend', wrapper);

  // Observe this row for React re-renders that wipe injected elements
  observeRow(li);

  console.log('[tissues] injected indicator for issue #' + issueNum + ' (state: ' + state + ')');
}

// ── Main processing ────────────────────────────────────────────────────────────

let forkCheckPromise = null;
let hasForkResult = null;

function processIssueList() {
  // Only run on issue list pages (not PR pages, not issue detail pages)
  if (!isIssueListPage()) return;

  // Don't run on repos the user owns
  if (isOwnRepo()) {
    console.log('[tissues] skipping — user owns this repo');
    return;
  }

  // If we already have a cached result, use it
  if (hasForkResult !== null) {
    if (hasForkResult) {
      injectIndicators();
    }
    return;
  }

  // Only start one fork check at a time
  if (forkCheckPromise) return;

  forkCheckPromise = checkUserHasFork().then(hasFork => {
    hasForkResult = hasFork;
    forkCheckPromise = null;
    if (hasFork) {
      console.log('[tissues] user has forked this repo, injecting indicators');
      injectIndicators();
    } else {
      console.log('[tissues] skipping — user has not forked this repo');
    }
  });
}

function injectIndicators() {
  // Each issue row is an <li role="listitem"> inside the list view
  const rows = document.querySelectorAll('li[role="listitem"]');
  if (!rows.length) {
    console.log('[tissues] no issue rows found yet');
    return;
  }

  console.log('[tissues] processing ' + rows.length + ' rows');

  loadStates((states) => {
    rows.forEach((li) => processRow(li, states));
  });
}

// Per-row observer: watches the metadata container for childList changes
// (React re-renders wipe injected elements, so we re-inject after each render)
const rowObservers = new WeakMap();

function observeRow(li) {
  if (rowObservers.has(li)) return; // already observing

  const metaContainer = li.querySelector('[data-testid="list-row-assignees"]')?.parentElement;
  if (!metaContainer) return;

  const rowObserver = new MutationObserver(() => {
    // React re-rendered this row — re-inject if our indicator was wiped
    if (!li.querySelector('.tissues-indicator')) {
      // Disconnect temporarily to avoid infinite loop from our own injection
      rowObserver.disconnect();
      loadStates((states) => processRow(li, states));
      // Re-observe after injection (container may have been replaced by React)
      setTimeout(() => {
        const newMetaContainer = li.querySelector('[data-testid="list-row-assignees"]')?.parentElement;
        if (newMetaContainer) {
          rowObserver.observe(newMetaContainer, { childList: true, subtree: true });
        }
      }, 50);
    }
  });

  rowObserver.observe(metaContainer, { childList: true, subtree: true });
  rowObservers.set(li, rowObserver);
}

function isIssueListPage() {
  // Must be /owner/repo/issues (list), not /issues/123 (detail)
  return /\/[^/]+\/[^/]+\/issues(?:\/?\?|\/?\s*$|\?|$)/.test(location.pathname + location.search) &&
         !/\/issues\/\d+/.test(location.pathname);
}

// ── Ownership / fork check ────────────────────────────────────────────────────

function getCurrentUserLogin() {
  // Try meta tag first
  const metaLogin = document.querySelector('meta[name="user-login"]')?.content;
  if (metaLogin) return metaLogin;

  // Fallback: try the hidden "go to my profile" link
  const profileLink = document.querySelector('a[data-hotkey="g m"]');
  if (profileLink) {
    const href = profileLink.getAttribute('href');
    if (href && href.startsWith('/') && href.length > 1) return href.slice(1);
  }

  // Fallback: try the user avatar button
  const avatarBtn = document.querySelector('button[data-login]');
  if (avatarBtn?.dataset?.login) return avatarBtn.dataset.login;

  return '';
}

function getRepoOwner() {
  const meta = document.querySelector('meta[name="octolytics-dimension-user_login"]')?.content;
  if (meta) return meta;
  // Fallback: parse from URL path /owner/repo/issues
  const match = location.pathname.match(/^\/([^/]+)\/[^/]+/);
  return match ? match[1] : '';
}

function getRepoNwo() {
  const meta = document.querySelector('meta[name="octolytics-dimension-repository-nwo"]')?.content;
  if (meta) return meta;
  // Fallback: parse from URL path /owner/repo/issues
  const match = location.pathname.match(/^\/([^/]+\/[^/]+)/);
  return match ? match[1] : '';
}

// Check if the current user owns this repo.
function isOwnRepo() {
  const user = getCurrentUserLogin();
  const owner = getRepoOwner();
  return !!(user && owner && user === owner);
}

// Check if the current user has forked this repo.
// Fetches the /fork page and parses the embedded JSON which lists existingForks.
// Returns a Promise that resolves to true/false.
function checkUserHasFork() {
  const user = getCurrentUserLogin();
  console.log('[tissues] getCurrentUserLogin() =', JSON.stringify(user));
  if (!user) {
    console.log('[tissues] cannot determine user login, skipping fork check');
    return Promise.resolve(false);
  }

  const repoNwo = getRepoNwo();
  if (!repoNwo) {
    console.log('[tissues] cannot determine repo NWO, skipping fork check');
    return Promise.resolve(false);
  }

  console.log('[tissues] fetching /fork page for', repoNwo);
  return fetch(`https://github.com/${repoNwo}/fork`, { credentials: 'include' })
    .then(res => {
      console.log('[tissues] /fork response status:', res.status);
      if (!res.ok) return false;
      return res.text();
    })
    .then(html => {
      console.log('[tissues] /fork HTML length:', html.length);
      console.log('[tissues] /fork HTML preview:', html.substring(0, 500));
      // Parse the embedded react payload JSON which contains existingForks
      // Note: attribute order varies across pages - use a flexible regex
      const jsonMatch = html.match(/data-target="react-app\.embeddedData"[^>]*>([\s\S]*?)<\/script>/);
      if (!jsonMatch) {
        console.log('[tissues] could not find embedded JSON in /fork page');
        return false;
      }
      try {
        const data = JSON.parse(jsonMatch[1]);
        const forks = data?.payload?.existingForks;
        console.log('[tissues] existingForks:', JSON.stringify(forks));
        if (!Array.isArray(forks)) return false;
        const found = forks.some(f => f.ownerLogin === user);
        console.log('[tissues] user has fork:', found);
        return found;
      } catch (e) {
        console.log('[tissues] JSON parse error:', e);
        return false;
      }
    })
    .catch(err => {
      console.log('[tissues] fetch error:', err);
      return false;
    });
}

// ── MutationObserver with debounce (handles GitHub Turbo/SPA navigation) ─────

let debounceTimer = null;
function debouncedProcess() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log('[tissues] running processIssueList (debounced)');
    processIssueList();
  }, 300);
}

const observer = new MutationObserver((mutations) => {
  // Only react if nodes were actually added
  const hasAdditions = mutations.some((m) => m.addedNodes.length > 0);
  if (hasAdditions) debouncedProcess();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial run
console.log('[tissues] content script loaded on ' + location.href);
processIssueList();
