# Placements: candidate–company processes

Updated 13 October 2026. `/placements` is the recruiting workflow page; `/pipeline` redirects here. `/candidates` is the shared talent database. The existing deployed pipeline was inspected as a kanban baseline; our design direction and components remain the source of visual styling.

## Model

`Placement` has a unique ID, canonical `candidateId`, `clientId`, optional `jobId`, status, owner, created/updated timestamps, optional legacy deal link and an append-only array of completed form snapshots. A profile can have many placements. Each attempt owns its status, forms, notes and audit events.

Starting placements selects one saved person and one or more open roles across active clients. The store validates the entire selection before writing anything, deduplicates selected role IDs and rejects duplicate active candidate/client/role processes. A closed attempt can be reused as a source for a new attempt without overwriting it. Candidates with identical names retain separate identities.

Every form is scoped to its placement's client and role. Selecting another company requires a separate placement. Updating one company never sets a global candidate status, changes their profession, or changes another company's process. Legacy deals remain linked to their original placement for existing deal/document views; newly created placements do not fabricate financial fees or invoices.

## Views and progress

List rows expand in place with the Candidates/Clients design: a left facts/status panel, right Assessment/History/Notes tabs and a footer for progression and new attempts. An AI role-fit card is visible immediately in Assessment. Exact-company/job screening fixtures can be reused; a different company never inherits that fit grade. Saved role requirements produce explicit evidence coverage through disclosed demo term matching, with unconfirmed requirements kept separate. Missing briefs are marked Brief needed, without invented percentages. Add/Edit requirements opens a modal, saves the shared role brief to local browser storage and records audit history. Process urgency remains separate from qualification evidence. Board cards open the next required form directly, including Configure Submission for an Active/Screening process. Details & history is available separately on a card. Status menus expose all 13 statuses plus No Status. Closed/placed board cards reopen the placement-creation chooser for reuse.

The nine required forms remain: Screening, Submitted, Interviewing, Follow Up, Offer Expected, Offer Sent, Interested, Placed and Fell Off. Central `setPersonStatus` requires a valid placement ID and completed form data. Candidate-profile menus cannot mutate pipeline status. All nine forms cancel via Escape without changing status. Scheduling checks selected IANA zones, valid start/end order and client-specific contacts; valid confirmations create local calendar records. Completed snapshots are retained rather than overwritten.

Submission first generates an editable draft, then records it after review. No email/invitation is sent. Offer Sent keeps the previously disclosed manual review adaptation: initial upload fields were inspected in staging, subsequent extraction steps were not verified. Actual file storage/extraction, meeting recording, sending and invoice creation are not connected.

## AI and audit

The placement chooser offers title/skill overlap suggestions with recorded sources and no automatic selection. The page offers an Amara plan. Each process offers an editable next-step draft using its status, candidate profile and recent scoped history; reviewed text can be saved as a note. Each status form includes an on-request checklist. AI drafting/review requests, accepted edits, notes, process creation and every committed status change are logged with actor, time and record IDs. Prototype generation is deterministic, not a live model.

Talent, placements, dependencies, form snapshots and audit history persist locally in this browser. Production storage/authentication/tenant access and shared concurrent editing remain future work.

## Verification

Run `node --test tests/placements.test.mjs`, `npx tsc --noEmit`, `npx eslint .` and `npx next build`.

Browser QA covered multi-company creation, closing one process without affecting another, creating a third company attempt from the closed process, board card opening the scoped form, reviewed submission, scoped versus aggregate history, all nine form gates and Escape, saved AI notes, and reload retention. Native drag-and-drop remains a separate verification item; its handler uses the same required-form store gate.
