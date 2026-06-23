'use strict';

const STORAGE_KEY = 'tissues_states';
const LABELS = { todo: '□', inprogress: '⏳', done: '✅' };

function render(states) {
  const list = document.getElementById('list');
  const empty = document.getElementById('empty');
  list.innerHTML = '';

  const entries = Object.entries(states).filter(([, s]) => s !== 'todo');
  if (!entries.length) {
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  entries.sort((a, b) => Number(a[0]) - Number(b[0]));
  entries.forEach(([num, state]) => {
    const li = document.createElement('li');
    const numSpan = document.createElement('span');
    numSpan.textContent = `#${num}`;
    const stateSpan = document.createElement('span');
    stateSpan.className = 'state';
    stateSpan.textContent = LABELS[state] || state;
    li.appendChild(numSpan);
    li.appendChild(stateSpan);
    list.appendChild(li);
  });
}

chrome.storage.local.get(STORAGE_KEY, (result) => {
  render(result[STORAGE_KEY] || {});
});

document.getElementById('clear').addEventListener('click', () => {
  chrome.storage.local.remove(STORAGE_KEY, () => render({}));
});
