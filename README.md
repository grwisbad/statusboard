# statusboard
 A simple status board website where teammates can post online/away/busy status

## Running Locally

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd statusboard
    ```

2.  **Install Wrangler:**
    If you don't have Cloudflare's CLI, install it:
    ```bash
    npm install -g wrangler
    ```

3.  **Configure Site Directory (if needed):**
    Make sure your `worker/wrangler.toml` tells Wrangler where your static files are. Add this section if it's missing:
    ```toml
    # worker/wrangler.toml
    [site]
    bucket = "../site" # Path from worker/ to site/
    ```

4.  **Run the Development Server:**
    From the **root** `statusboard` directory, run:
    ```bash
    npx wrangler dev worker/index.js --local
    ```
    *   This command starts your Worker and serves your static `site` folder.
    *   It also simulates the D1 database locally. Wrangler should automatically create the necessary local database file (`.wrangler/state/v3/d1/...`) and apply your `worker/schema.sql` the first time you run it or if the schema changes. If you have issues, you might need to run `npx wrangler d1 execute status --local --file=./worker/schema.sql` from the root directory first.

5.  **Access the App:**
    Open your browser to `http://localhost:8787` (or the URL Wrangler provides).
