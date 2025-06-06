const API = '/statuses';
const APP_VERSION = '1.0.5'; // Match version in HTML
const form = document.getElementById('status-form');
const nameInput = document.getElementById('name-input');
const statusSelect = document.getElementById('status-select');
const statusesDiv = document.getElementById('statuses');
const boardDiv = document.getElementById('board');
const refreshIndicator = document.querySelector('.refresh-indicator');

// Countdown variables
let countdown = 10;
let countdownInterval;
let displayCleared = false; // Add this flag

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
  // Prevent loading if display was just cleared
  if (displayCleared) {
    debug('Display is cleared, skipping loadStatuses.');
    return; // Stop execution here
  }

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

// Function to update the board with styled status cards - showing only the latest status per person
function updateBoard(data) {
  if (!boardDiv) {
    debug('Error: board div not found');
    return;
  }

  debug('Updating board with latest status per person from data:', data);

  if (!data || !Array.isArray(data) || data.length === 0) {
    boardDiv.innerHTML = '<div class="status">No status data available</div>';
    return;
  }

  boardDiv.innerHTML = ""; // Clear the board first

  const latestStatuses = new Map(); // Use a Map to store the latest status for each name

  // Assuming 'data' is sorted by timestamp descending (latest first) from the API
  // Iterate through the data and keep only the first (latest) entry for each name
  data.forEach(entry => {
    if (!latestStatuses.has(entry.name)) {
      latestStatuses.set(entry.name, entry);
    }
  });

  // Now render the latest statuses from the Map
  latestStatuses.forEach(entry => {
    const currentTime = new Date().getTime();
    const statusTime = new Date(entry.ts).getTime();
    const timeDiff = currentTime - statusTime;

    let displayStatus = entry.status;
    let autoOfflineText = '';

    // Check for auto-offline status
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

    // Display name and the determined status (could be original or auto-offline)
    const statusText = document.createTextNode(
      `${entry.name} is ${displayStatus}${autoOfflineText}`
    );
    div.appendChild(statusText);

    // Add the status tag based on the determined status
    const statusTag = document.createElement("span");
    statusTag.className = `status-tag ${displayStatus}`;
    statusTag.textContent = displayStatus;
    div.appendChild(statusTag);

    // Add the timestamp in EST
    const timestamp = new Date(entry.ts);
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
    const small = document.createElement("small");
    small.textContent = estTimeStr;
    div.appendChild(small);


    boardDiv.appendChild(div);
  });

  // If the map is empty after processing, show a message
  if (latestStatuses.size === 0) {
      boardDiv.innerHTML = '<div class="status">No unique statuses found</div>';
  }
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
    displayCleared = false; // Reset the flag BEFORE refreshing
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
    // Update text based on whether display is cleared
    if (displayCleared) {
      refreshIndicator.textContent = `Display cleared. Refreshing in ${countdown}s...`;
    } else {
      refreshIndicator.textContent = `Auto-refreshing in ${countdown}s`;
    }
  }
  countdown--;

  if (countdown < 0) {
    displayCleared = false; // Reset the flag BEFORE refreshing
    resetCountdown();
    loadStatuses(); // Now loadStatuses will run
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

  // Add event listener for the clear button
  const clearButton = document.getElementById('clear-button');
  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      debug('Clear Statuses button clicked');

      // Confirmation dialog
      if (!confirm('Are you sure you want to permanently delete ALL statuses? This cannot be undone.')) {
        debug('Clear operation cancelled by user.');
        return; // Stop if user cancels
      }

      debug('Proceeding with delete operation...');
      try {
        // Send DELETE request to the backend API
        const response = await fetch(API, { // Assuming DELETE on /statuses clears all
          method: 'DELETE',
          headers: {
            'Cache-Control': 'no-cache' // Ensure request isn't cached
          }
        });

        if (!response.ok) {
          // Try to get error message from response body
          let errorMsg = `API returned ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMsg += ` - ${errorData.error}`;
            }
          } catch (e) { /* Ignore if response body isn't JSON */ }
          throw new Error(errorMsg);
        }

        debug('Delete request successful');
        alert('All statuses have been permanently deleted.');

        // Immediately refresh the display to show it's empty
        displayCleared = false; // Ensure loadStatuses runs
        resetCountdown(); // Reset timer
        await loadStatuses(); // Reload (should show empty state now)

      } catch (err) {
        console.error("Error deleting statuses:", err);
        alert(`Failed to delete statuses: ${err.message}`);
      }
    });
  } else {
    debug('Clear button not found');
  }
});

