# Candidates: the talent database

Updated 13 October 2026. Candidates stores people; Placements tracks candidate–client–role processes. See [Placements](PLACEMENTS.md) for the workflow contract.

## Database scope

Candidates has one canonical profile per saved person, including people imported from existing applicant/candidate/deal fixtures and people added manually. It has no pipeline status, fit/heat score, application queue, kanban or recruiting KPI. List rows expand to Profile, History and Notes. Documents remain accessible from the profile in Escape-closeable modals.

Recruiters edit profession/target role, location, expected/current salary, contacts, summary, work experience, education, certifications, skills, languages, links, availability, work preference and work authorization. Role/location/expected pay can be edited directly in the table. Existing source application answers seed known information. Unknown information stays blank. Profile edits do not rewrite original source documents.

Expanded desktop profiles use two columns in a 1:2 ratio: role, salary, contact details and work preferences on the left; summary, experience, qualifications, links and collections on the right. The profile uses the available record width and stacks vertically below the desktop breakpoint. Styling follows the Clients record: compact icon-led facts, shared record tabs, section labels and divided lists, with Edit/Documents/Archive in the footer. Profile, History and Notes share the right panel.

Candidates and Placements use shared `StatRow`/`StatCard` overview components for icon tiles, numbers, borders, hover treatment and responsive spacing.

Collections are many-to-many tags on the one profile. A horizontally scrollable sheet bar below the table offers All Candidates and one tab per collection, with membership counts and a plus button opening the creation modal. Filter by collection/owner or search name, profession, skills and location. Archive/restore hides or restores a talent record without closing its independent placements. The table uses shared heading styles extracted from Clients. Native `TableHeader` and the expandable Clients list's `GridTableHeader` share the same typography, vertical spacing and separators.

## Identity and history

The canonical ID comes from existing record relationships or a generated manual-talent ID. Names are display data, never the join key. A candidate's related source and placement IDs are available for aggregate history. Referenced events are matched by IDs, so two people sharing a name do not share their audit history.

The profile's History tab includes profile edits, collection membership changes, saved notes, AI draft requests and creation/progression/outcomes across linked placements. The history renderer no longer silently truncates to twelve events. Each placement also has its own scoped history. Original fixture events lacking references retain a legacy name fallback; new writes always use explicit IDs.

## AI

Explore talent pool and Read with Amara open the existing contextual Ask drawer. Responses use saved profiles and recorded events. An AI profile summary card appears immediately when a profile is expanded, using the reviewed summary when present or a source-grounded read of saved fields. It includes recorded strengths and missing data without using another company’s assessment. Review summary opens the editable draft and requires explicit acceptance before saving. Missing qualifications are not invented. These are deterministic demo assistants; live models, CV parsing and external enrichment are not connected.

## Storage

Profiles, manual talent, collections, placements, audit history, source candidate/applicant/deal records, dependent clients/jobs, notes, calendar records and document metadata use versioned browser-local storage. They survive ordinary reloads in the same browser/origin. This is a local prototype, not a shared backend or multi-user data system. Document binaries are not stored. Other prototype UI/conversation state may still reset.

## Validation

Seven domain tests in `tests/placements.test.mjs` cover shared identity, independent processes, duplicate protection, all nine form gates, scoped payloads, timezone/DST conversion and history isolation for identical names.

Browser evidence: one candidate had Halcyon closed as Not Qualified, Northwind independently Submitted, and a later Tidewater Active attempt. The Candidates database still showed one profile with aggregated history. A manually added Jordan Blake profile survived reload without an application/placement. Per-placement submission drafts, reviewed AI notes, all nine Escape cancellation gates, list expansion and board-card-to-form behavior were exercised. See BUILD_LOG for final responsive/build results.

Responsive QA: Candidates and Placements, including expanded records and an interview bottom sheet, remained within a 375px page viewport. Wide rows scroll inside their contained table frame. The Placements list was also inspected at 1440px.
