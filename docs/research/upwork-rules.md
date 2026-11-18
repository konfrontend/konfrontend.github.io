# Upwork rules for tooling between a new job posting and a sent proposal

Research notes, 2026-11-18. Question: what a freelancer may and may not do, under Upwork's own rules, with tooling that shortens the path from a new job posting to a sent proposal. Findings only; no recommendation on what to build.

## How the sources were read

- Rules come only from Upwork's own pages: the Legal Center (Terms of Use, API and MCP Terms of Use, Integration Terms), the Help Center (support.upwork.com), Upwork's developer docs, and Upwork press releases.
- Every upwork.com and support.upwork.com page answered automated fetches with a Cloudflare "verify you are human" challenge on 2026-11-18. The challenge was not solved. The text of those pages was read through search-engine extracts of the indexed pages. Section numbers and wording below are therefore as indexed, not as read live. Verify any clause on the live page before relying on it.
- Community forum threads (community.upwork.com, now redirecting to support.upwork.com) are cited only as user reports.
- Third-party sources appear only under option 7 and where practice goes beyond the written rules. Each is labelled **third-party**.

## Summary

| # | Option | Verdict | Deciding source |
|---|---|---|---|
| 1 | Browser extension (custom or Claude in Chrome) reading the rendered text of a job page the human opened | **Unclear**, with written enforcement risk | [Use bots and other automation properly](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly); [Guidelines for using Google Chrome extensions](https://support.upwork.com/hc/en-us/articles/17652357074451-Guidelines-for-using-Google-Chrome-extensions); [Terms of Use §3.5](https://www.upwork.com/legal) |
| 2 | Embedded app browser driven by the human, agent reads the page text | **Unclear**; **forbidden** once the agent navigates, clicks or refreshes | Same as option 1 |
| 3 | Automated discovery: polling search pages, scraping, RSS, unofficial endpoints | **Forbidden** (RSS no longer exists) | [Terms of Use §3.5](https://www.upwork.com/legal); [Use bots and other automation properly](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly); [RSS deprecation](https://support.upwork.com/hc/en-us/articles/52052528243731-RSS-deprecation) |
| 4 | Upwork's own alerts: saved searches, email and push notifications | **Allowed** (instant alerts need Freelancer Plus) | [How to get instant job alerts](https://support.upwork.com/hc/en-us/articles/36001273797907-How-to-get-instant-job-alerts) |
| 5a | Official Upwork API (GraphQL) | **Allowed with an approved key**; personal or internal use only | [How to request an API key from Upwork](https://support.upwork.com/hc/en-us/articles/115015857647-How-to-request-an-API-key-from-Upwork); [API and MCP Terms of Use](https://www.upwork.com/legal) |
| 5b | Upwork MCP server (launched 2026-08-10), job search and proposal drafting from an AI agent | **Allowed** for every freelancer, no key needed; **forbidden** to use it to continuously monitor postings | [How to use Upwork with AI agents through MCP](https://support.upwork.com/hc/en-us/articles/55446516654611-How-to-use-Upwork-with-AI-agents-through-MCP); [API and MCP Terms of Use §4](https://www.upwork.com/legal) |
| 6 | AI-written proposals | **Allowed**, unless the client restricts AI use | [Terms §3.2, misleading or fraudulent conduct](https://www.upwork.com/legal) |
| 7 | Third-party alert and auto-bid tools (GigRadar, Vollna, others) | **No tool found with confirmed Upwork approval**; scraping or auto-submitting ones are **forbidden** by the rules above | [Use bots and other automation properly](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly) |
| 8 | Connects, Boosted Proposals, other sanctioned ranking | **Allowed** | [How to boost your proposal](https://support.upwork.com/hc/en-us/articles/4406395531795-How-to-boost-your-proposal) |
| 9 | Conduct that gets an account restricted or blocked | Listed in the section below | [Upwork Trust and Safety](https://support.upwork.com/hc/en-us/articles/25205969832083-Upwork-Trust-and-Safety) |

## 1. Browser extension reading a job page the human opened

- The Help Center defines a bot as any script, program, browser extension or third-party service that automatically sends requests to Upwork, collects data, or acts faster or more often than a human could. [Use bots and other automation properly](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly)
- The same article says enforcement is sometimes triggered by browser-based tools such as extensions or add-ons that interact with Upwork. It advises disabling such extensions before using Upwork. It lists, among tools that can trigger flags, job alert or watcher tools, auto-refresh tools, page monitors, macro or RPA recorders and user-script managers. It says a tool built for Upwork is not thereby approved, and that Upwork makes no exceptions for tools that automate interactions with the site. Unapproved automation leads to a temporary restriction or a permanent block, depending on severity and repetition. (same source)
- The extension guidelines put responsibility on the user: the user must understand what data an extension collects, what it does with it, and how it interacts with the site and the account. Upwork does not vet or endorse extensions. An extension must not interfere with Upwork's technology or tamper with the site. Misuse can lead to suspension. [Guidelines for using Google Chrome extensions](https://support.upwork.com/hc/en-us/articles/17652357074451-Guidelines-for-using-Google-Chrome-extensions)
- Terms of Use §3.5, on other disallowed uses, as indexed: no robot, spider, scraper or similar tool without written permission; no copying, distributing or otherwise using information found on Upwork without consent; no accessing the services through any technology other than Upwork's interface. [Upwork Legal Center](https://www.upwork.com/legal)
- The API and MCP Terms §5.2, as indexed, ban content obtained through web-browser plug-ins and screen- or interface-based extraction applied to the Upwork interface, outside Upwork's Tools. That document governs Developer Applications, so whether it reaches a freelancer's personal extension is not stated. [Upwork Legal Center](https://www.upwork.com/legal)
- What the sources do not say: whether an extension that sends no requests of its own, acts only on a page the human loaded, and copies its visible text to the user's own machine counts as a "bot". The definition turns on sending requests, collecting data, or acting faster than a human. Reading one page the human opened sends no extra request, but it does collect data. §3.5's ban on copying information found on Upwork has no stated exception for the user's own use.
- Claude in Chrome specifically: no Upwork source names it or any agentic browser. Upwork's AI-agent support article says its narrow permission for agents to contact Support does not authorize other automated activity on Upwork. [Using an AI agent to contact Upwork Support](https://support.upwork.com/hc/en-us/articles/55751200524947-Using-an-AI-agent-to-contact-Upwork-Support)
- **Third-party, practice beyond the rules:** vendor blogs retell a November 2025 report of a freelancer restricted within hours for an extension, "Upwork Search Enhancements", that only added job-feed filters; the restriction email reportedly said detection was automated. Not confirmed from Upwork or the original post. [send.win blog](https://blog.send.win/upwork-account-suspended-for-no-reason-fix-it-fast/); [GigRadar blog](https://gigradar.io/blog/upwork-automation)

## 2. Embedded app browser the human drives, agent reads the page

- No Upwork source distinguishes an embedded browser from a desktop browser. The rules in option 1 apply to the tool by behaviour, not by where it runs. [Use bots and other automation properly](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly)
- If the agent navigates, clicks, paginates or reloads, it falls in the article's listed categories (macro or RPA recorders replaying clicks and searches, auto-refresh, page monitors). That is forbidden. If it only reads text the human loaded, the open point from option 1 applies.
- The "Verifying You Are Human" article names browser settings, extensions, VPNs and proxies as things that can trigger the human check. A non-standard embedded browser is not named. [Why am I seeing "Verifying You Are Human" message?](https://support.upwork.com/hc/en-us/articles/39548231990163-Why-am-I-seeing-Verifying-You-Are-Human-message)

## 3. Automated discovery of new postings

- Polling search pages and scraping: forbidden by Terms of Use §3.5 (robots, spiders, scrapers without written permission; copying information found on Upwork). [Upwork Legal Center](https://www.upwork.com/legal)
- The bots article lists page monitors, auto-refresh tools and job watchers that run searches among flagged tools. Even API key holders may not scrape public or private data. [Use bots and other automation properly](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly)
- The same article lists common causes of flags for API users: browser session cookies or OAuth tokens reused in a script, calling website pages instead of API endpoints, and background polling that looks like scraping. (same source)
- RSS (as of 2026-11-18): Upwork discontinued RSS feed support after 2024-08-20. [RSS deprecation](https://support.upwork.com/hc/en-us/articles/52052528243731-RSS-deprecation). The API docs mark the saved-search and RSS search options as no longer supported. [API Documentation](https://www.upwork.com/developer/documentation/graphql/api/docs/index.html)
- Unofficial endpoints: Terms §3.5 bars access through any technology other than Upwork's interface; the bots article flags calling website pages instead of approved API endpoints. Sanctioned machine access is the API or the MCP server (options 5a, 5b).
- Even through the sanctioned routes, the API and MCP Terms §4 limits search and browse to what a specific, documented, user-directed task needs. They exclude activity meant to enumerate or continuously monitor Upwork content. §3 excludes bulk access and systematic extraction. [Upwork Legal Center](https://www.upwork.com/legal)

## 4. Upwork's own alerts

- Instant job alerts (as of 2026-11-18) need Freelancer Plus and at least one proposal submitted to an active job. Alerts follow jobs similar to past proposals, plus saved searches and skill matches. Upwork says they are sent immediately after a similar job is posted. Delivery is by mobile push or email, set under the bell icon, Job alerts tab, Alert preferences, with filters for hourly or fixed-price and a minimum rate. [How to get instant job alerts](https://support.upwork.com/hc/en-us/articles/36001273797907-How-to-get-instant-job-alerts)
- Saved searches: up to 30, shown on the job feed. [How to search for jobs on Upwork](https://support.upwork.com/hc/en-us/articles/211063078-How-to-search-for-jobs-on-Upwork)
- Job Digest emails go automatically to Rising Talent and Top Rated holders, at no fixed interval; not every day or even every week. [How the Upwork job digest email works](https://support.upwork.com/hc/en-us/articles/219801168-How-the-Upwork-job-digest-email-works)
- Notification settings: the documented 15-minute default batching applies to message emails, not job alerts. No documented frequency setting for job alert emails was found. [How to change your Upwork email and notification settings](https://support.upwork.com/hc/en-us/articles/211067708-How-to-change-your-Upwork-email-and-notification-settings)
- Speed in practice: no Upwork source gives a measured delivery time. **Community user report:** one user testing saved searches after the RSS removal saw a new job appear after about five minutes. [Why is Upwork removing the RSS feature?](https://community.upwork.com/t5/Freelancers/Why-is-Upwork-removing-the-RSS-feature/m-p/1658313)
- Freelancer Plus also includes proposal insights and full Uma access, and 100 Connects a month. [What is Freelancer Plus?](https://support.upwork.com/hc/en-us/articles/211062888-What-is-Freelancer-Plus)

## 5a. Official Upwork API (GraphQL)

Who gets access (as of 2026-11-18):

- Clients and freelancers on any plan may request a key. Listed requirements: valid name and address, profile picture, verified identity, active verified payment method, and at least USD 25,000 in lifetime earnings, spend, or both. Agency earnings count when applying for the agency. [How to request an API key from Upwork](https://support.upwork.com/hc/en-us/articles/115015857647-How-to-request-an-API-key-from-Upwork)
- The developer docs, as indexed, add a Job Success Score of at least 90% for freelancers and agencies and an account in good standing. The Help Center article, as indexed, does not mention JSS. [API Documentation](https://www.upwork.com/developer/documentation/graphql/api/docs/index.html)
- The request must say how the API will be used (internal or public application, the requester's role, why a key is needed). It must not duplicate an approved key, and the application must not use Upwork's name, logo or brand assets. Review covers both the account and the stated use case against the Terms of Service. [How to request an API key from Upwork](https://support.upwork.com/hc/en-us/articles/115015857647-How-to-request-an-API-key-from-Upwork)

Refusals:

- The Help Center says most requests not approved lack required account requirements or application details. It says to check the decision email, fix gaps, and resubmit. No list of other refusal reasons was found. (same source)
- **Community user report:** a user who applied after the RSS removal reported no answer after more than six weeks. [Why is Upwork removing the RSS feature?](https://community.upwork.com/t5/Freelancers/Why-is-Upwork-removing-the-RSS-feature/m-p/1658313)

What the terms permit:

- The API is for personal and internal use only; commercial use is not supported. No sandbox or test accounts are offered. [How to request an API key from Upwork](https://support.upwork.com/hc/en-us/articles/115015857647-How-to-request-an-API-key-from-Upwork)
- Job search: `marketplaceJobPostingsSearch` needs the "Read marketplace Job Postings" scope. The older `marketplaceJobPostings` query is marked for removal. [API Documentation](https://www.upwork.com/developer/documentation/graphql/api/docs/index.html)
- API and MCP Terms, as indexed: permitted uses include letting Upwork users search, browse and respond to job postings (§4), but only for a specific, documented, user-directed task, never to enumerate or continuously monitor content. No bulk access or systematic extraction (§3). Request only the minimum data fields the documented purpose needs. Cache Upwork content for at most 24 hours, and do not re-fetch only to reset that timer. [Upwork Legal Center](https://www.upwork.com/legal)
- Rate limits: up to 10 requests per second per IP. [What are the API requests limits?](https://support.upwork.com/hc/en-us/articles/115015933428-What-are-the-API-requests-limits). The key request article, as indexed, also states a daily cap of 40,000 requests. [How to request an API key from Upwork](https://support.upwork.com/hc/en-us/articles/115015857647-How-to-request-an-API-key-from-Upwork)
- Even with a key, spamming proposals or invites and scraping data stay forbidden; a key used outside its approved scope can be suspended. [Use bots and other automation properly](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly)

## 5b. Upwork MCP server

- Launched 2026-08-10 for every client and freelancer, at no extra cost; standard fees still apply. It connects through Claude, ChatGPT, Cursor and other MCP clients. [Upwork Talent Is Now Everywhere AI Works](https://www.upwork.com/press/releases/upwork-talent-is-now-everywhere-ai-works)
- Hosted at `https://mcp.upwork.com/mcp`; the user signs in with OAuth in a browser. For freelancers the agent can search jobs by skill, category, budget or type, get profile-based matches, save favourites, and draft a proposal from the profile and the job. Submitting costs Connects as on the site. Write actions, including proposal submission, are drafted first and need the user's explicit confirmation. No API key application is mentioned. [How to use Upwork with AI agents through MCP](https://support.upwork.com/hc/en-us/articles/55446516654611-How-to-use-Upwork-with-AI-agents-through-MCP); [Upwork MCP](https://www.upwork.com/ai/mcp)
- MCP rate limits (as of 2026-11-18), per account and per category, same for every account regardless of plan, earnings or JSS: search and discovery 15/minute, 150/hour, 750/day; job posts, proposals, offers and invitations 20/minute, 60/hour, 150/day. Each page of results counts as one request. Hitting a limit returns `SENSITIVE_RATE_LIMIT_EXCEEDED` with a retry-after value and carries no penalty. Usage far above the limits, or attempts to bypass them, can lead to throttling, suspension or termination of MCP access. [Rate limits for Upwork MCP](https://support.upwork.com/hc/en-us/articles/56577997707923-Rate-limits-for-Upwork-MCP)
- MCP use is governed by the same API and MCP Terms (option 5a). That includes the §4 bar on continuous monitoring. It also bars keeping MCP outputs longer than the immediate task needs, and in no case beyond 30 days. [Upwork Legal Center](https://www.upwork.com/legal)
- The Integration Terms make the user responsible for complying with the AI provider's own terms and with applicable law, including AI disclosure obligations. Drafted content must be reviewed and approved by the user before submission. [Upwork Legal Center](https://www.upwork.com/legal)

## 6. AI-written proposals

- The Terms, §3.2 "Acting in a misleading or fraudulent way", as indexed, forbid using generative AI or other tools to substantially bolster proposals or work product when the client restricts such use or it violates a third party's rights. No general ban on AI-written proposals was found. [Upwork Legal Center](https://www.upwork.com/legal)
- The Help Center advises telling clients up front about generative AI use and checking that they have not prohibited it. This is advice, not a labelling rule. [How to control your AI preferences on Upwork](https://support.upwork.com/hc/en-us/articles/23808634769683-How-to-control-your-AI-preferences-on-Upwork)
- Upwork's own Uma drafts proposals. The drafts are fully editable, and Upwork suggests reviewing them before sending. Uma proposal drafts are not available to every freelancer. Some job posts ask for a video interview with Uma instead of a cover letter. [How to submit a proposal on Upwork](https://support.upwork.com/hc/en-us/articles/211062998-How-to-submit-a-proposal-on-Upwork); [How to use Uma as a freelancer](https://support.upwork.com/hc/en-us/articles/22983791592595-How-to-use-Uma-Upwork-s-Mindful-AI-as-a-freelancer); [Upwork Updates Fall 2024](https://www.upwork.com/blog/updates-fall-2024)
- No source says Upwork labels a proposal as AI-generated to the client. The API and MCP Terms, as indexed, require developers to disclose AI involvement where a reader would assume human authorship, and to keep AI-origin labels Upwork applies intact. That clause addresses Developer Applications, not a freelancer pasting text. [Upwork Legal Center](https://www.upwork.com/legal)

## 7. Third-party fast-alert and auto-bid tools

Upwork's position:

- A tool built for Upwork is not thereby allowed, approved or endorsed; no exceptions for tools that automate interactions. [Use bots and other automation properly](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly)
- Upwork does not vet or endorse extensions. It asks users to contact it if an extension claims Upwork affiliation. [Guidelines for using Google Chrome extensions](https://support.upwork.com/hc/en-us/articles/17652357074451-Guidelines-for-using-Google-Chrome-extensions)
- No Upwork page found lists any alert or bidding vendor as a partner or approved app.

Vendors (all **third-party**, self-descriptions, unverified):

- **GigRadar**: its automation page says it is an independent service with no affiliation with Upwork. It says public job feed data is scanned without logging in to any Upwork account. [gigradar.io/blog/upwork-automation](https://gigradar.io/blog/upwork-automation). Other GigRadar pages, as indexed, contradict this: the CRM page claims a connection through Upwork's official API, and a blog post describes proposals submitted through GigRadar's own Upwork Business Manager account invited into the agency. [GigRadar CRM](https://gigradar.io/gigradar-upwork-crm); [gigradar.io/blog/upwork-api](https://gigradar.io/blog/upwork-api)
- **Vollna**: footer disclaims endorsement by or affiliation with any freelance site. It does not say how it gets job data. It says it needs no Upwork login and claims alerts "the moment new work appears", with no latency figure. It delivers via Slack, Telegram, email and webhooks. [vollna.com](https://www.vollna.com/); [Vollna webhook docs](https://www.vollna.com/docs/notifications/webhooks)
- **Upwex**: Chrome extension with an AI proposal generator. No affiliation statement found. [Chrome Web Store listing](https://chromewebstore.google.com/detail/upwex-ai-tools-for-upwork/pmipgiahphnifpajbfnpahjfkanpfabf)
- **Vibeworker, UpHunt, UpNoti**: Telegram alert bots or extensions with job scoring; one offers one-tap proposal drafts. No affiliation claims or data-source statements found. [tryvibeworker.com comparison](https://tryvibeworker.com/blog/best-upwork-job-alert-tools-compared-2026)
- **Apify actors** sell Upwork job scraping outright, one branded a "Vollna Alternative". [apify.com/locaihost/upwork-jobs](https://apify.com/locaihost/upwork-jobs/api)
- Open-source monitors on GitHub poll RSS feeds that no longer exist (option 3). [github.com/vitalyliber/upwork_telegram_notifier](https://github.com/vitalyliber/upwork_telegram_notifier)

## 8. Connects, Boosted Proposals, sanctioned ranking

- Boosting adds Connects on top of a proposal's base cost to place it at the top of the client's list. It is a first-price auction for the top four places. The auction closes after seven days or at the first hire. [How to boost your proposal](https://support.upwork.com/hc/en-us/articles/4406395531795-How-to-boost-your-proposal)
- The boost bid is charged if the proposal is in the top four at close, or if the client interacts with it while boosted (opens, shortlists, messages, archives, declines, offers). Otherwise the boost bid is returned. The base proposal Connects are not refunded, except in narrow cases such as the client cancelling the job or Upwork removing it. [How will Connects refunds work?](https://support.upwork.com/hc/en-us/articles/40444940781459-How-will-Connects-refunds-work); [Connects charges, returns, refunds, and transaction history](https://support.upwork.com/hc/en-us/articles/57221525626643-Connects-charges-returns-refunds-and-transaction-history)
- A withdrawn boosted proposal, or one with an Uma interview, cannot be resubmitted; withdrawal refunds nothing. [How to withdraw and resubmit a proposal on Upwork](https://support.upwork.com/hc/en-us/articles/211060288-How-to-withdraw-and-resubmit-a-proposal-on-Upwork)
- Upwork runs occasional placebo auctions that rank all proposals organically, with no boost charge or label. [Boosted Proposal placebo auctions](https://support.upwork.com/hc/en-us/articles/11983621573395-Boosted-Proposal-placebo-auctions)
- Connects expire one year after issue. Misuse such as duplicate accounts, artificially inflated activity, or gaming the system can lead to restriction or a block. [About Connects](https://support.upwork.com/hc/en-us/articles/211062898-Understanding-and-using-Connects)
- Other sanctioned levers found: Freelancer Plus (instant alerts, proposal insights, 100 Connects a month) [What is Freelancer Plus?](https://support.upwork.com/hc/en-us/articles/211062888-What-is-Freelancer-Plus); [Proposal insights](https://support.upwork.com/hc/en-us/articles/34019683309587-Proposal-insights). A separate paid profile boost exists and was not examined. [How to boost your profile](https://support.upwork.com/hc/en-us/articles/20850487528723-How-to-boost-your-profile)

## 9. Account-level risks

- Enforcement tiers: education, restriction (log in and finish current work, but no new proposals, job posts or contracts), and a permanent block for very serious or repeated violations. [Upwork Trust and Safety](https://support.upwork.com/hc/en-us/articles/25205969832083-Upwork-Trust-and-Safety)
- Unapproved automation, including browser extensions: temporary restriction or permanent block. Upwork's systems detect it automatically, so reusing the same tool after a suspension brings another. [Use bots and other automation properly](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly)
- Spamming proposals or invites: forbidden, even with an API key (same source). Spamming is against the Terms; clients can flag cover letters as spam, and Upwork acts on a pattern. [How to block spam proposals](https://support.upwork.com/hc/en-us/articles/211063298-How-to-block-spam-proposals)
- Copying content off-platform: Terms §3.5 bars copying, distributing or using information found on Upwork without consent. No Help Center article was found that addresses copying a job post into a personal tool. [Upwork Legal Center](https://www.upwork.com/legal)
- Taking contact or payment off-platform before a contract: circumvention, against the Terms. [Circumvention, and why it's against the rules](https://support.upwork.com/hc/en-us/articles/360052511133-Circumvention-and-why-it-s-against-the-rules)
- Misleading conduct includes undisclosed AI use where the client restricts it (option 6). [Upwork Legal Center](https://www.upwork.com/legal)
- MCP misuse: sustained use far above the limits, or bypassing them, risks MCP access, per the MCP rate-limit article. [Rate limits for Upwork MCP](https://support.upwork.com/hc/en-us/articles/56577997707923-Rate-limits-for-Upwork-MCP)
- Appeals succeed mainly on a mistake or new material information. Opening a new account after a suspension is not allowed. [Appealing an account suspension](https://support.upwork.com/hc/en-us/articles/17989816008339--Appealing-an-account-suspension); [Suspended Freelancer or Client FAQ](https://support.upwork.com/hc/en-us/articles/38825014917907-Suspended-Freelancer-or-Client-Frequently-Asked-Questions)
- The Account Health Hub shows what is restricted, why, and how to fix it. [Inside Upwork's new Account Health Hub](https://www.upwork.com/blog/transparency-you-can-see-inside-upworks-new-account-health-hub)

## Open questions the sources do not settle

1. Does a read-only extension or embedded-browser agent count as a "bot"? It sends no requests and only copies the text of a page the human opened to the user's own machine. The bot definition covers tools that "collect data"; §3.5 bars copying information without consent; neither names a personal-use exception.
2. Does API and MCP Terms §5.2 (no browser plug-ins or interface extraction) bind a freelancer's own tool, or only Developer Applications?
3. Does "continuously monitor" in API and MCP Terms §4 cover a freelancer's agent that runs the same saved job search through the MCP server every few minutes? Polling volume could sit within the published rate limits and still be the monitoring the clause excludes.
4. May a local tool read Upwork's job alert emails in the user's own inbox and extract the posting? No source addresses alert emails as input to automation.
5. How fast do instant job alerts and saved-search feeds actually arrive? Upwork says "immediately" and gives no figure; the only figure found is a community report of about five minutes.
6. Is a 90% JSS an API key requirement? The developer docs and the Help Center differ as indexed. Refusal reasons beyond "missing requirements or details" are not published.
7. Does Upwork ever show clients that a proposal was drafted with AI (Uma or otherwise)? Nothing found either way.
8. What exactly triggers automated extension detection? Upwork does not publish its methods; vendor claims about behavioural signals are unverified.
9. The exact live wording and numbering of Terms §3.2, §3.5 and API and MCP Terms §3, §4, §5.2. All were read from search-engine extracts, because upwork.com served a human-verification challenge to automated fetches on 2026-11-18.
