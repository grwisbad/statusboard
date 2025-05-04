const API = '/statuses';
const form = document.getElementById('status-form');
const nameInput = document.getElementById('name-input');
const statusSelect = document.getElementById('status-select');
const statusesDiv = document.getElementById('statuses');

async function loadStatuses() {
  try {
    const res = await fetch(API);
    const list = await res.json();
    statusesDiv.innerHTML = list.map(s =>
      `<div class="status">
         <strong>${s.name}</strong>: ${s.status}
         <br/><small>${new Date(s.ts).toLocaleString()}</small>
       </div>`
    ).join('');
  } catch {
    statusesDiv.innerHTML = '<p>Error loading statuses</p>';
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const status = statusSelect.value;
  if (!name) return;
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status }),
    });
    nameInput.value = '';
    await loadStatuses();
  } catch (err) {
    console.error(err);
  }
});

loadStatuses();
setInterval(loadStatuses, 10000);