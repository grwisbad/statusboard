const API = '/statuses';
const form = document.getElementById('status-form');
const nameInput = document.getElementById('name-input');
const statusSelect = document.getElementById('status-select');
const statusesDiv = document.getElementById('statuses');
const refreshIndicator = document.querySelector('.refresh-indicator');

// Countdown variables
let countdown = 10;
let countdownInterval;

async function loadStatuses() {
  try {
    const res = await fetch(API);
    const list = await res.json();
    
    // Check if user has been inactive for more than 5 minutes (300000ms)
    const currentTime = new Date().getTime();
    const updatedList = list.map(s => {
      const statusTime = new Date(s.ts).getTime();
      const timeDiff = currentTime - statusTime;
      
      // If status was set more than 5 minutes ago and not already offline, mark as offline
      if (timeDiff > 300000 && s.status !== 'offline') {
        return { ...s, status: 'offline', autoOffline: true };
      }
      return s;
    });
    
    statusesDiv.innerHTML = updatedList.map(s => {
      const autoOfflineText = s.autoOffline ? ' (auto)' : '';
      return `<div class="status" data-status="${s.status}">
        <span class="status-indicator ${s.status}"></span>
        <strong>${s.name}</strong>: ${s.status}${autoOfflineText}
        <span class="status-tag ${s.status}">${s.status}</span>
        <small>${new Date(s.ts).toLocaleString()}</small>
      </div>`;
    }).join('');
    
    // Call updateBoard with the same data, no need to fetch again
    updateBoard(updatedList);
  } catch (error) {
    console.error("Error loading statuses:", error);
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
    resetCountdown(); // Reset the countdown after updating
    await loadStatuses();
  } catch (err) {
    console.error(err);
  }
});

function updateBoard(data) {
  if (!data) return;
  
  const board = document.getElementById("board");
  if (!board) return;
  
  board.innerHTML = "";
  
  const currentTime = new Date().getTime();
  
  data.forEach(entry => {
    const statusTime = new Date(entry.ts).getTime();
    const timeDiff = currentTime - statusTime;
    
    // If status was set more than 5 minutes ago and not already offline, mark as offline
    let displayStatus = entry.status;
    let autoOfflineText = '';
    
    if (timeDiff > 300000 && entry.status !== 'offline') {
      displayStatus = 'offline';
      autoOfflineText = ' (auto)';
    }
    
    const div = document.createElement("div");
    div.className = "status";
    div.setAttribute("data-status", displayStatus);
    
    const indicator = document.createElement("span");
    indicator.className = `status-indicator ${displayStatus}`;
    div.appendChild(indicator);
    
    const statusText = document.createTextNode(
      `${entry.name} is ${displayStatus}${autoOfflineText}`
    );
    div.appendChild(statusText);
    
    board.appendChild(div);
  });
}

// Func to update countdown display
function updateCountdown() {
  if (refreshIndicator) {
    refreshIndicator.textContent = `Auto-refreshing in ${countdown}s`;
  }
  countdown--;
  
  if (countdown < 0) {
    resetCountdown();
    loadStatuses();
  }
}

// Reset the countdown timer
function resetCountdown() {
  countdown = 10;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdown, 1000);
  
  if (refreshIndicator) {
    refreshIndicator.textContent = `Auto-refreshing in ${countdown}s`;
  }
}

// Show animation during refresh
function showRefreshAnimation() {
  if (!refreshIndicator) return;
  
  refreshIndicator.textContent = "Refreshing...";
  refreshIndicator.style.backgroundColor = "rgba(138, 43, 226, 0.4)";
  
  setTimeout(() => {
    refreshIndicator.textContent = `Auto-refreshing in ${countdown}s`;
    refreshIndicator.style.backgroundColor = "rgba(138, 43, 226, 0.2)";
  }, 1000);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  // Initial load
  loadStatuses();
  
  // Initial countdown
  resetCountdown();
});

