# Platform specs and export recipes

The verified table for the platforms this skill names, the open-list rule,
safe zones, and the ffmpeg recipes `export` runs. Every fact carries its
mark: **[VERIFIED]** = read from the cited official page during research
(2026-10-20); **[VERIFIED—excerpt]** = verified via an official-page
excerpt (archive/cache copy) that is not re-verifiable live today
(JS-rendered help centers, 403s); **[UNVERIFIED—community]** = widely
reported but not re-verifiable from an official page. Hedge
community-measured facts when precision matters; check the platform's own
help pages.

## The open-list rule

This skill targets YouTube, YouTube Shorts, TikTok, Instagram Reels, X
(Twitter), and other creator video platforms — an OPEN list, never a closed
one. Any platform not in the table below uses the GENERIC CREATOR PLATFORM
profile row. Never name or imply a fixed set of supported platforms, and
never guess a spec the table does not carry.

## Specs table

| Platform | Aspect | Duration | Codec / container | Notes |
|---|---|---|---|---|
| YouTube (long-form) | Any accepted; 16:9 standard [VERIFIED] | 15 min unverified accounts; cap "256 GB or 12 hours" [VERIFIED] | MP4; H.264 High Profile, closed GOP = half frame rate; AAC-LC 48 kHz; moov atom at front (Fast Start) [VERIFIED] | 1080p SDR 8 Mbps @24–30 fps, 12 Mbps @60 fps [VERIFIED]; auto-captions on upload [VERIFIED] |
| YouTube Shorts | "Vertical videos" [VERIFIED] | Up to 3 min [VERIFIED] | Max 1080p [VERIFIED] | 9:16 1080x1920 recommended [UNVERIFIED—community]; keep text out of top ~10% and bottom ~30% [UNVERIFIED—community] |
| TikTok | 9:16 1080x1920 recommended [UNVERIFIED—community] | Up to 10 min standard [UNVERIFIED—community] | MP4/MOV H.264 + AAC [UNVERIFIED—community] | 1080p recommended (4K gets compressed to 1080p) [UNVERIFIED—community]; safe zones (community-measured) ~130 px top, ~484 px bottom, ~140 px right; in-app auto-captions [UNVERIFIED—community] |
| Instagram Reels | 1.91:1–9:16 accepted, 9:16 recommended [VERIFIED—excerpt] | Up to 3 min standard [UNVERIFIED—community] | MP4/MOV ~4 GB max [UNVERIFIED—community] | Min 30 FPS, min ~720p [VERIFIED—excerpt]; ADS rule: leave bottom 40% free of text/logos [VERIFIED—excerpt] — organic overlays are community-measured |
| X (Twitter) | 16:9 recommended; 1:1 and 9:16 accepted [UNVERIFIED—community] | Free: 140 s / ~512 MB [UNVERIFIED—community]; Premium: ≤4 h, ≤16 GB, >2 h must be 720p [VERIFIED—excerpt] | 1080p max, 40 fps max [UNVERIFIED—community] | No auto-captions — burned-in captions are the only reliable route [UNVERIFIED—absence] |
| GENERIC CREATOR PLATFORM | 9:16 1080x1920 | ≤60–90 s (≤140 s if the X free tier matters) | H.264 + AAC in MP4 with `+faststart`, even (÷2) dimensions | Keep critical content out of top ~15% / bottom ~30% / right ~10%; center of frame is safest |

H.264 + AAC + faststart in a 9:16 safe-middle layout passes every platform
above (synthesis; individual facts carry their own marks).

## Duration warnings `export` actually emits

`export` exits 1 whenever it emits a platform warning. The thresholds and
hedges, per platform:

- `shorts`: over 180 s — "exceeds the 3-minute YouTube Shorts cap"
  (verified cap).
- `tiktok`: from 570 s inclusive — "may exceed community-reported TikTok
  upload limits" (community-measured, unverified; standard uploads allow
  up to ~10 min, so the tool only warns from 570 s).
- `reels`: over 180 s — "may exceed the community-reported 3-minute Reels
  limit" (unverified).
- `x`: over 140 s — "may exceed the community-reported 140s X free-tier
  limit" (unverified; Premium allows up to 4 h).
- `creator`: over 90 s — generic 60–90 s guidance for the generic profile.
- `youtube`: no duration warning.
- Vertical platforms also warn when the output is not 9:16.

## What `check` verifies

`clipcut check <file> --platform <id>` reads the SAME single-source-of-truth
table the export warnings come from (the script's `PLATFORM_SPECS`), so the
numbers and honesty marks below are the same ones above. Rows and their
classification:

| Row | Kind | PASS when | Notes |
|---|---|---|---|
| duration | judgement | within the platform cap | shorts ≤180 s (verified); tiktok ≤~600 s (community; the 570–600 s band is a WARN zone); reels ≤180 s (community); x ≤140 s free tier (community; Premium allows up to 4 h, verified-excerpt); creator ≤90 s (guidance); youtube no practical cap (256 GB / 12 h verified account cap) |
| aspect | judgement | 9:16 for shorts/tiktok/reels/creator; 16:9, 1:1 or 9:16 for youtube/x | 0.02 ratio tolerance; fix names `clipcut export <file> --platform <id> --variant 9x16-crop` |
| resolution | format | width and height divisible by 2 | H.264 4:2:0 needs even numbers |
| fps | format | constant frame rate | VFR is a WARN (compatibility hazard), not a FAIL |
| codec / pix_fmt | format | h264 + yuv420p | the universal baseline every platform row shares |
| audio / sample rate | format | AAC present; 48000 Hz (44100 widely accepted) | no audio stream = WARN "could not measure", not a FAIL |
| faststart | format | moov box before mdat (box walk) | fix: `clipcut export <file> --platform <id> --variant original` |
| loudness | judgement | within 6 LU of −14 LUFS and TP ≤ −1 dBTP | measure-only I/TP — no platform documents −14; fix: `--loudnorm` |
| silent audio | format | max level above −80 dBFS | digital silence is a dead track, a defect |
| size | format | under the table's cap where one exists | reels ~4 GiB, x ~512 MiB free tier (both community); WARN only |

Judgement rows (duration, aspect, loudness) FAIL only with `--platform`;
without it they are evaluated against the generic creator profile and
downgrade to WARN, while format rows still enforce. Any FAIL exits 1.
One more honesty rule: a duration cap the platform table itself marks
**community or guidance is reported loudly (WARN, "reported, not enforced")
even with `--platform`** — only verified caps (e.g. the Shorts 180 s limit)
hard-FAIL. Unverified numbers never block delivery on their own.
Unmeasurable facts (probe failure, no audio stream, silent track) are WARN
"could not measure" — never PASS.

## Safe zones (9:16, 1080x1920)

```
+------------------------------+
|  top ~15% (~288px) keep clear|   headers, usernames, platform chrome
|------------------------------|
|                              |
|                              |
|      SAFE MIDDLE             |   faces, text, action live here
|      (~55% of height usable, |
|      ~90% of width)          |
|                              |
|------------------------------|
|  bottom ~30% (~576px)        |   captions, buttons, CTA rails
|  keep clear                  |
+------------------------------+
  right ~10% (~108px) also keep clear (icon rail)
```

By the diagram's own numbers on 1080x1920: 288 px top + 576 px bottom +
108 px right stay clear, leaving 1056 of 1920 px of usable height (≈55%)
and 972 of 1080 px of usable width (≈90%). The percentages are the
generic-profile synthesis; TikTok's community-measured numbers (top
~130 px, bottom ~484 px, right ~140 px) are stricter on the bottom. When a
platform's exact overlay layout matters, treat these as a floor and check
the platform's own current help pages.

## Export recipes

The recipes `export` builds on (source 1080p H.264/AAC; example 00:12:34 =
754 s, length 46 s). CRF 18 / preset medium for finals; veryfast for
intermediates.

```bash
# (a) Accurate re-encoded 16:9 cut (-ss before -i + re-encode = frame-accurate)
ffmpeg -ss 00:12:34 -i input.mp4 -t 46 -c:v libx264 -crf 18 -preset medium \
  -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart clip_16x9.mp4

# (b) Keyframe-aligned lossless cut (what `cut` tries first within tolerance)
ffmpeg -ss 00:12:34 -i input.mp4 -t 46 -c copy -avoid_negative_ts make_zero clip_copy.mp4

# (c) 9:16 bounded crop (what `export --variant 9x16-crop` runs — ANY aspect fills 1080x1920)
ffmpeg -ss 00:12:34 -i input.mp4 -t 46 \
  -vf "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=1080:1920,setsar=1" \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k \
  -movflags +faststart clip_9x16-crop.mp4

# (d) 9:16 blur-pad (original sits full-width over a blurred fill)
ffmpeg -ss 00:12:34 -i input.mp4 -t 46 -filter_complex \
  "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1" \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k \
  -movflags +faststart clip_9x16-blur.mp4
```

Supporting maps and fixes the pipeline uses:

```bash
# Scene scores (per-frame lavfi.scene_score on stderr)
ffmpeg -i input.mp4 -an -vf "select='gte(scene,0)',metadata=print" -f null -

# Silence map (silence_start/end/duration on stderr)
ffmpeg -i input.mp4 -vn -af silencedetect=noise=-35dB:d=0.5 -f null -

# Keyframe timestamps (K = keyframe packets)
ffprobe -select_streams v -show_packets -show_entries packet=pts_time,flags input.mp4 | grep K

# Loudness, two passes: measure, then apply with linear=true
ffmpeg -i input.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null -
ffmpeg -i input.mp4 -af \
  "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=..:measured_TP=..:measured_LRA=..:measured_thresh=..:linear=true" \
  -c:v libx264 -crf 18 -c:a aac -movflags +faststart out.mp4

# Contact sheet (1 fps grid)
ffmpeg -i in.mp4 -vf "fps=1,scale=160:-1,tile=10x5" sheet.png
```

Notes on the recipes:

- `+faststart` moves the index (moov atom) to the front — required by
  YouTube's own recommendation and harmless everywhere else [VERIFIED].
- Odd dimensions fail libx264 4:2:0 encoding — always `-2` on the computed
  side (`scale=1080:-2`).
- loudnorm DEFAULTS are broadcast levels (I=-24, TP=-2, LRA=7); -14/-1.5 is
  a web target the caller sets, and the two-pass `measured_*` +
  `linear=true` form avoids the dynamic mode's resampling behavior.
- The bounded 9:16 crop (`min`/`max` on both dimensions) never exceeds the
  frame, so ANY source aspect — landscape, square, portrait — fills
  1080x1920. Landscape 16:9 sources still discard most of the width; a
  portrait taller than 9:16 crops vertically (top and bottom). If the
  speaker or subject is not near frame center, prefer the blur-pad variant
  and say so before editing.
- 9x16-blur centers the fitted foreground over a blurred cover; a source
  taller than 9:16 gets a warning that vertical foreground content is
  cropped.

## Loudness reality

YouTube demonstrably turns down material above roughly -14 LUFS
(attenuation-only, no boost) — community-measured repeatedly; no live
official page states the number. TikTok, Instagram, and X normalize with
unpublished targets. Practical rule: master clips to about -14 LUFS with
true peak at or below -1.5 dBTP (loudnorm two-pass), and expect every
platform to turn loud clips down, never up.

## Known limitation

This skill does NO speech-to-text. The text it "sees" comes from OCR of
burned-in on-screen text only. Platforms' auto-captions partially cover
accessibility where they exist (YouTube's is documented); burned-in caption
styling is an aesthetic choice, not something this skill produces.
