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
    li.innerHTML = `<span>#${num}</span><span class="state">${LABELS[state] || state}</span>`;
    list.appendChild(li);
  });
}

chrome.storage.local.get(STORAGE_KEY, (result) => {
  render(result[STORAGE_KEY] || {});
});

document.getElementById('clear').addEventListener('click', () => {
  chrome.storage.local.remove(STORAGE_KEY, () => render({}));
});
