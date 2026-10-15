# GroupChat v2 — status pengerjaan (SELESAI 2026-10-14)

Spesifikasi mengikat: `docs/GROUPCHAT-V2.md`.

## Status
- [x] Implementasi backend, panel chat, halaman admin `/admin/chat`.
- [x] Review 3 lensa (aturan/keamanan backend, kontrak FE↔BE, bug frontend) — 19 temuan baru + 5 temuan lama, tidak ada yang kritis.
- [x] Semua temuan diperbaiki (8 backend, 15+3 frontend); `gofmt`/`go vet`/`go test` & `next lint` bersih.
- [x] Build Docker api+web, migrasi `0005_group_chat_v2` diterapkan.
- [x] Uji E2E API (35 pemeriksaan lolos) & UI (peserta/admin, balas, tag, reaksi, tutup grup, halaman pengaturan, mobile). Data uji dibersihkan, pengaturan kembali default.

Catatan: temuan di bawah ini adalah catatan historis dan SUDAH diperbaiki.

## Hasil implementasi (laporan agent)
### File
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\api\internal\db\migrations\0005_group_chat_v2.up.sql (new)
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\api\internal\db\migrations\0005_group_chat_v2.down.sql (new)
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\api\internal\app\chat_settings.go (new)
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\api\internal\app\chat_interactions.go (new)
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\api\internal\app\chat_v2_test.go (new)
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\api\internal\app\chat_handlers.go (modified)
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\api\internal\app\server.go (modified: route registration only)

I built the GroupChat v2 backend to match docs/GROUPCHAT-V2.md. gofmt, go vet and go test are all clean. I did not change profanity.go or cmd/api/main.go: main.go already starts the cleanup job, which now reads the chat settings each run.

**Database (migration 0005_group_chat_v2)**
- chat_messages gets reply_to (FK to itself, ON DELETE SET NULL), mentions (UUID[], default '{}'), pinned_at and pinned_by (FK to users, ON DELETE SET NULL).
- Indexes: the partial index on pinned_at from the spec, plus a partial index on reply_to so the cleanup job's ON DELETE SET NULL stays fast.
- New table chat_reactions(message_id, user_id, emoji VARCHAR(32), created_at) with PK(message_id, user_id), cascading deletes, and an index on user_id.
- The down migration reverses all of it and deletes the 'chat_settings' row.

**Settings (chat_settings.go)**
- ChatSettings and ChatAttachSettings use exactly the spec's JSON tags. DefaultChatSettings() has everything on and retention 7 days.
- Stored settings are unmarshalled on top of the defaults, so missing keys keep their default.
- validate(): retention_days outside 1–90 returns 422 with fields.retention_days.
- chatConfigFor() builds the public config. For an admin it returns everything true plus "group" with the real enabled and peserta_can_send values. For a peserta it returns the settings values, with can_send = enabled && peserta_can_send.
- chatAccess() returns 403 CHAT_DISABLED to a peserta when the chat is off; an admin always passes. chatFeatureOff() returns 403 CHAT_FEATURE_DISABLED.
- GET /admin/chat/settings returns settings plus stats from one query (messages, starred, pinned, files, reactions, members_7d), counting only messages that are not deleted.
- PUT /admin/chat/settings validates, saves the row, writes logActivity("groupchat.pengaturan") and returns {settings}.

**Message shape (chat_handlers.go)**
- ChatMessage has every spec field: reply_to, mentions, reactions, pinned, pinned_at, pinned_by_name.
- reply_to comes from a LEFT JOIN, with the body cut to 120 characters. If the quoted message was deleted, deleted=true and body="".
- Every query loads a page of messages with one main query plus two batch queries (reactions and mention names), so there is no N+1. Reactions are grouped by emoji in order of the first reaction.
- Deleted messages always return reactions=[], mentions=[], file=null and pinned=false.

**Existing endpoints, updated**
- GET /chat/messages: now blocks a disabled peserta, and adds pinned (up to 3, newest pin first) and config. retention_days now comes from the settings.
- GET /chat/sync: same additions. purge_before is null when auto_delete is false.
- POST /chat/messages, in this order:
  - CHAT_DISABLED, then CHAT_CLOSED.
  - CHAT_FEATURE_DISABLED for a reply when replies are off, or for an attachment type that is off ("Mengirim {gambar|video|audio|dokumen} …").
  - Length and empty-message checks, then the link rule: 422 fields.body.
  - reply_to must exist and not be deleted, else 422 fields.reply_to.
  - Mentions are parsed (valid, unique, max 10), kept only for existing non-blocked users, and ignored when the feature is off.
  - censor() runs only when profanity_filter is on.
  - All checks run before the file is written. The file is removed if the INSERT fails.
- PATCH /chat/messages/:id/star: a peserta gets 403 when stars are off.
- DELETE /chat/messages/:id: a peserta gets 403 when user_delete is off; admin is always allowed. The delete also clears pin, mentions and reactions in one transaction.

**New endpoints (chat_interactions.go)**
- GET /chat/members?q=: users not blocked, name ILIKE with LIKE wildcards escaped, ordered by name, max 20.
- PUT /chat/messages/:id/reaction: in one transaction it bumps updated_at, then adds, swaps or removes (same emoji) my reaction. Returns the updated ChatMessage, or 404 if the message is missing or deleted.
- DELETE /chat/messages/:id/reaction: removes my reaction and returns the updated ChatMessage.
- PATCH /admin/chat/messages/:id/pin (registered in the admin group): a database lock stops two admins pinning at once. Pinning a 4th message unpins the oldest and bumps its updated_at. Returns {message, pinned}.
- Helpers: validEmoji, hasURL, parseMentionIDs, cutRunes.

Every reaction, pin, star and delete bumps updated_at.

**Routes (server.go)**
- Logged-in users: GET /chat/config, GET /chat/members, PUT and DELETE /chat/messages/:id/reaction (rate limit 120 per minute per IP).
- Admin group: PATCH /chat/messages/:id/pin, GET and PUT /chat/settings.

**Cleanup job**
Each run reads the settings. If auto_delete is on, it deletes messages that are not starred, not pinned and older than retention_days. Deleted-message markers older than 1 day are always removed. If the settings can't be read because of a database error, that run is skipped rather than falling back to defaults.

**Tests (chat_v2_test.go)**
Settings defaults, merge, out-of-range normalisation, partial PUT and validation; chatConfigFor for admin and peserta; the attachment-type mapping; mention parsing (dedupe, max 10, invalid and nil UUIDs dropped, never nil); emoji validation; URL detection; cutRunes.

**Important:** the running bisa-pns-api-1 container still has the old binary. Migration 0005 and the new endpoints only take effect after the API image is rebuilt. Per the constraints I did not rebuild or restart anything.

**Penyimpangan dari spesifikasi:**
- Link detection: http:// and https:// match anywhere (case-insensitive). www. only counts at the start of the text or after a non-letter/non-digit, so words like "awww." are not treated as links. If the frontend uses a plain /(https?:\/\/|www\.)/i check, it may warn on text the server accepts; that mismatch is harmless.
- A disabled chat (enabled=false) also blocks a peserta with 403 CHAT_DISABLED on star, reaction PUT/DELETE and message DELETE. The spec only lists messages, sync, members and send.
- DELETE /chat/messages/:id/reaction also returns 403 CHAT_FEATURE_DISABLED to a peserta when reactions=false. The spec only lists this for PUT.
- A closed group (peserta_can_send=false) blocks only POST /chat/messages. Peserta can still react, star, and delete their own messages, which matches the frontend spec where only the composer is replaced.
- Reaction emoji is trimmed, then checked. An invalid emoji gets 422 with fields.emoji (the spec does not say). Besides the spec rules, the check also rejects any Unicode whitespace, control characters and invalid UTF-8. Keycap digits like 1️⃣ are rejected because the spec forbids ASCII digits.
- PUT /admin/chat/settings applies the body on top of the current stored settings, like the existing /admin/settings, so a key left out keeps its current value. Malformed JSON or a wrong type (for example retention_days sent as a string) returns 400 BAD_REQUEST. Out-of-range retention_days returns 422 with fields.retention_days.
- When settings are loaded, a stored retention_days outside 1–90 (for example edited by hand in the DB) is treated as 7 so the cleanup job can't purge everything. If the settings can't be read because of a DB error, that cleanup run is skipped.
- Pin: pinning an already-pinned message, or unpinning one that isn't pinned, changes nothing and returns 200. Pins are not written to the activity log.
- Deleting a message also clears pinned_at/pinned_by and mentions and removes its chat_reactions rows. It also bumps updated_at on messages that reply to it, so /chat/sync delivers reply_to.deleted=true.
- Mentions: the nil UUID is dropped. The mentions field is accepted as a comma-separated list or as repeated form fields. A mentioned user who is later hard-deleted is left out of the mentions output.
- reply_to.body is the original text only; for an attachment-only message it is "", and the frontend should show a label based on kind.
- GET /chat/messages keeps the v1 retention_days field, now read from the settings. config.group is omitted (not null) for peserta.
- GET /chat/members cuts q to 60 characters and escapes the LIKE wildcards % _ \. It has no rate limiter. Reaction PUT/DELETE share a 120-per-minute per-IP limit (the existing limiter keys on IP + route path).
- Extra indexes beyond the spec: a partial index on chat_messages(reply_to) and an index on chat_reactions(user_id). The down migration also deletes the settings row with key 'chat_settings'.

**Pemeriksaan:** Formatter: gofmt -l printed nothing (the files were already formatted). Full check (docker golang:1.25-alpine, exact command from the task): printed "gofmt:" with nothing after it, go vet ./... clean, go test ./... gave "ok bisapns/api/internal/app" and every other package "[no test files]", exit 0. Verbose run: TestChatSettingsDefaults, TestChatSettingsMerge, TestChatSettingsValidate, TestChatConfigFor, TestChatAttachAllows, TestParseMentionIDs, TestValidEmoji, TestHasURL, TestCutRunes and TestCensor all PASS. Run again after the final edits with the same result.

SQL check: piped a script into the already-running bisa-pns-db-1 (postgres:16) with psql, inside BEGIN ... ROLLBACK. Covered: migration 0005 up; the INSERT with $9::text[]::uuid[]; the reply_to EXISTS check; the mention filter; the reaction upsert, swap and batch queries; the full chatSelect (reply ref shows deleted=t after a delete); the advisory lock and pin trim (4 pinned became 3 and the oldest was released); the pinned list with LIMIT $1; members ILIKE; the stats query; the soft delete; the cleanup DELETE with make_interval(days => $1); migration 0005 down. Exit 0. Afterwards the DB was confirmed unchanged: chat_reactions absent, none of the new columns present, latest migration still 0004_group_chat.

All touched files are LF only. Nothing else was run: no npm, next build, compose or container restarts.

### File
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\web\components\chat\GroupChat.jsx
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\web\components\chat\ChatBubble.jsx
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\web\components\chat\ChatComposer.jsx
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\web\components\chat\EmojiPicker.jsx
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\web\components\chat\PinnedBanner.jsx
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\web\components\chat\chat-utils.js

I rebuilt the GroupChat panel frontend to the GROUPCHAT-V2 spec. I split it into small files under components/chat/ and only touched that folder. Nothing was run in a browser, as the task required. The only checks were `next lint` (clean) and a node script that exercised the helpers in chat-utils.js.

**All v1 behavior kept:** polling sync (2.5 s when the panel is open, 12 s when closed), unread badge with the last-read time in localStorage, pinning the panel to the right with html.gc-docked, attachments, delete, star, admin reset, emoji picker, day separators, message grouping, mobile full-screen, Escape, and the same visual style.

**Files:**
- **chat-utils.js** — helpers: time formatting (formatters created once), message merge, config defaults, @tag query detection and extraction, optimistic reaction updates, mention/link splitting, allowed attachment types per config.
- **EmojiPicker.jsx** — the v1 picker as a reusable piece, used by the composer and by the full reaction picker.
- **ChatBubble.jsx** — the message bubble, memoized. Shows the reply quote, highlights @mentions, accents bubbles that tag me, shows reaction chips and a pinned icon, and holds the message toolbar (React, Reply, Star, Copy, Pin/Unpin for admin, Delete).
- **ChatComposer.jsx** — the input box. Reply preview, @mention autocomplete, attachments limited to enabled types, emoji picker only when emoji is on, and a link warning.
- **PinnedBanner.jsx** — the pinned-message banner.
- **GroupChat.jsx** — holds the state and the API calls.

**Features:**
1. **Reply:** "Membalas …" preview in the composer, sent as `reply_to`. Clicking a quote scrolls to the original and highlights it for about 1.8 s. If the original is not loaded, a toast says so. When a message is deleted, quotes pointing to it change to "Pesan telah dihapus" in local state. If the message being replied to is deleted, the pending reply is cancelled.
2. **@tag:**
   - Typing `@` opens a list from GET /chat/members?q=, with a short delay, a cache, and an aborted-request cleanup. Names of up to 3 words are matched, and I am left out of the list.
   - Keys: ↑/↓ to move, Enter or Tab to pick, Esc to close. Picking inserts "@Nama ". The list uses proper aria attributes.
   - On send, `mentions` holds the ids whose "@Nama" is still in the text (unique, max 10, comma-separated).
   - Mentions are bold cobalt in bubbles; bubbles that tag me get a cobalt tint. The round button shows an '@' badge when an unread message tags me, and its aria-label says so.
3. **Reactions:** a quick bar 👍 ❤️ 😂 😮 😢 🙏 plus '+' for the full picker. The bar flips below the bubble near the top of the list and moves focus to the first emoji. The update is optimistic, sent with PUT /chat/messages/:id/reaction, and rolled back on error. Chips show emoji and count, mine highlighted; the title lists names ("Anda" for me); clicking a chip toggles my reaction.
4. **Pin (admin only):**
   - Pin/Unpin in the toolbar and × on the banner, via PATCH /admin/chat/messages/:id/pin.
   - The banner shows the pin icon, "Pesan disematkan", "1/3", sender and snippet, and cycles through pins.
   - The banner always follows the server's `pinned` list from list/sync/pin responses. Local copies of the oldest pin are marked unpinned when it is dropped.
5. **Retention notice:** shown only to admin.
6. **Open/close group:**
   - Peserta with chat disabled see nothing, not even the round button. GET /chat/config is re-checked every 30 s and messages reload when chat is turned back on.
   - Peserta with `can_send=false` get a lock bar instead of the composer.
   - Admin gets a lock toggle in the header (GET then PUT /admin/chat/settings with `peserta_can_send` flipped), with a spinner and a toast.
   - Admin sees strips "GroupChat nonaktif untuk peserta" and "Grup ditutup — hanya admin yang dapat mengirim".
7. **Error handling:**
   - 403 CHAT_DISABLED from any call hides the chat.
   - CHAT_CLOSED shows the server message in a toast and switches the composer to the lock bar.
   - CHAT_FEATURE_DISABLED shows the server message in a toast and refetches /chat/config.
   - 422 errors show the field message.

**Performance:**
- `config` and `pinned` from list/sync replace state only when they actually changed.
- Sync no longer re-renders on empty ticks (v1 built a new array every tick).
- Rows (day labels and grouping) and the unread counts are computed once per list change.
- Bubbles get one stable action callback, so unchanged bubbles don't re-render.
- No per-message requests.

**Penyimpangan dari spesifikasi:**
- Pinned banner click follows WhatsApp: it scrolls to the pinned message currently shown, then the banner moves on to the next one. The spec wording ('klik berpindah ke berikutnya + gulir ke pesannya') could be read either way.
- For peserta, the '+' full reaction picker needs both `reactions` and `emoji` on, treating `emoji=false` as turning off emoji pickers everywhere. The six quick reactions still work while `reactions` is on.
- When `links=false` and the text contains http://, https:// or www., the composer shows an inline warning and blocks sending (send disabled, warning toast on Enter) instead of letting the server return 422. A 422 field message is still shown if one comes back.
- When a feature is off, existing reactions, stars, quotes and mention highlights stay visible read-only; only the actions are hidden.
- When the group is closed, peserta can still react and star, because the server only gates those by `reactions`/`stars`. Reply is hidden since peserta cannot send.
- Clicking a reply quote or pinned item whose message is not loaded shows an info toast ('Muat pesan sebelumnya…' or 'sudah tidak tersedia') instead of loading older pages automatically.
- When `auto_delete=false`, the admin retention strip reads 'Hapus otomatis nonaktif — pesan disimpan sampai dihapus.' instead of the N-day sentence, which would be false.
- Sync does not add messages it has never seen that are older than the oldest loaded message while has_more=true, to avoid gaps in the timeline. Deletions in those items still update quotes, and known messages are always replaced. Local purge also keeps pinned messages (v1 kept only starred).
- I am left out of my own @mention suggestions. Mentions are only recognized from names picked in the list; typing '@Name' by hand does not record an id.
- Toggling a reaction always uses PUT /chat/messages/:id/reaction (sending the same emoji removes it). DELETE /chat/messages/:id/reaction is never called.
- CHAT_CLOSED also sets local `can_send=false`, so the composer becomes the lock bar right away. CHAT_FEATURE_DISABLED also refetches GET /chat/config so the turned-off control disappears.
- Peserta see nothing until the first /chat/messages response, so the round button does not flicker when chat is disabled. On a network error the button appears with the v1 'Coba lagi' state. Admin renders immediately. If a response has no `config`, defaults are used.
- Escape order: emoji picker, then the @mention list, then the pending reply (when typing in the composer), then the full reaction picker, then the quick reaction bar, then closing the floating panel. Escape is ignored while a confirm dialog is open. The docked panel still does not close on Escape, as in v1.

**Pemeriksaan:** cd apps/web && npx next lint --dir app --dir components → "✔ No ESLint warnings or errors" (run three times, last after the final edit). LF endings confirmed: zero \r in every file under components/chat/. chat-utils helpers were exercised with a node script (mentionQuery, mentionIds, tokenize, applyReaction, merge with reply_to propagation and the minTs window, normalizeConfig, acceptList, HAS_URL_RE) and gave the expected output. No Go changes, so no docker/go checks were run. No build, dev server or browser was used, per the constraints.

### File
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\web\app\(admin)\admin\chat\page.jsx
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\web\app\(admin)\admin\chat\ChatSettingsView.jsx
- C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS\BISA-PNS-app\apps\web\components\layout\AdminShell.jsx

I built the admin GroupChat settings page and added its link to the admin sidebar.

**Sidebar (`AdminShell.jsx`)**: I imported the `MessagesSquare` icon and added the GroupChat menu item under "Sistem", just before "Pesan masuk". Nothing else in that file changed.

**`app/(admin)/admin/chat/page.jsx`**: sets the page title to "GroupChat" and renders the settings view.

**`app/(admin)/admin/chat/ChatSettingsView.jsx`** (client component):
- **Header**: title "GroupChat", a short description, and two buttons. "Kembalikan default" is disabled when the settings already match the defaults. "Aktifkan semua" turns on every switch and keeps the retention days; it is disabled when everything is already on. The header also shows a group status badge ("Aktif · grup terbuka", "Grup ditutup — hanya admin" or "Nonaktif untuk peserta") and a save indicator ("Menyimpan…" / "Tersimpan").
- **Stat cards**: six cards from `GET /admin/chat/settings` (pesan, pengirim 7 hari, berbintang, disematkan /3, lampiran, reaksi). Numbers of 10,000 or more are shortened so they fit on a phone.
- **Settings sections**, each with switches that have an Indonesian label and short description:
  - **Status grup**: turn GroupChat on for peserta, and open or close the group. A small summary shows what peserta and admin can do.
  - **Interaksi**: balas, tag @, reaksi emoji, pemilih emoji, bintang, kirim link, peserta boleh menghapus pesan sendiri.
  - **Lampiran**: gambar, video, audio, dokumen. Shows "x dari 4 aktif" and a note when all four are off.
  - **Moderasi**: filter kata kasar, hapus otomatis, and the retention days input.
  - **Zona berbahaya**: reset GroupChat.
- **When GroupChat is turned off for peserta**: the Interaksi and Lampiran sections show a "Berlaku saat aktif" badge and a yellow note. The open/close switch gets an inline note. These switches stay usable; they are not disabled.
- **Autosave**: each switch updates on screen at once and sends the full settings object to `PUT /admin/chat/settings`. Saves go out one at a time, and quick changes are combined into the next save. If a save fails, the page goes back to the last value the server accepted and shows an error toast.
- **Retention days**: saved when you press Enter or leave the field; Escape undoes the edit. The page checks for a whole number from 1 to 90 and shows a message under the field. A 422 error for `retention_days` from the server is also shown there.
- **Reset**: `POST /admin/chat/reset` behind a red confirmation dialog that shows how many messages and attachments will be deleted. If the reset fails the dialog stays open and a toast appears; if it succeeds the stats refresh.
- **Loading and errors**: placeholder cards while loading, and a "Coba lagi" button if loading fails.

Lint is clean and all three files use LF line endings. Nothing was run in a browser, and I made no Go or `components/chat/*` changes.

**Penyimpangan dari spesifikasi:**
- Extra, not in the spec: the bulk buttons ask for confirmation when they would make old messages get deleted. This happens if auto-delete was off and becomes on, or if retention drops (for example 30 days back to 7). Without that, "Kembalikan default" or "Aktifkan semua" could quietly delete messages at the next hourly cleanup. Changing a single switch or the days field saves directly with no prompt.
- Extra, not in the spec: the page re-reads `GET /admin/chat/settings` every 30 seconds while the tab is visible and no save is in progress. This keeps the stats current and picks up the lock toggle from the chat panel header. Without it, the page would hold an old `peserta_can_send` value and could overwrite the lock on its next save. Replies from requests that started before the last save finished are ignored, so they cannot undo a newer save.
- "Aktifkan semua" turns on every switch, including `enabled`, `peserta_can_send`, `profanity_filter` and `auto_delete`, and keeps the current `retention_days`. "Kembalikan default" sets everything back to the spec defaults: all on, 7 days.
- Settings from the server are cleaned before use: only the known fields are kept, missing values use the defaults, and an invalid `retention_days` falls back to 7. Each save therefore sends exactly the fields defined in the spec.
- The retention days field stays usable when auto-delete is off, with the note "Tidak berlaku selama hapus pesan otomatis nonaktif." I did not disable it.
- Not done, outside my area: `pengaturan/SettingsView.jsx` has no label for the new `groupchat.pengaturan` activity log entry. It will appear there as the raw action name until someone adds an entry to that view's ACTIONS map.

**Pemeriksaan:** cd apps/web && npx next lint --dir app --dir components → "✔ No ESLint warnings or errors" (only the usual next-lint deprecation and multiple-lockfiles warnings). The three changed files have LF line endings (0 carriage returns each). Go checks were not run because no Go files were changed. No build, npm install, Docker or browser was run.

## Temuan review yang sudah tercatat (BELUM diverifikasi, BELUM diperbaiki)
### 1. [major] Saving any switch on the settings page silently undoes a lock change made from the chat panel
- File: `apps/web/app/(admin)/admin/chat/ChatSettingsView.jsx` baris 267
- Detail: AdminShell mounts <GroupChat/> on every admin page, including /admin/chat. Both frontends PUT the full settings object to /admin/chat/settings, and the backend merges that body over the stored row. GroupChat.toggleLock (GroupChat.jsx:456-474) does a fresh GET, flips the value and PUTs `{...s, peserta_can_send: s.peserta_can_send === false}`. It notifies nothing else. ChatSettingsView keeps its own copy in localRef/savedRef and only refreshes it from the 30 s poll. Every switch then calls `commit(setIn(localRef.current, path, val))`, which PUTs the whole stale object. Scenario: the admin is on /admin/chat with the panel docked and closes the group with the lock button (stored peserta_can_send=false). Within 30 s the admin turns off "Reaksi emoji" on the page. The PUT body still holds peserta_can_send:true, so the group reopens to every peserta without any notice. The page also keeps showing the "Aktif · grup terbuka" pill. The same thing happens if the lock PUT lands while a page PUT is queued.
- Usulan perbaikan: In GroupChat.toggleLock, after a successful PUT, send `window.dispatchEvent(new CustomEvent('bisapns:chat-settings', { detail: saved.settings }))`. In ChatSettingsView, listen for that event and set savedRef/localRef to normalize(detail) with apply() (or call reload({silent:true})) when no save is running. If a save is running, merge the detail into pendingRef. The alternative is to have toggle() send only the changed key: the backend already merges partial bodies over the stored row (loadChatSettings followed by ShouldBindJSON). That would mean recording a deviation from the spec's "full object" body.

### 2. [minor] /chat/sync can permanently miss reaction, pin and delete updates committed by a transaction
- File: `apps/api/internal/app/chat_handlers.go` baris 243
- Detail: The spec promises that every reaction, pin, star or delete change raises updated_at so /chat/sync re-sends that message. In v2 these changes run as multi-statement transactions. chatReact does `UPDATE ... updated_at=now()` first, then SELECT, then INSERT, then COMMIT. chatPin first waits on pg_advisory_xact_lock and only then updates. chatDelete runs 3 statements. Inside a transaction now() is the transaction start time T0, but the row only becomes visible at COMMIT. chatSync takes `now := time.Now()` as the next `since`, then queries `updated_at > since`. If a client's sync runs between T0 and the commit, it does not see the row and moves `since` past T0. The message is then never sent to that client again, so the client misses the reaction chip, pin icon or deleted state until a full reload. With many peserta polling every 2.5 s, some clients will regularly miss reactions. Pins are the most exposed, because the lock wait widens the window.
- Usulan perbaikan: Have chatSync query with an overlap, e.g. `WHERE m.updated_at > $1` with `since.Add(-5*time.Second)`. The frontend merge() replaces messages by id, so duplicates do no harm. Another option is to raise updated_at with clock_timestamp() in the last statement before COMMIT, though that only narrows the window.

### 3. [minor] The frontend link check (HAS_URL_RE) does not match the server's hasURL despite its comment
- File: `apps/web/components/chat/chat-utils.js` baris 8
- Detail: HAS_URL_RE = /(?:https?:\/\/|www\.)\S/i, with the comment "Sama dengan aturan server". The server's hasURL (chat_interactions.go:45) counts "www." only at the start of a word; its test case `"awww."` must not count as a link. It also matches http:// and https:// with nothing after them. Two concrete failures when links=false for a peserta: (1) typing "awww...lucu" matches `www\.\S` on the client, so the send button is disabled and the warning "Mengirim link sedang dinonaktifkan admin" appears, although the server would accept it. (2) "cek www." or "pakai http:// saja" passes the client check (it needs \S after the match), so the message is sent and fails with 422 fields.body.
- Usulan perbaikan: Mirror the server rule: `export const HAS_URL_RE = /https?:\/\/|(?:^|[^\p{L}\p{N}])www\./iu;`

### 4. [minor] A sync capped at 200 rows still advances `since` to now, so the newest messages are dropped
- File: `apps/api/internal/app/chat_handlers.go` baris 244
- Detail: chatSync runs `WHERE m.updated_at > $1 ORDER BY m.created_at ASC LIMIT 200` and always returns server_time=now. GroupChat stores that as sinceRef. v2 makes more than 200 updated rows much more likely: every reaction raises updated_at on old messages, a delete raises it on all replies, and an auto-unpin raises it too. The frontend also pauses sync while document.hidden. Scenario: a peserta leaves the tab in the background during an active hour (more than 200 messages and reactions), then comes back. The single sync returns the 200 oldest-created changed rows, `since` jumps to now, and the newest messages never appear until the page is reloaded.
- Usulan perbaikan: Order by `m.updated_at ASC` and, when len(list)==200, return the last item's updated_at as server_time so the next tick continues from there. Alternatively return a `truncated: true` flag and have GroupChat call loadInitial() when it is set.

### 5. [minor] The new activity action groupchat.pengaturan has no label in the activity list and logs raw JSON on every switch
- File: `apps/web/app/(admin)/admin/pengaturan/SettingsView.jsx` baris 14
- Detail: updateChatSettings calls `logActivity(c, uid, "groupchat.pengaturan", string(raw))` on every PUT. ChatSettingsView auto-saves each switch as its own PUT. The activity list maps actions through `ACTIONS[a.action] || { label: a.action ... }`, and ACTIONS has no entry for 'groupchat.pengaturan' (nor for 'groupchat.reset'). Toggling 5 switches therefore adds 5 rows labelled with the raw key "groupchat.pengaturan", each showing the full settings JSON as detail.
- Usulan perbaikan: Add `'groupchat.pengaturan': { label: 'Mengubah pengaturan GroupChat', icon: MessagesSquare, tone: 'warning' }` and `'groupchat.reset': { label: 'Mereset GroupChat', ..., tone: 'danger' }` to ACTIONS. Optionally log a short summary of only the changed keys instead of the whole JSON.
