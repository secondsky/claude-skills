# Third-Party Notices

This plugin is `clefcut-cloudflare-video`, maintained by Claude Skills
Maintainers and licensed under the MIT License.

Design ideas are credited below to their sources. None of these projects is
bundled with or required by this plugin; what is adapted is the approach,
not the code. Licenses were checked against the linked repositories on
2026-10-20.

## SageCut by Levanto Labs (MIT)

The free-first pipeline philosophy — measure everything locally for free,
spend model calls only on the few images that carry a decision, keep the
agent's eyes rare — reaches this plugin through our sibling
`clefcut-cloudflare-remotion-video`, whose QA design is adapted from
SageCut.

- Source: https://github.com/levantolabs/sagecut-release
- Copyright (c) 2026 Levanto Labs
- License: MIT — verified against the repository on 2026-10-20

## kajisho5/ffmpeg-skill (MIT)

The cut-execution backbone: lossless `-c copy` by default with a keyframe
tolerance, automatic upgrade to a frame-accurate re-encode when the snap
exceeds it, VFR sources forcing accurate mode, and reporting
`duration_error_ms` on every cut so a caller never has to trust "it probably
cut where I asked" on faith.

- Source: https://github.com/kajisho5/ffmpeg-skill
- License: MIT — verified against the repository on 2026-10-20

## melvynx/video-agent-skills (MIT)

The clip-scoring rubric: five criteria scored 0–2 (opens cold, one complete
idea, ends finished, no outside context, visual energy/length) with a
keep-threshold of 7/10.

- Source: https://github.com/melvynx/video-agent-skills
- License: MIT — verified against the repository on 2026-10-20

## clueso-ai/skills (Apache-2.0)

The candidate archetypes (strong hook or bold claim, concrete demo, striking
stat or quote, before/after, sharp Q&A) and the self-containment criteria
("a complete thought with zero context"; open on real content within the
first second; split at sentence or breath boundaries, never mid-action).

- Source: https://github.com/clueso-ai/skills
- License: Apache License 2.0 — verified against the repository on
  2026-10-20 — https://www.apache.org/licenses/LICENSE-2.0

## dkyazzentwatwa/vid-clipper (license not verified)

The clips JSON contract idea: a plan file holding one record per clip
(slug, start, end, variants, platforms) that the cutting step consumes.
Adapted as schema inspiration only; no code from that repository is used.

- Source: https://github.com/dkyazzentwatwa/vid-clipper
- License: not verified — no LICENSE file or license badge was visible in
  the repository when checked on 2026-10-20. The README states only
  "Open source - feel free to use, modify, and distribute." The idea is
  credited here; nothing from the repository is reproduced.

## eachlabs/skills (MIT)

The genre-to-duration table that sets the `segments --min/--max` bounds
per genre (gaming, sports, podcasts, webinars, meetings), adapted in the
clip-selection reference.

- Source: https://github.com/eachlabs/skills
- License: MIT — the repository README states "MIT" (checked on
  2026-10-20); no separate LICENSE file was visible in the repository
  file listing, so the license is verified via the README statement only.

## social-media-skills/skills (MIT)

The three-question human gate applied before any clip is cut (stands on
its own / represents the speaker fairly / serves the audience), adapted
from the opus-clip skill of that collection into the clip-selection
reference.

- Source: https://github.com/social-media-skills/skills
- License: MIT — verified against the repository on 2026-10-20 (MIT
  license file listed in the repository; the README attributes it to the
  team behind WoopSocial).

## browser-use/video-use (MIT)

The self-eval rules adopted for cut verification: 30 ms audio fades at
segment boundaries, and reviewing ±1.5 s around every cut boundary for
visual jumps and waveform spikes.

- Source: https://github.com/browser-use/video-use
- License: MIT — verified against the repository on 2026-10-20

## MIT License

The MIT-licensed sources listed above (SageCut, kajisho5/ffmpeg-skill,
melvynx/video-agent-skills, eachlabs/skills, social-media-skills/skills,
browser-use/video-use) are covered by the following license text:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## tesseract.js (Apache-2.0)

Local OCR in this plugin is performed by tesseract.js when the user chooses
the free local text engine (`npm i -D tesseract.js`), or by the system
`tesseract` binary when installed. Neither is bundled with this plugin; both
remain optional user-installed runtimes.

- Project: https://github.com/naptha/tesseract.js
- License: Apache License 2.0 — https://www.apache.org/licenses/LICENSE-2.0

## Cloudflare documentation

Technical claims about CLEF, CLAIRIC, Workers AI, AI Gateway, and the
Cloudflare MCP servers were verified against Cloudflare's public
documentation (https://developers.cloudflare.com/) as of 2026-10-20.
Cloudflare's documentation is cited as a fact source only; no Cloudflare
documentation text is reproduced wholesale in this plugin. Product names are
trademarks of Cloudflare, Inc.
