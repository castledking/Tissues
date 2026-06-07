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
  const metaContainer = assigneesDiv.parentElement;
  if (!metaContainer) {
    console.log('[tissues] no meta container for issue #' + issueNum);
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
  // Append after the assignees div (last child in meta container)
  metaContainer.appendChild(wrapper);

  console.log('[tissues] injected indicator for issue #' + issueNum + ' (state: ' + state + ')');
}

// ── Main processing ────────────────────────────────────────────────────────────

function processIssueList() {
  // Only run on issue list pages (not PR pages, not issue detail pages)
  if (!isIssueListPage()) return;

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

function isIssueListPage() {
  // Must be /owner/repo/issues (list), not /issues/123 (detail)
  return /\/[^/]+\/[^/]+\/issues(?:\/?\?|\/?\s*$|\?|$)/.test(location.pathname + location.search) &&
         !/\/issues\/\d+/.test(location.pathname);
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
