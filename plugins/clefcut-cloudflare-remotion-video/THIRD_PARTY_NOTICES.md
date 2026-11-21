# Third-Party Notices

This plugin is `clefcut-cloudflare-remotion-video`, maintained by Claude Skills
Maintainers and licensed under the MIT License.

## SageCut (MIT)

The QA design adapted here — the layered cost model (measure every frame, model
reads, selected-frame critics, open-a-frame-only-on-disagreement), the gate and
sweep question sets, the positive-control method, the escalation rules, and the
critic rubric — is derived from SageCut by Levanto Labs.

- Source: https://github.com/levantolabs/sagecut-release
- Copyright (c) 2026 Levanto Labs
- License: MIT

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

SageCut's original design routes model reads through the Sage API. This plugin
replaces that path with Cloudflare Workers AI (CLEF and CLAIRIC models) and
keeps free local OCR as a user-selectable engine. SageCut itself is not bundled
with and is not required by this plugin.

## ffmpeg-skill (MIT)

Four ideas in this plugin are adapted from ffmpeg-skill by kajisho5: the
safe-zone overlay frames (`frames --safe` — per-platform UI occlusion zones
drawn as translucent boxes over test-width frames), the ink check (`check`'s
"almost nothing drawn" finding — median luma plus the fraction of pixels
deviating from it), the before/after side-by-side compare image (`compare`),
and the five-part report contract with its "pixels were not inspected" honesty
line (Done / Steps / Check / Look / Notes). The implementations here are this
plugin's own; the upstream ideas are credited.

- Source: https://github.com/kajisho5/ffmpeg-skill
- License: MIT

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

ffmpeg-skill itself is not bundled with and is not required by this plugin.

## tesseract.js (Apache-2.0)

Local OCR in this plugin is performed by tesseract.js when the user chooses the
free local text engine (`npm i -D tesseract.js`), or by the system `tesseract`
binary when installed. Neither is bundled with this plugin; both remain optional
user-installed runtimes.

- Project: https://github.com/naptha/tesseract.js
- License: Apache License 2.0 — https://www.apache.org/licenses/LICENSE-2.0

## Cloudflare documentation

Technical claims about CLEF, CLAIRIC, Workers AI, AI Gateway, and the Cloudflare
MCP servers were verified against Cloudflare's public documentation
(https://developers.cloudflare.com/) as of 2026-10-20. Cloudflare's documentation
is cited as a fact source only; no Cloudflare documentation text is reproduced
wholesale in this plugin. Product names are trademarks of Cloudflare, Inc.
