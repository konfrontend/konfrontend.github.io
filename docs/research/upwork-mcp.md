# Upwork MCP server: what it gives a job-URL intake

Research notes, 2026-11-18. Question: what Upwork's official MCP server (`https://mcp.upwork.com/mcp`, launched 2026-08-10) can do for one integration: a local Claude Code pipeline that takes an Upwork job URL, fetches that Job's full posting through the MCP, and writes it into a local record. Findings only; no recommendation on what to build.

The rules side (what a freelancer may automate at all, the bots article, the API key route) is in `docs/research/upwork-rules.md` on branch `research/upwork-rules`. It is cited here, not repeated.

## How the sources were read

Every claim carries one of these labels.

- **Confirmed**: read live on 2026-11-18 from a source Upwork or the MCP ecosystem owns. These are: the endpoint's own unauthenticated responses; the official MCP registry; Upwork's GitHub org (`github.com/upwork`); the Legal Center text served from Upwork's contract host `vault.pactsafe.io`; Anthropic's connector directory; the Claude Code docs.
- **Indexed only**: an upwork.com or support.upwork.com page read through a search-engine extract. Every such page answered automated fetches with HTTP 403 (Cloudflare) on 2026-11-18. The challenge was not solved. Wording and numbers are as indexed; verify on the live page.
- **Third-party**: anything else. That includes tool-schema snapshots and response fixtures that other developers committed to their own GitHub repositories after connecting to the live server. These are dumps of the real server, but taken by someone else, at the commit date given, possibly trimmed.
- **Unknown**: no source found.

No sign-in, account, OAuth client registration or credential was used. The endpoint answers `initialize` and `tools/list` only with a token, so no tool list was read first-hand.

## Summary

- **Fetch by URL: yes.** `find_jobs` action `get` takes `params.id` (alias `params.job_id`) as a numeric id, a `~02…` ciphertext, or a full Upwork job URL, "as-is". Every call also needs `org_uid` from `list_accounts`. `get_job_posting` action `get_marketplace` takes the same three forms. (Confirmed in Upwork's own plugin skills; same wording in two third-party schema snapshots.)
- **Fields.** `get` returns the full description, contract terms (fixed amount or hourly budget type, experience level, engagement), client country and timezone, `client_record` (spend, hire rate, feedback score and count, jobs posted), `screening_questions`, `connects_cost`, `preferred_qualifications`, job activity counts, `can_apply`. Posted time, duration, skills, payment verification and proposal count are seen in search rows; whether `get` carries them is not shown by any source. Client city is reported by one third-party source only.
- **Tools.** Anthropic's directory lists 46 tools today. That list matches a third-party `tools/list` snapshot from 2026-08-27. Upwork's plugin (2026-10-28) names newer tools not in it (`confirm_preview`, `get_preview`, `search_tools`, `execute_tool`, `manage_meetings`) and calls `confirm_draft` / `get_draft` deprecated aliases. The set is role-scoped, so a freelancer account sees fewer (third-party counts: 33, 34).
- **Connection.** Streamable HTTP only (`/sse` returns 404). OAuth 2.1 with PKCE S256 and a public client; authorization on `www.upwork.com`. Claude Code: `claude mcp add --transport http upwork https://mcp.upwork.com/mcp`, then `/mcp` to sign in. Access token 24 hours, refresh token rotated on use (third-party measurement). Freelancer (`TALENT`) and agency (`FL_AGENCY`) accounts both get the job and proposal tools.
- **Limits.** Five categories, each capped per minute, hour and day, per account (indexed only). Search and discovery: 15 / 150 / 750. Job posts, proposals, offers, invitations: 20 / 60 / 150. Profile viewing: 5 / 75 / 250. Other reads: 20 / 250 / 750. Other writes: 4 / 15 / 40.
- **Terms.** API & MCP Terms v2.5, effective 2026-11-06, read live. §8.6: MCP outputs may stay in an AI system only as long as the immediate task needs, never over 30 days. Copies saved outside an AI system (a note, a CRM) may be kept as long as the task needs them, and the 30-day cap does not apply to those. Own notes and proposal text are not MCP outputs. §4.1 excludes enumerating or continuously monitoring the job corpus. §5.9 bars an Agent from ranking or scoring among postings by criteria it chooses itself.

## 1. Tool list

Every tool except `list_accounts`, `get_tool_help` and `store_uploaded_files` takes `action` (an enum), `org_uid` (from `list_accounts`) and an action-specific `params` object. `get_tool_help` with `tool_name` returns any tool's full live schema. Sources: [Upwork plugin, `skills/upwork-workflows/SKILL.md`](https://github.com/upwork/upwork-agent-plugin/blob/7908a7e68f4a3c462b4eb5bc884ee69c82ecff59/skills/upwork-workflows/SKILL.md) (confirmed); [third-party snapshot, 2026-08-27](https://github.com/malikad778/job-alert-upwork-mcp/blob/7113499c9342ca1b8cb7aac5ea494d3c7ea2d573/docs/mcp/tools.snapshot.json).

**Which list is current.**

- Anthropic's connector directory lists 46 tools for the Upwork connector at `https://mcp.upwork.com/mcp` (confirmed, via the directory search on 2026-11-18). The 46 names are identical to the 2026-08-27 snapshot. The directory list may be as old as that snapshot.
- Upwork's plugin, last changed 2026-10-28, names `confirm_preview` and `get_preview` and calls `confirm_draft` and `get_draft` "deprecated aliases" of them. It also names `search_tools` and `execute_tool` (compact mode), `manage_meetings` and `list_highlights` (an action of `get_profile`). (Confirmed.)
- A newer third-party snapshot, 2026-11-12, holds 6 tools and shows `manage_proposals` returning "a preview — call confirm_preview". ([raahim-ibrar/GigBidA2](https://github.com/raahim-ibrar/GigBidA2/blob/c498e6562d321965e2429e41c770c93323128bcf/tests/contract/upwork_schema.json), third-party.)
- Tools are "role-scoped and reject a mismatched account". Glama scored 33 tools on 2026-09-02 ([Glama listing](https://glama.ai/mcp/connectors/com.upwork.mcp/upwork-mcp-server), third-party). A freelancer-account spike on 2026-10-23 counted 34 ([Abialidr/NexusHq notes](https://github.com/Abialidr/NexusHq/blob/f11dca1c82d80aa25c33bb8d670bf898be5c3658/NexusHQ/docs/spike/upwork-findings.md), third-party).
- Two presentation modes: full-list (all tools registered) and compact (only `list_accounts`, `search_tools`, `execute_tool`, `get_tool_help`). `set_tool_mode` switches them. (Confirmed, plugin skill.)

Names below drop the `upwork__` prefix the directory adds. Actions come from the 2026-08-27 snapshot unless marked. `ro` is the tool's `readOnlyHint`.

**Search**

| Tool | ro | Actions | Purpose |
|---|---|---|---|
| `find_jobs` | yes | `search`, `get`, `smart_search` | Marketplace job search, one job in full, profile-matched feed. Parameters in sections 2 and 4. |
| `find_saved_jobs` | yes | `list`, `count` | The freelancer's saved jobs. `list`: `limit` 1–10, `offset`, `job_ids`, `followed`. |
| `save_job` | no | `save`, `unsave` | Bookmark a job. `params.job_id`. |
| `get_job_posting` | yes | `get`, `search_marketplace`, `get_marketplace`, `list` | Client's own postings; `get_marketplace` reads any marketplace job by numeric id, ciphertext or URL. |
| `find_freelancers` | yes | `search`, `get_profile`, `smart_search` | Talent search (client side). |
| `get_rate_insights` | yes | `get` | Going hourly range for a job's budget step (client side). |

**Proposals**

| Tool | ro | Actions | Purpose |
|---|---|---|---|
| `manage_proposals` | no | `create`, `accept_invitation`, `decline_invitation`, `withdraw`, `edit_terms`, `send_proposal`, `acknowledge_policy` | Submit, edit, withdraw a proposal; answer an invitation. The 2026-11-12 snapshot has `edit` for `edit_terms` and adds `start_ai_interview`. Returns a preview. |
| `list_freelancer_proposals` | yes | `list`, `invitations`, `get`, `get_room` | Own proposals and received invitations. |
| `confirm_draft` / `confirm_preview` | no | `confirm` | Executes a pending preview by `preview_id` and `type`. |
| `get_draft` / `get_preview` | yes | `get` | Reads a pending preview without executing it. |
| `update_draft` | no | `update` | Changes a pending preview's fields (2026-08-27 snapshot only). |
| `list_client_proposals`, `manage_client_proposals` | yes / no | `list`, `get`, `list_all`, `metadata` / `shortlist`, `decline` | Client side: proposals received. |
| `invite_freelancer`, `list_client_invitations` | no / yes | `list_jobs`, `send` / `list` | Client side: invitations. |

**Other**

| Tool | ro | Actions |
|---|---|---|
| `list_accounts` | yes | none; returns accounts with `org_uid`, `role` (`CLIENT`, `TALENT`, `FL_AGENCY`), `role_label`, `suspended` |
| `get_account` | yes | `get_user_details`, `get_organization`, `get_company` |
| `get_tool_help` | yes | none; `tool_name` |
| `get_freelancer_dashboard`, `get_client_dashboard`, `get_agency_dashboard` | yes | `check` |
| `get_profile` | yes | `get`, `list_highlights`, `transactions`, `connects_balance` |
| `update_profile` | no | 16 actions (title, overview, availability, skills, employment, languages, education, other experience) |
| `boost_profile` | no | `get_status`, `toggle_availability_badge`, `get_suggested_boost_bid`, `create_profile_boost`, `manage_profile_boost` |
| `get_agency` | yes | `list_agencies`, `list_teams`, `list_members` |
| `get_freelancer_financials`, `get_client_financials` | yes | earnings, transactions, Connects balance, timesheets |
| `get_messages`, `send_message` | yes / no | `list_rooms`, `find_room`, `list_messages`, `get_message` / `create_room`, `send`, `send_to_user`, `message_proposal`, `edit` |
| `list_offers`, `manage_offers`, `respond_to_offer` | yes / no / no | offers |
| `list_contracts`, `update_contract`, `end_contract` | yes / no / no | contracts |
| `list_milestones`, `manage_milestones`, `submit_milestones` | yes / no / no | milestones |
| `manage_talent_lists` | no | client talent lists |
| `post_job` | no | `create`, `update`, `close`, `close_reasons` (plugin adds `create_draft`, `renew`) |
| `start_attachment_upload`, `get_upload_status`, `confirm_attachment_upload`, `store_uploaded_files` | mixed | file uploads |
| `set_tool_mode`, `set_tool_permission` | no | `get`, `set` |

## 2. Fetching one job by URL or id

- **Yes, by URL, ciphertext or numeric id.** `find_jobs` action `get`, `params.id` or `params.job_id`: "Job ID from find_jobs search (preferred), a ~02… ciphertext, or a full Upwork job URL — pass any of these as-is." The 2026-08-27 description adds "all accepted directly, no need to extract or reformat the id yourself". (Third-party snapshots of 2026-08-27 and 2026-11-12, both linked in section 1.)
- Upwork's own skill says the same: "a marketplace job lookup accepts a numeric id, a ciphertext, or a full job URL, so a pasted link can go through unchanged". ([`upwork-workflows/SKILL.md`](https://github.com/upwork/upwork-agent-plugin/blob/7908a7e68f4a3c462b4eb5bc884ee69c82ecff59/skills/upwork-workflows/SKILL.md), confirmed.)
- Ciphertext prefixes: `~02…` is a job posting, `~01…` a freelancer profile. (Same source.)
- Fallback: if `get` returns access denied, the 2026-08-27 description says to call `get_job_posting` action `get_marketplace` with the same id. That action takes the same three forms.
- A call needs `org_uid` first, from `list_accounts`. So fetching one job is at least two calls in a fresh session.
- The numeric id matters later: `manage_proposals` `create` wants the numeric job id, "not the `~02…` ciphertext"; `get` returns it. ([`write-proposal/SKILL.md`](https://github.com/upwork/upwork-agent-plugin/blob/7908a7e68f4a3c462b4eb5bc884ee69c82ecff59/skills/write-proposal/SKILL.md), confirmed.)
- Region-locked jobs return a bare permission error. (UpHunt blog, [MCP limits](https://uphunt.io/blog/upwork-mcp-limits-100-connects-2026), third-party.)
- Not shown by any source: whether URL forms other than `https://www.upwork.com/jobs/~02…` work, such as `/freelance-jobs/apply/<slug>_~02…/` or URLs with query strings. Search rows return the `/jobs/~02…` form, sometimes with `utm_*` parameters added.

## 3. Fields a job comes back with

Two response shapes exist. Search rows (`search`, `smart_search`) are flat. `get` nests the posting under `data.marketplaceJobPosting` and adds top-level blocks.

Sources:

- [Upwork's tool description of `find_jobs`](https://github.com/malikad778/job-alert-upwork-mcp/blob/7113499c9342ca1b8cb7aac5ea494d3c7ea2d573/docs/mcp/tools.snapshot.json), as captured 2026-08-27 (third-party snapshot). It says `get` returns "full details of a job posting including client company info, work history, connects, and the client's preferred qualifications". It also names `connects_cost`, `connects_balance`, `can_apply`, `client_record`, `client_work_history`.
- `get` response fixtures: [Code4Each-in/management `mcp_get.json`](https://github.com/Code4Each-in/management/blob/f6a16bb3727f6ea413b221920bc46585d480703b/tests/Fixtures/Upwork/mcp_get.json), 2026-10-09; [morfemartin/upwork-radar `02_get_1001.json`](https://github.com/morfemartin/upwork-radar/blob/b673c9c23acee591505ba47cd361a400182ca794/tests/fixtures/raw/02_get_1001.json), 2026-11-16. Both third-party and sanitized.
- Search-row fixture: [nazmulhasanrupom/upwork-assistant `smart_search_most_recent.json`](https://github.com/nazmulhasanrupom/upwork-assistant/blob/HEAD/tests/fixtures/upwork/smart_search_most_recent.json) (third-party).
- Field notes from live sessions: [Abialidr/NexusHq](https://github.com/Abialidr/NexusHq/blob/f11dca1c82d80aa25c33bb8d670bf898be5c3658/NexusHQ/docs/spike/upwork-findings.md), 2026-10-23; [automatable-skool `references/upwork.md`](https://github.com/automatable-skool/upwork-blueprint-day1/blob/f2c33e653c98b24bbfc137118a930a25b9e4a9fd/references/upwork.md), 2026-10-15. Both third-party.

| Field | In `get` | In search rows | Status |
|---|---|---|---|
| Title | `content.title` | `title` | Present |
| Full description | `content.description`, wrapped in `<untrusted_participant_content>` | `description_snippet`, truncated; `search` takes `include_full_details: true` (2026-11-12 schema) | Present |
| Budget, fixed | `contractTerms.fixedPriceContractTerms.amount.rawValue` | `budget` (e.g. `"$300.00"`) | Present |
| Budget, hourly range | `contractTerms.hourlyContractTerms.hourlyBudgetType`; min/max per NexusHq notes | `hourly_budget_type` (e.g. `"no rate stated"`) | Present; min/max seen only in third-party notes |
| Hours per week | `hourlyContractTerms.engagementType` (e.g. `PART_TIME`) | `engagement` (e.g. `"Less than 30 hrs/week"`) | Present as a label, not a number |
| Duration | not in either fixture | `duration` (e.g. `"Less than 1 month"`) | Present in search rows; unknown in `get` |
| Experience level | `contractTerms.experienceLevel` | `experience_level` | Present |
| Required skills | not in either fixture; category and subcategory are | `skills` | Present in search rows; unknown in `get` |
| Screening questions | `screening_questions[]`, each wrapped as untrusted | absent | Present in `get` |
| Client country | `clientCompanyPublic.country.name` | `client.country` | Present |
| Client city | one third-party note lists `clientCompanyPublic.city`; not in either fixture | absent | Unknown (third-party claim only) |
| Client timezone | `clientCompanyPublic.timezone` (e.g. `Asia/Dubai`) | absent; `timezone` is a filter | Present in `get` |
| Client spend | `client_record.spend_total` | `client.total_spent` | Present |
| Client hires | `client_record.jobs_with_hires`, `hire_rate_percent`, `contracts_total`, `contracts_active` | `client.total_hires` | Present |
| Client rating | `client_record.feedback_score`, `feedback_count`; `client_feedback.reviews[]` | `client.rating`, `total_reviews` | Present. The rating is the score freelancers gave the client (`client_rating_basis`). |
| Payment verified | not in either fixture | `client.verification_status` (`VERIFIED`) | Present in search rows; unknown in `get` |
| Proposal count | not in either fixture; `activityStat.jobActivity` has invites, interviews, hired, offered | `proposals_tier` (e.g. `"10 to 15"`) in `smart_search`; `proposal_count` in `search` per the 2026-08-27 description | Present in search rows; unknown in `get` |
| Connects price | `connects_cost`, with `connects_balance` | absent ("Search rows do not include `connects_cost`") | Present in `get` |
| Posted time | not in either fixture | `created_date`, `published_date` | Present in search rows; unknown in `get` |

Further fields in `get`: `preferred_qualifications` (minimum JSS, hours, English level, rising talent, portfolio, contractor type), `client_work_history` (at most 5 open and 5 closed contracts), `client_feedback`, `applied`, `can_apply`, `workFlowState.status`, `url`, and bid statistics (`bid_stats_available`; UpHunt reports these need Freelancer Plus).

Data-quality notes, all third-party: activity counts disagreed with the job page on four jobs, and the boost table lagged the website (UpHunt, [MCP limits](https://uphunt.io/blog/upwork-mcp-limits-100-connects-2026)). Descriptions often carry a screening instruction that no field shows, such as a required opening phrase ([automatable-skool notes](https://github.com/automatable-skool/upwork-blueprint-day1/blob/f2c33e653c98b24bbfc137118a930a25b9e4a9fd/references/upwork.md)).

## 4. Search

From the `find_jobs` schemas (third-party snapshots of 2026-08-27 and 2026-11-12) and Upwork's skills (confirmed).

- **`search` filters**:
  - text: `query` (whole posting, semantic expansion); `title` (title only, 1–3 words, ANDed; cannot be combined with `query` or `sort=relevance`)
  - classification: `skills` (1–5 Upwork names, ANDed), `category`, `subcategory`
  - terms: `job_type`, `experience_level`, `budget_min` / `budget_max` (fixed only), `rate_min` / `rate_max` (hourly, range overlap), `workload` (`full_time`, `part_time`, `as_needed`), `duration` (hourly only)
  - client: `verified_payment_only`, `client_hires_min` / `client_hires_max`, `location`, `timezone`, `previous_clients_only`
  - competition: `proposals_min` / `proposals_max`
  - one third-party skill also lists `upwork_now_only` ([suxrobGM/jobpilot](https://github.com/suxrobGM/jobpilot/blob/8c2028ccbe41738485571393daf96d5bde7728e2/plugin/skills/_shared/upwork-mcp.md))
- **Sort**: `recency`, `relevance`, `client_total_charge`, `client_rating`. Omitting `sort` gives newest first; a query-only search defaults to relevance (2026-11-12 schema). `search` has no date filter.
- **Profile matches**: `smart_search`. `mode` is `best_match` (default, ranked by fit) or `most_recent` (newest first, "already narrowed to this freelancer, so this is not the whole marketplace"). Date filters `days_posted`, `from_date`, `to_date` apply to `most_recent` only. It also takes `rate_min` / `rate_max`, `duration`, `location`, `timezone`, `verified_payment_only`, `previous_clients_only`. Upwork's skill says not to pass profile skills; the recommender already knows the profile.
- **Result size**: `limit` 1–10, default 10, hard maximum 10.
- **Pagination**: cursor-based. `search` returns `pageInfo.endCursor` / `pageInfo.hasNextPage`; `smart_search` returns `next_cursor` / `hasMore` and `total_matching`. Repeat the same filters with `cursor`. Each page counts as one request against the rate limit (Help Center, indexed only; see `upwork-rules.md` 5b).
- **Empty and partial results**: `empty_reason` (e.g. `no_personalization`, `account_restricted`), `filters_ignored`, `skills_filtered_client_side`. An upstream account restriction can show as an empty search. (Confirmed, plugin skill.)
- Third-party measurement: on a dense search ten newest results cover 8 to 16 hours ([automatable-skool notes](https://github.com/automatable-skool/upwork-blueprint-day1/blob/f2c33e653c98b24bbfc137118a930a25b9e4a9fd/references/upwork.md)).

## 5. Proposals

From Upwork's [`write-proposal`](https://github.com/upwork/upwork-agent-plugin/blob/7908a7e68f4a3c462b4eb5bc884ee69c82ecff59/skills/write-proposal/SKILL.md) and [`upwork-workflows`](https://github.com/upwork/upwork-agent-plugin/blob/7908a7e68f4a3c462b4eb5bc884ee69c82ecff59/skills/upwork-workflows/SKILL.md) skills (confirmed) unless marked.

- **Drafting**: the server writes no text. The agent writes the cover letter from the job and from profile evidence (`get_profile` `get` and `list_highlights`, or `get_agency` for an agency). "Draft" means a server-held preview of the submission. The tool enforces a maximum cover-letter length and reports it.
- **Before drafting**: check `list_freelancer_proposals` `invitations` and `list`. An existing invitation must be answered with `accept_invitation`; `create` on such a job fails upstream (third-party guides cite error `VJ-JA-10`).
- **Submission** is two calls:
  1. `manage_proposals` `create` with the numeric job id, cover letter, screening answers, `charged_amount` (the bid), attachments, and optional `boost_connects`. It returns a preview and submits nothing. The preview shows Connects required and balance, whether the account can apply, unmet preferred qualifications, required screening answers, competing bids when available, and boost data (`boost.suggested_bid`, `boost.recommendation`, `boost.reason`).
  2. `confirm_preview` with action `confirm`, the returned `preview_id` and `type`. The skill requires a separate explicit user approval before this call.
- **User confirmation**: write tools default to `always_ask`. `set_tool_permission` `always_allow` can relax this per tool, but "it never bypasses `confirm_preview`". The Help Center also says write actions are drafted first and need the user's explicit confirmation (indexed only; see `upwork-rules.md` 5b).
- **Connects**: spent as on the site; insufficient Connects fails the call and is retryable after topping up. A 100-Connects-per-24-hours ceiling on MCP proposals existed at launch; UpHunt reports it removed as of 2026-10-09 ([UpHunt](https://uphunt.io/blog/upwork-mcp-limits-100-connects-2026), third-party).
- **Boosting is exposed**: `boost_connects` on `create`, within the limits the preview states. Once submitted the boost bid "cannot be edited or withdrawn through this tool"; the stored bid is read back as `terms.connectsBid`.
- **Previews**: one pending preview per type; a second `create` supersedes it. UpHunt reports preview ids expire after 15 minutes (third-party).
- **Money and binding steps** never complete through the server. They return `status: action_required` and a `finalize_url` to open on Upwork.

## 6. Auth and connection

- **Transport: Streamable HTTP.**
  - The official MCP registry lists `com.upwork.mcp/upwork-mcp` v1.0.0 with remote `{"type": "streamable-http", "url": "https://mcp.upwork.com/mcp"}`, active since 2026-10-06. ([registry search](https://registry.modelcontextprotocol.io/v0/servers?search=upwork), confirmed.)
  - Upwork's plugin `mcp.json` declares the same type. ([mcp.json](https://github.com/upwork/upwork-agent-plugin/blob/7908a7e68f4a3c462b4eb5bc884ee69c82ecff59/mcp.json), confirmed.)
  - `GET /sse` and `/mcp/sse` return 404 (probed 2026-11-18). `POST /mcp` and `GET /mcp` without a token return `401` with `WWW-Authenticate: Bearer error="invalid_token" … resource_metadata="https://mcp.upwork.com/.well-known/oauth-protected-resource/mcp"`. (Confirmed.)
  - A third-party client reports answers come as JSON or SSE inside Streamable HTTP, with an `Mcp-Session-Id` header ([Code4Each-in docs](https://github.com/Code4Each-in/management/blob/HEAD/docs/upwork-opportunities.md)).
- **OAuth metadata** (confirmed, unauthenticated GET):
  - `https://mcp.upwork.com/.well-known/oauth-protected-resource` returns `{"resource":"https://mcp.upwork.com/mcp","authorization_servers":["https://mcp.upwork.com"],"bearer_methods_supported":["header"],"resource_name":"Upwork MCP"}`.
  - `https://mcp.upwork.com/.well-known/oauth-authorization-server`:
    - `authorization_endpoint` `https://www.upwork.com/ab/account-security/oauth2/authorize`
    - `token_endpoint` `https://www.upwork.com/api/v3/oauth2/token`
    - `revocation_endpoint` `https://www.upwork.com/api/v3/oauth2/token/revoke`
    - `registration_endpoint` `https://www.upwork.com/register`
    - `response_types_supported` `code`
    - `grant_types_supported` `authorization_code`, `refresh_token`, `client_credentials`
    - `token_endpoint_auth_methods_supported` includes `none`
    - `code_challenge_methods_supported` `S256`
    - `client_id_metadata_document_supported` `true`
    - no `scopes_supported`
  - `/.well-known/openid-configuration` returns 404.
- **Client registration** (all third-party):
  - Dynamic registration works with no API key or secret ([Code4Each-in docs](https://github.com/Code4Each-in/management/blob/HEAD/docs/upwork-opportunities.md)).
  - Redirect URIs are allowlisted: loopback (`localhost`, `127.0.0.1`) and a few client hosts (`claude.ai`, `cursor.com`, `chatgpt.com`) are accepted; others get `invalid_redirect_uri` ([UpHunt](https://uphunt.io/blog/upwork-mcp-job-discovery-gap-2026)).
  - A self-hosted client ID metadata document was refused ([Code4Each-in docs](https://github.com/Code4Each-in/management/blob/HEAD/docs/upwork-opportunities.md)).
  - Upwork grants the full scope set to the connection; read-only must be enforced by the client (same source).
- **Adding it to Claude Code** (confirmed against the [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)):
  - Command: `claude mcp add --transport http upwork https://mcp.upwork.com/mcp`. Add `--scope project` to write `.mcp.json`, or `--scope user` for all projects. Then run `/mcp` in a session to sign in through the browser.
  - `.mcp.json` entry:

    ```json
    {
      "mcpServers": {
        "upwork": {
          "type": "http",
          "url": "https://mcp.upwork.com/mcp"
        }
      }
    }
    ```

  - Alternative: Upwork's plugin, `/plugin marketplace add upwork/upwork-agent-plugin` then `/plugin install upwork-agent-plugin@upwork`. It bundles the server declaration and four skills. ([README](https://github.com/upwork/upwork-agent-plugin/blob/7908a7e68f4a3c462b4eb5bc884ee69c82ecff59/README.md), confirmed.)
- **Token lifetime**: access token 24 hours (`expires_in` 86400), opaque. Refresh token rotated on every refresh. Refresh-token lifetime is not stated by Upwork. ([Code4Each-in docs](https://github.com/Code4Each-in/management/blob/HEAD/docs/upwork-opportunities.md), third-party, measured 2026-10-09.) Upwork's older API docs give refresh tokens two weeks from last use; no source ties that to the MCP (search extract of [API authentication and security](https://support.upwork.com/hc/en-us/articles/115015933448-API-authentication-and-security), indexed only). Access can be revoked under Connected Apps in account settings (search extract, indexed only).
- **Account types**: `list_accounts` returns every account of the user, with role `CLIENT`, `TALENT` (freelancer) or `FL_AGENCY` (agency). "Agency shares the freelancer-side job and proposal tools but has its own agency profile, teams, and rooms tools", and reads Connects through `get_freelancer_financials`. (Confirmed, plugin skill.) A third-party client connected an agency (`FL_AGENCY`) account ([Code4Each-in docs](https://github.com/Code4Each-in/management/blob/HEAD/docs/upwork-opportunities.md)).
- Glama marks the connector unhealthy on 2026-11-18 because its test credentials failed; this says nothing about the server ([Glama listing](https://glama.ai/mcp/connectors/com.upwork.mcp/upwork-mcp-server), third-party).

## 7. Rate limits

Source: [Rate limits for Upwork MCP](https://support.upwork.com/hc/en-us/articles/56577997707923-Rate-limits-for-Upwork-MCP), indexed only (two search extracts on 2026-11-18, plus the extract in `upwork-rules.md` 5b).

| Category | Covers (as indexed) | Per minute | Per hour | Per day |
|---|---|---|---|---|
| Search and discovery | searching for jobs or talent, browsing job listings | 15 | 150 | 750 |
| Job posts, proposals, offers, invitations | posting jobs, submitting proposals, sending offers or invitations | 20 | 60 | 150 |
| Profile viewing | freelancer or company profiles | 5 | 75 | 250 |
| Other read-only | all other reads | 20 | 250 | 750 |
| Other create, update, delete | all other writes | 4 | 15 | 40 |

- Counted per Upwork account, per category; all three windows apply at once. Plan, earnings, spend and JSS do not change them. Upwork.com activity does not count. A rejected request does not count. Each page of results is one request.
- Over the limit: an error with a retry-after value (`retry_after_seconds` per the plugin skill, confirmed), no penalty. Sustained use far above the limits, or bypassing them, can lead to throttling, suspension or termination of MCP access.
- Which category `find_jobs` `get` falls in is not stated. "Browsing job listings" suggests search and discovery. Upwork's skill says "Marketplace searches, profile reads, and writes are metered more tightly than ordinary reads" (confirmed).
- Separate per-day caps exist on outbound messages and invitations: API & MCP Terms §7.3 (confirmed), and a "limited number of new connections per day" for client-initiated conversations (plugin `hire-on-upwork` skill, confirmed). No daily Connects cap remains (UpHunt, third-party).
- The `upwork.com/ai/mcp` page says only that the connector follows standard rate limits (search extract, indexed only).

## 8. Terms that constrain the integration

Read live from the Legal Center as served by Upwork's contract host ([vault.pactsafe.io Legal Center](https://vault.pactsafe.io/s/f89b37df-42d9-4971-bbcc-466469a68600/legal.html), confirmed): **API & MCP Terms of Use v2.5, effective 2026-11-06** (anchor `upwork.com/legal#apimcpterms`, the terms URL in Upwork's plugin manifest), and the **Integration Terms of Use**. This settles the live wording that `upwork-rules.md` open question 9 left as indexed only, for the API & MCP Terms.

- **Acceptance**: connecting to the MCP Server or calling a Tool accepts the API & MCP Terms (§1). A Developer Application includes any "MCP client, Agent, integration" the user builds or operates (§2). A local pipeline is one.
- **Retention, §8.6** (MCP outputs):
  - MCP tool outputs "are licensed solely for the authenticated Upwork User on whose behalf they are delivered".
  - In an AI application or other AI system: no longer than "reasonably necessary to complete the Upwork User's immediate task, and in no event longer than 30 days", unless Upwork consents in writing.
  - Copies "that you save outside an AI system (such as in a note, CRM, or accounting tool)" may be kept "only as long as you need them for the task for which you retrieved them"; "the 30-day limit does not apply to those copies".
  - "Your own notes and proposal text are not event payloads or MCP outputs".
  - No sharing beyond "the AI system you use for the task", and "you shall not add event payloads or MCP outputs to any AI knowledge base".
- **Caching, §8.3**: Upwork Content in general may be cached for at most 24 hours, with no re-fetching just to reset the timer; MCP outputs are governed by §8.6 instead.
- **Deletion, §8.7**: delete Upwork Content when the user asks, when the account closes, or "when the underlying data is no longer required for the documented purpose".
- **Continuous monitoring, §4.1**: search and browse authorize "only access reasonably necessary to perform a specific, documented, user-directed task and does not authorize activity designed to enumerate or continuously monitor Upwork's available content corpus". §3.5 excludes Bulk Access, whose definition (§2) includes "repeated, paginated, incremental, continuous" retrieval of a substantial portion of postings. One fetch per URL the user pasted is the user-directed case.
- **Intermediate copies, §3.3**: copies of Upwork Content only "as strictly necessary to perform an act expressly permitted by Section 4", each deleted "when it is no longer required for that purpose".
- **Minimum necessary, §4.2**: request, store and process "only the minimum Upwork Content and the minimum data fields … necessary for the Developer Application's documented purpose".
- **Personal use**: the Tools licence (§3.2) covers building and operating a Developer Application, or using the Tools to facilitate use of Upwork "by you or by Upwork Users on whose behalf you are authorized to act". It bars using the Tools "to build a service that competes with the Upwork marketplace". Permitted uses (§4.1) include searching and responding to postings, drafting and submitting proposals, and integrating Upwork data "into the Upwork User's own productivity … or workflow systems (subject to Section 8.6)". No MCP clause limits use to personal or non-commercial use. The "personal and internal use only" statement found earlier is about API keys (`upwork-rules.md` 5a).
- **AI use of the content**:
  - §5.3 bars using Upwork Content, "including job descriptions … MCP Server output", to "train, fine-tune, retrieval-augment, evaluate, benchmark, or otherwise improve any artificial intelligence or machine learning model".
  - Integration Terms §6.4 adds the AI provider's own terms on data received through an Integration.
- **Agent ranking, §5.9**: prohibits "an Agent independently selecting, ranking, scoring, or recommending among candidates, postings, proposals, or contracts using criteria the Agent itself determines". It allows retrieving content "based solely on search or filter criteria the Principal has specified", and "executing a specific action the Principal has directed with respect to a specific, Principal-identified … posting".
- **Attribution, §3.4 and §5.12(c)**: Upwork Content may be displayed and rearranged if Upwork-applied "attribution, AI-origin labels, or provenance headers" are kept intact, with "proper identification of Upwork ownership". §5.13 bars aggregating it with third-party content in a way that obscures Upwork as the source.
- **Non-official content, §5.2**: content obtained through scraping, browser plug-ins or interface extraction is "Non-Official Content" and may not be combined with Upwork Content.
- **AI disclosure, §9.7**: where an Agent generates content a user would take as human-written, disclose AI involvement as applicable law requires. §5.8(g) applies this to Agents.
- **Integration Terms**: §7.4 makes the user "solely responsible for instructions submitted through, and the configuration and access controls of, each MCP Client". §2.2 authorization lasts until the user disconnects or revokes access.

## Open questions only a signed-in session can settle

Check these once connected, with a freelancer account, through read-only calls.

1. `list_accounts`: which accounts and roles come back, and whether an agency account appears beside the freelancer one.
2. `tools/list` in full-list mode: the current tool count and names for a `TALENT` account. Do `confirm_preview`, `get_preview`, `search_tools`, `execute_tool` appear, and do `confirm_draft`, `get_draft`, `update_draft` still appear?
3. `get_tool_help` with `tool_name: "find_jobs"`: the full live schema of `get`, including any output-field documentation and whether `include_full_details` or other params exist on `get`.
4. `find_jobs` `get` on one real job URL, recording field names only:
   - whether `get` carries posted time, duration, skills, payment verification, proposal count or tier, and client city
   - hourly budget min and max field names
   - which `params.id` forms work: the `/jobs/~02…` URL, the same with `utm_*` query parameters, the `/freelance-jobs/apply/<slug>_~02…/` URL, the bare `~02…` ciphertext, the numeric id
5. Whether a `get` call shows in the rate-limit accounting as search and discovery or as another read (for example by reading the error when a limit is hit, without trying to hit it).
6. The token response: `expires_in`, whether a `refresh_token` is issued, and the `scope` string Claude Code receives.
7. Whether any Upwork-applied attribution, AI-origin label or provenance header appears in tool output (MCP `_meta`, response fields, or HTTP headers) that §3.4 and §5.12(c) require keeping.
8. The Help Center article "How to use Upwork with AI agents through MCP" and the rate-limit article on the live pages, to confirm the indexed wording and numbers above.

Questions for a person, not a session:

9. Is the local job record a copy "outside an AI system" under §8.6, so that the task-length rule applies and not the 30-day cap? The pipeline that writes it is Claude Code, and later skills read it back into a model.
10. Does reading a stored MCP output back into a model to triage or to write a Letter count as "retrieval-augment" under §5.3, or as the permitted use in §4.1(b)? Does scoring one Job the user pasted fall under the §5.9 ban on an Agent ranking or scoring "among … postings"?
