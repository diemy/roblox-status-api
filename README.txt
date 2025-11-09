Roblox Status API (Private) — Render.com Deploy Guide
=====================================================

What you get
------------
- Private API that accepts status reports from your Roblox script.
- Endpoints (all private except /health):
  • POST /report   (x-api-key required)
  • GET  /status   (x-api-key required) — latest row per account
  • GET  /reports  (x-api-key required) — recent feed
  • GET  /health   (public for uptime)

Quick Deploy (Render, free)
---------------------------
1) Create a new GitHub repo named: roblox-status-api
2) Upload these files: app.js, package.json, README.txt
3) On Render Dashboard: New → Web Service → Connect this repo
4) Environment Variables:
     API_KEY = your_super_secret_key
5) Build Command: (leave empty, Render auto-installs from package.json)
   or explicitly set: npm install
6) Start Command: node app.js
7) Deploy. When logs show “Private Status API listening”, copy your URL (e.g. https://roblox-status-api.onrender.com).

Roblox Client Snippet
---------------------
Paste this near the top of your script (adjust URL + key):

getgenv().StatusApi = {
    Url = "https://YOUR-RENDER-URL.onrender.com/report",
    ApiKey = "your_super_secret_key",
    ReportInterval = 30,
    DebounceSeconds = 5,
    UseSynRequest = true
}

-- Minimal reporter (requires syn.request/http.request):
local HttpService = game:GetService("HttpService")
local function safeRequest(opts)
    if syn and syn.request then return syn.request(opts) end
    if http and http.request then return http.request(opts) end
    if request then return request(opts) end
    return nil, "No HTTP request function available"
end

local function sendStatus(payload)
    local body = HttpService:JSONEncode(payload)
    local res = safeRequest({
        Url = getgenv().StatusApi.Url,
        Method = "POST",
        Headers = {
            ["Content-Type"] = "application/json",
            ["x-api-key"] = getgenv().StatusApi.ApiKey
        },
        Body = body
    })
    return res and res.StatusCode and res.StatusCode < 300
end

Security
--------
- Keep API_KEY secret; change it if leaked.
- /status and /reports are private: you must supply x-api-key.
- DB is local SQLite on Render; fine for small/medium usage.