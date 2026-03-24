# discord-security-viz

security audit dashboard for discord servers. loads json dumps of server infrastructure and maps out attack surfaces, privilege escalation paths, and permission misconfigurations.

discord's built-in tools show one role at a time with no export. audit bots spit out text. permission calculators give you an integer. this tool shows you the actual graph of who-can-do-what-to-where, interactively.

## what's in here

**DiscordSecurityVisualizer.jsx** - the whole app. single react component, ~4.4k lines. drop it into any react project with d3/lodash/recharts/lucide-react and it works.

**sample_dump.template.json** - schema reference showing the expected json format. generate your own dump matching this schema however you want (bot, script, manual export, etc).

## features

- force-directed escalation graph that traces MANAGE_ROLES chains and correctly handles managed (bot) roles
- canvas permission network with natural clustering, spread control, hover-to-highlight
- member threat map showing who can ban/kick/nuke/webhook as a directed graph with action nodes
- 109-vector threat scorecard covering webhooks, automod bypass, selfbot capabilities, overwrite persistence, audit log blind spots, and more
- simulation engine: "what if this account is compromised" with rate-limit-accurate nuke timeline, selfbot recon assessment, webhook leak impact
- permission calculator that walks discord's exact resolution algorithm step by step for any member+channel pair
- stale overwrite detection (user overwrites targeting IDs not in the member list)
- multi-dump diff, role hierarchy visualization, channel overwrite map, report export

all graph views have zoom/pan/drag, live spread slider, label size control, and auto-fit on load.

## input format

the app expects a json file matching the schema in `sample_dump.template.json`. the key fields are `_meta`, `guild`, `summary`, `security_analysis`, `roles`, `channels`, `members`, and `bots`. how you generate this json is up to you, the visualizer just reads whatever you feed it.

## running it

```
npm create vite@latest app -- --template react
cd app && npm install d3 lodash lucide-react recharts
```

copy `DiscordSecurityVisualizer.jsx` to `src/`, import it in `App.jsx`, `npm run dev`.

## tech

- single jsx file, default export
- canvas for large graphs, svg for smaller ones
- d3-force with live charge control and auto-fit zoom
- everything runs client-side, nothing phones home
- tested with 945kb dumps (330 channels, 247 roles, 58 cached members)

# License
MIT
