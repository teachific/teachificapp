# SCORM Host Platform - TODO

## Phase 1: Database Schema & Migrations
- [ ] Organizations table (multi-tenant workspaces)
- [ ] Update users table with org membership and roles (site_owner, admin, user)
- [ ] Content packages table (uploaded ZIP files with metadata)
- [ ] Content versions table (version control per package)
- [ ] File assets table (extracted files within a package)
- [ ] Permissions table (per-file granular permissions)
- [ ] Play sessions table (tracking playback events)
- [ ] SCORM interactions table (LMS data storage)
- [ ] Analytics events table (engagement metrics)
- [ ] Run migrations via webdev_execute_sql

## Phase 2: Backend API Routes
- [ ] File upload endpoint (multipart, S3 storage)
- [ ] ZIP extraction and file asset indexing
- [ ] SCORM manifest parser (imsmanifest.xml, SCORM 1.2 + 2004)
- [ ] LLM content analysis on upload (metadata, tags, description)
- [ ] Organization CRUD procedures
- [ ] User/member management procedures
- [ ] Content package CRUD procedures
- [ ] Version control procedures (create version, rollback, diff)
- [ ] Permission management procedures (per-file settings)
- [ ] Secure content serving endpoint (with permission checks)
- [ ] SCORM LMS API endpoint (cmi data persistence)
- [ ] Play session tracking procedures
- [ ] Analytics aggregation procedures
- [ ] Report export procedures

## Phase 3: Admin Panel UI
- [ ] Dashboard layout with sidebar navigation
- [ ] Overview dashboard (stats cards, recent activity)
- [ ] File management page (upload, list, search, filter)
- [ ] File detail page (metadata, versions, permissions)
- [ ] Upload modal with drag-and-drop and progress
- [ ] Organization management page (create, edit, members)
- [ ] User management page (roles, invites)
- [ ] Permission editor component (per-file settings)
- [ ] Version history panel with rollback UI

## Phase 4: Content Viewer
- [ ] Secure viewer page with permission enforcement
- [ ] Sandboxed iframe for HTML/SCORM content
- [ ] SCORM 1.2 LMS API (API object)
- [ ] SCORM 2004 LMS API (API_1484_11 object)
- [ ] Play limit enforcement (max plays per user)
- [ ] Download button with permission check
- [ ] External link controls
- [ ] Viewer analytics event emission

## Phase 5: Analytics Dashboard
- [ ] Analytics overview page (play counts, completions, durations)
- [ ] Per-file analytics breakdown
- [ ] Per-organization analytics
- [ ] SCORM interaction logs viewer
- [ ] Exportable CSV/JSON reports
- [ ] Real-time engagement tracking

## Phase 6: Testing & Delivery
- [ ] Vitest unit tests for key procedures
- [ ] Save checkpoint
- [ ] Deliver to user

## Display Mode & Quiz System (New Requirements)
- [ ] Add displayMode field to content_packages (native, lms_presentation, quiz)
- [ ] Import modal: ask user to choose display mode on upload
- [ ] Native mode: render content exactly as-imported inside sandboxed iframe
- [ ] LMS Presentation mode: wrap content in internal branded LMS shell (sidebar nav, progress bar, completion tracking, branded header/footer)
- [ ] Quiz mode: parse SCORM/HTML content and import questions into internal quiz engine
- [ ] Quiz schema: quizzes, questions, answer_choices, quiz_attempts, quiz_responses tables
- [ ] Quiz builder UI: create/edit questions (MCQ, true/false, short answer, matching)
- [ ] Quiz player UI: timed quiz, progress indicator, immediate/deferred feedback
- [ ] Quiz results page: score, per-question breakdown, pass/fail, retry
- [ ] LLM-assisted quiz extraction: auto-detect and import questions from uploaded SCORM/HTML content
- [ ] Quiz attempt tracking and analytics integration
- [ ] Per-question analytics (most missed, avg time per question)

## Universal Two-Path Import System (Refined)
- [ ] Every content type (SCORM, HTML, quiz) gets the same two-path choice at import
- [ ] Path A - Native: serve content exactly as-uploaded inside sandboxed iframe, no shell wrapping
- [ ] Path B - LMS Shell: re-host content inside branded internal LMS presentation shell
- [ ] LMS Shell features: branded header, sidebar chapter/slide nav, progress bar, completion badge, prev/next controls, notes panel, bookmarking
- [ ] Import wizard step 2: after file analysis, show "How would you like to display this content?" card with Native vs LMS Shell options and visual previews
- [ ] displayMode stored per package: 'native' | 'lms_shell' | 'quiz'
- [ ] lmsShellConfig JSON field: theme color, show sidebar, show progress, allow notes, show completion badge
- [ ] Ability to switch display mode post-import from the file detail page
- [ ] LMS Shell works for all three content types: SCORM iframe inside shell, HTML iframe inside shell, quiz engine inside shell

## Excel Quiz Import/Export (iSpring Template Format)
- [ ] Install xlsx (SheetJS) for server-side Excel read/write
- [ ] Parse Template sheet columns: Question Type, Question Text, Image, Video, Audio, Answer 1-10, Correct Feedback, Incorrect Feedback, Points
- [ ] Support all question types: TF (True/False), MC (Multiple Choice), MR (Multiple Response), TI (Short Answer), MG (Matching), SEQ (Sequence), NUMG (Numeric), IS (Info Slide)
- [ ] Correct answers identified by * prefix on answer text (e.g. "*True", "*Alternative 1")
- [ ] Matching questions use pipe delimiter: "Premise|Response"
- [ ] Export quiz to XLS matching exact Template sheet column layout
- [ ] Export includes both a "Template" sheet (reference) and a "Questions" sheet with the quiz data
- [ ] Import endpoint: POST /api/quiz/import — accepts XLS/XLSX, returns parsed question list for preview before saving
- [ ] Import preview UI: show parsed questions in a table, allow user to confirm or discard
- [ ] Export button on quiz builder page downloads XLS in template format
- [ ] Validation: flag unsupported question types, missing question text, no correct answer marked
- [ ] Upload sample template file to S3 and provide download link from quiz builder

## Rebranding to Teachific™
- [x] Update VITE_APP_TITLE to Teachific™
- [x] Update DashboardLayout sidebar branding to Teachific™
- [x] Update PlayerPage LMS shell header branding to Teachific™
- [x] Update HTML page title and meta tags in index.html
- [x] Update all page headers and references to old platform name
- [x] Save checkpoint and deliver

## Bug Fix: Upload Requires Organization Selection
- [x] Auto-create a default "Personal Workspace" org for site owner on first login
- [x] Add backend procedure to ensure user always has at least one org
- [x] UploadPage: auto-select org when user only has one org (skip the selector)
- [x] UploadPage: if no org exists, auto-provision one before showing upload form
- [x] Fix org selector to not block upload for site owner

## Bug Fix: Player iframe shows Teachific app + 404 on content files
- [ ] Diagnose upload route: check how files are stored (S3 keys, extracted paths)
- [ ] Fix static file serving for extracted SCORM content
- [ ] Fix PlayerPage iframe src to point to correct content entry point
- [ ] Verify SCORM manifest parsing sets correct entryPoint field
- [ ] Test full upload → play flow end-to-end

## Bug Fix: Player iframe + Share Links
- [x] Fix iframe src — currently loads Teachific app shell instead of SCORM content
- [x] Add /api/content/:packageId/* proxy route to serve extracted S3 files with correct MIME types
- [x] Create bare /embed/:packageId route (no admin nav) for share/embed links
- [x] Fix share links to point to /embed/:packageId
- [x] Test full upload → play → share flow

## Logo Branding
- [x] Upload Teachific.png logo to CDN
- [x] Apply logo to sidebar header (replaces icon + text)
- [x] Apply logo to login screen (white/inverted version)
- [x] Apply logo to embed player LMS shell header
- [x] Set logo as browser tab favicon in index.html

## Dynamic URL Parameters
- [x] Add learnerName, learnerEmail, learnerId, orgId, groupId, customData columns to play_sessions
- [x] Update sessions.start tRPC procedure to accept and store URL params
- [x] Update EmbedPage to parse URL query params and pass to session start
- [x] Add URL builder UI in FileDetailPage with all supported params and copy-ready examples
- [x] Update analytics to expose per-session learner param data
- [x] Support ?token= for share links combined with learner params

## Logo Text Lockup
- [x] Replace logo image with styled text: "teach" white + "ific" teal + "™" white in sidebar
- [x] Same text lockup on login screen
- [x] Same text lockup in embed player header
- [x] Collapsed sidebar shows just teal "t" icon character

## Bug Fix: Upload Spinning / Timeout
- [x] Diagnose upload timeout root cause (body size limit, multer, S3)
- [x] Fix server body size limit and multer config for large ZIPs — switched to diskStorage
- [x] Add streaming S3 upload with real-time progress events (XHR + SSE)
- [x] UploadPage: show file size before upload starts
- [x] UploadPage: real-time bytes-uploaded progress bar with % and MB/MB display
- [x] UploadPage: phase labels (Upload → Extract → CDN Upload → Ready)
- [x] Batch-streaming extraction: read CONCURRENCY files at a time to avoid RAM exhaustion
- [x] Seed AdvancedCardiacSonographer.zip (345 files) under All About Ultrasound org (ID 1)
