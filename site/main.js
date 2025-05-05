const API = '/statuses';
const APP_VERSION = '1.0.2'; // Match version in HTML
const form = document.getElementById('status-form');
const nameInput = document.getElementById('name-input');
const statusSelect = document.getElementById('status-select');
const statusesDiv = document.getElementById('statuses');
const boardDiv = document.getElementById('board');
const refreshIndicator = document.querySelector('.refresh-indicator');

// Countdown variables
let countdown = 10;
let countdownInterval;

// Debug flag - set to true to see detailed logs
const DEBUG = true;

function debug(...args) {
  if (DEBUG) console.log('[StatusBoard]', ...args);
}

// Load initial placeholder
function initializePlaceholders() {
  debug('Initializing placeholders');
  if (statusesDiv) statusesDiv.innerHTML = '<div class="status">Loading statuses...</div>';
  if (boardDiv) boardDiv.innerHTML = '<div class="status">Loading summary...</div>';
}

async function loadStatuses() {
  debug('Loading statuses from API');
  try {
    // Add cache busting to prevent cached responses
    const cacheBuster = `v=${APP_VERSION}&t=${Date.now()}`;
    const res = await fetch(`${API}?${cacheBuster}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}: ${res.statusText}`);
    }
    
    const list = await res.json();
    debug('Received data:', list);
    
    if (!Array.isArray(list) || list.length === 0) {
      debug('No statuses found or empty array received');
      if (statusesDiv) statusesDiv.innerHTML = '<div class="status">No statuses available</div>';
      if (boardDiv) boardDiv.innerHTML = '<div class="status">No statuses available</div>';
      return;
    }
    
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
    
    // Update the status display
    if (statusesDiv) {
      debug('Updating statuses div');
      statusesDiv.innerHTML = updatedList.map(s => {
        const autoOfflineText = s.autoOffline ? ' (auto)' : '';
        
        // Format timestamp to EST time zone
        const timestamp = new Date(s.ts);
        const estTimeStr = timestamp.toLocaleString('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });
        
        return `<div class="status" data-status="${s.status}">
          <span class="status-indicator ${s.status}"></span>
          <strong>${s.name}</strong>: ${s.status}${autoOfflineText}
          <span class="status-tag ${s.status}">${s.status}</span>
          <small>${estTimeStr}</small>
        </div>`;
      }).join('');
    } else {
      debug('Error: statuses div not found');
    }
    
    // Update the board with the same data
    updateBoard(updatedList);
    
  } catch (error) {
    console.error("Error loading statuses:", error);
    if (statusesDiv) statusesDiv.innerHTML = '<div class="status">Error loading statuses</div>';
  }
}

// Function to update the board with styled status cards
function updateBoard(data) {
  if (!boardDiv) {
    debug('Error: board div not found');
    return;
  }
  
  debug('Updating board with data:', data);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    boardDiv.innerHTML = '<div class="status">No status data available</div>';
    return;
  }
  
  boardDiv.innerHTML = "";
  
  const currentTime = new Date().getTime();
  
  data.forEach(entry => {
    const statusTime = new Date(entry.ts).getTime();
    const timeDiff = currentTime - statusTime;
    
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
    
    boardDiv.appendChild(div);
  });
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const status = statusSelect.value;
  if (!name) return;
  
  debug('Submitting status update:', name, status);
  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    nameInput.value = '';
    resetCountdown();
    await loadStatuses(); // Reload statuses after updating
    
  } catch (err) {
    console.error("Error updating status:", err);
    alert("Failed to update status. Please try again.");
  }
});

// Countdown functions
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

function resetCountdown() {
  countdown = 10;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdown, 1000);
  
  if (refreshIndicator) {
    refreshIndicator.textContent = `Auto-refreshing in ${countdown}s`;
  }
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  debug('DOM content loaded, initializing app');
  initializePlaceholders();
  loadStatuses();
  resetCountdown();
});

