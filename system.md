1. Problem
Remote teams often struggle to quickly see who is available. Checking calendars or sending messages takes time and can be distracting. A central status board solves this by showing everyone's availability in one place.

2. Solution
This is a simple web app called Status Board. It lets users:

Enter their name.

Choose their status (Online, Away, Busy, or Offline).

Submit their status.

See a list of all recent updates.

View a summary showing the latest status for each person.

View all timestamps in EST.

Know when the board will auto-refresh.

Clear all statuses (with confirmation).

Main Parts:
Frontend (HTML/JS site)

Backend (Cloudflare Worker)

Database (Cloudflare D1)

3. How It Works
Frontend (in site/ folder):
Built with plain HTML, CSS, and JavaScript (main.js).

Users fill out a form with name + status.

JavaScript sends a POST to /statuses.

Every 10 seconds, JavaScript fetches the latest data with a GET request.

It shows:

A list of all recent updates.

A summary with each person’s most recent status.

If a person hasn’t updated in over 5 minutes, they’re marked "offline (auto)".

There’s a button to delete all statuses (with confirmation).

JavaScript and API requests use cache-busting to avoid stale data.

Backend (in worker/ folder):
A Cloudflare Worker handles all API requests to /statuses.

Routes:

GET /statuses: Returns all statuses from the D1 database.

POST /statuses: Adds a new status update with name and timestamp.

DELETE /statuses: Deletes all status entries.

CORS headers allow the frontend to talk to the backend.

Also serves the static frontend from the site/ folder (set in wrangler.toml).

Database (Cloudflare D1):
One table: statuses with id, name, status, and ts (timestamp).

All status updates are saved here.

Defined in worker/schema.sql.

Connected through STATUS_DB in wrangler.toml.

Configuration (worker/wrangler.toml):
Sets the Worker name, entry file (index.js), and D1 binding.

Sets up static site hosting from the site/ folder.