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

## Bug Fix: Learner URL Parameters Not Stored in Sessions
- [ ] Audit EmbedPage: confirm URL params are parsed and passed to sessions.start mutation
- [ ] Audit sessions.start procedure: confirm all learner fields are accepted and written to DB
- [ ] Check PlayerPage (non-embed): does it also parse and forward URL params?
- [ ] Verify play_sessions rows contain learner fields after a tracked play
- [ ] Fix whichever layer is dropping the params
- [ ] Test end-to-end with a constructed tracking URL

## File Organization: Folders & Subfolders
- [ ] Add content_folders table (id, name, parentId, orgId, ownerId, createdAt, updatedAt)
- [ ] Add folderId column to content_packages table
- [ ] Generate and apply migration SQL
- [ ] Add folder CRUD tRPC procedures (create, rename, delete, list, move)
- [ ] Add procedure to move package into/out of folder
- [ ] Build folder tree sidebar in FilesPage (collapsible, nested)
- [ ] Add "New Folder" button and inline rename
- [ ] Show packages filtered by selected folder (or "All" / "Uncategorized")
- [ ] Allow moving packages between folders (context menu or drag)
- [ ] Allow moving folders into other folders (drag or move dialog)
- [ ] Delete folder: prompt to move contents or delete all
- [ ] Show folder breadcrumb when browsing inside a folder
- [ ] Write vitest tests for folder procedures

## URL Builder Redesign: Template Placeholder Mode
- [x] Replace manual-entry fields with a template placeholder system
- [x] Each param shows its placeholder token (e.g. {{learner_name}}) for use in the host site
- [x] Generate a base embed URL with all enabled params as placeholders
- [x] Provide tabbed code snippets: Plain JS, iframe HTML, and a generic LMS/server-side example
- [x] JS snippet uses string replacement to swap placeholders with the host site's dynamic variables
- [x] Explain that the host site is responsible for substituting values before launching the iframe
- [x] Add a "Live Preview" section where user can test-fill values and see the final URL

## Mobile Responsiveness
- [ ] DashboardLayout: collapsible sidebar drawer with hamburger menu on mobile
- [ ] FilesPage: show type/status/plays on mobile, folder sidebar as collapsible panel
- [ ] FileDetailPage: tabs scroll horizontally, form fields full width, sharing section stacks
- [ ] AnalyticsPage: stats cards wrap, table scrolls horizontally
- [ ] UploadPage: full width on mobile
- [ ] PlayerPage/EmbedPage: iframe fills full viewport on mobile
- [ ] Dashboard/Home: stat cards wrap to 2-col grid on mobile
- [ ] Navigation: hamburger opens full-screen nav drawer on mobile

## Bug Fix: Iframe Embed Broken on External Sites
- [ ] Proxy content bytes through server instead of redirecting to S3 (avoids S3 X-Frame-Options blocks)
- [ ] Add X-Frame-Options: ALLOWALL and correct CORS headers to content proxy responses
- [ ] Ensure embed page itself has no frame-blocking headers
- [ ] Test embed loads on boutultrasound.com mobile

## Bug Fix: Embed Requires Login (Critical)
- [ ] Make sessions.start a publicProcedure (no auth required)
- [ ] Make sessions.end a publicProcedure
- [ ] Make packages.get a publicProcedure for embed context
- [ ] Update EmbedPage: remove login redirect, allow anonymous session start
- [ ] Content proxy routes already public (Express, no tRPC auth)
- [ ] Test: incognito window can view embedded content

## Access Control: Public / Private Per Package
- [x] Add isPublic boolean column to content_packages (default false = private)
- [x] packages.get: make publicProcedure, return package only if public OR user is authenticated org member
- [x] sessions.start: block unauthenticated start for private packages
- [x] sessions.end / scorm data: already publicProcedure
- [x] FileDetailPage Details tab: Public/Private toggle with live save and badge in header
- [x] EmbedPage: if package is private and user not logged in, show login wall
- [ ] PlayerPage: same private access gate (low priority — admin-only route)
- [ ] Share link: token-protected links bypass the public/private check

## Bug Fix: Embed Content Flash
- [x] Content shows briefly then disappears in embed player
- [x] Root cause: permissions.get was protectedProcedure — threw UNAUTHORIZED for unauthenticated users, causing tRPC retries and re-renders that flashed the iframe
- [x] Fix: made permissions.get a publicProcedure; added retry:false + staleTime:Infinity to pkg and perms queries in EmbedPage

## File Organization: Drag-and-Drop Folders
- [ ] Install @dnd-kit/core and @dnd-kit/sortable for drag-and-drop
- [ ] Two-column layout: folder tree sidebar (left) + package grid (right)
- [ ] Drag package cards onto folder nodes to move them
- [ ] Folder drop zones highlight on hover during drag
- [ ] Clicking a folder filters packages to show only that folder's contents
- [ ] Breadcrumb path shows current folder location
- [ ] "All Files" and "Uncategorized" virtual folders in sidebar

## Bug Fix: Drag-to-Order Questions Not Working on Mobile in Iframe
- [x] Diagnose: iframe sandbox attribute blocking touch/pointer events
- [x] Removed sandbox attribute from all iframes in EmbedPage and PlayerPage (native + LMS shell modes)
- [x] Applies to ordering, connect, and match question types — all rely on touch drag events

## UI: Teal Fullscreen Button on Mobile
- [x] EmbedPage: fullscreen button teal-highlighted on mobile screens
- [x] PlayerPage: fullscreen button teal-highlighted on mobile screens (both native and LMS shell modes)

## UI: Mobile Fullscreen Prompt Banner
- [x] EmbedPage: show themed banner on mobile with "Best displayed in full screen" + Full Screen + Dismiss (✕)
- [x] PlayerPage: same banner in both native and LMS shell modes
- [x] Banner only shows on mobile (sm breakpoint), hidden when fullscreen is active, dismissed via state

## Feature: Upload New Version (Version Replacement)
- [x] Version upload endpoint: POST /api/upload/version/:packageId — same extraction logic, increments version number
- [x] Keep same package ID / embed URL — only the content files change
- [x] FileDetailPage Versions tab: Upload New Version card with file picker, changelog field, and progress bar
- [x] Version history list showing versionLabel, changelog, file count, entry point, and Current badge
- [ ] Allow rolling back to a previous version from the version history list (future)

## Feature: Drag-and-Drop Folder Organization
- [x] Add sortOrder column to content_folders table
- [x] Add folders.reorder tRPC procedure to persist folder order
- [x] packages.move procedure already existed in routers.ts
- [x] FilesPage: draggable package cards that can be dropped onto folder nodes
- [x] FilesPage: reorderable folder list in sidebar via drag handle
- [x] FilesPage: fix stale @/contexts/AuthContext import

## Bug Fix: Folder Sort Order Not Persisting
- [x] Fix getFoldersByOrg in db.ts to sort by sortOrder ASC (was sorting alphabetically by name)
- [x] Folder drag-and-drop reorder now persists correctly across page refreshes

## Feature: Auto-Fullscreen on Mobile
- [x] Add autoFullscreenMobile boolean column to content_packages table (default false)
- [x] Generate and apply migration SQL
- [x] Expose autoFullscreenMobile in packages.get (public) and packages.update (protected) tRPC procedures
- [x] Add toggle in FileDetailPage Details tab under Mobile Playback section
- [x] EmbedPage: read autoFullscreenMobile from package, detect mobile UA, request fullscreen on mount
- [x] PlayerPage: same auto-fullscreen logic for admin preview
- [x] Dismiss mobile prompt banner automatically when auto-fullscreen fires
- [x] Write vitest test for packages.update with autoFullscreenMobile field

## Bug Fix: Folder Sidebar — Remove Uncategorized Virtual Folder
- [x] Remove "Uncategorized" virtual folder entry from the sidebar
- [x] "All Files" remains the only top-level filter (shows all packages regardless of folder)
- [x] Clicking a real folder filters to only that folder's packages
- [x] Packages without a folderId appear under "All Files" and inside whichever folder is selected (or all)
- [x] Remove "drop-uncategorized" drop target; dragging a package off a folder just moves it back to no folder via the folder's own drop zone or context menu
- [x] Update empty-state message when a folder is selected but empty

## Bug Fix: New Version Not Showing on Mobile
- [x] Audit content proxy: was querying ALL assets for a package, ignoring versionId — old entry point matched first
- [x] Fix contentRoutes to filter file_assets by currentVersionId in both /entry and /* routes
- [x] Add Cache-Control: no-store, no-cache, must-revalidate + Pragma: no-cache to all proxy responses
- [x] Remove forwarding of S3 ETag/Cache-Control headers that caused mobile caching
- [x] Add ?v={currentVersionId} cache-buster to iframe src in EmbedPage and PlayerPage

## Bug Fix: Version Uploader Timeout on Large Files
- [x] Audit: root cause was streamToBuffer() loading entire ZIP into RAM before S3 upload, blocking the HTTP response
- [x] Replace streamToBuffer() with storagePutStream() in both /package and /version routes — streams file directly to S3 without RAM buffer
- [x] Remove unused streamToBuffer helper and createReadStream import
- [x] Rewrite UploadNewVersion component to use XHR with upload.onprogress for real byte-level progress
- [x] Two-phase progress: Phase 1 = XHR byte upload % (0-100%), Phase 2 = SSE extraction/CDN progress
- [x] XHR timeout set to 0 (unlimited) — server handles the 10-min timeout
- [x] phaseLabel updated to show "Uploading... 47%" during upload phase

## Bug Fix: Upload Silently Stops (Proxy Body Limit)
- [x] Root cause: reverse proxy silently drops requests exceeding its body size limit with no error
- [x] New chunkedUploadRoutes.ts: initiate / chunk / finalize endpoints at /api/chunked
- [x] Each chunk is 5 MB max — well under any proxy limit
- [x] Finalize assembles chunks into a temp file, then forwards to /api/upload/version/:id internally
- [x] All SSE extraction progress reused unchanged
- [x] UploadNewVersion UI: 3-step chunked flow with per-chunk XHR progress (shows "Uploading... 47%")
- [x] Installed form-data package for server-side multipart forwarding
- [x] Mounted /api/chunked router in server/_core/index.ts

## Bug Fix: Upload Still Timing Out After Chunked Upload
- [x] Root cause: finalize was forwarding the 457 MB assembled file via internal HTTP POST — same proxy limit
- [x] Fix: export processZipVersion + emitProgress from scormUploadRoutes
- [x] Fix: chunkedUploadRoutes finalize now calls processZipVersion directly — no HTTP forward at all
- [x] Fix: storagePutStream rewritten to use form-data + Node http.request piping — truly streams to S3 without loading file into RAM
- [x] Finalize responds immediately after storagePutStream + updatePackage; extraction runs in background
- [x] SSE progress stream unchanged — client still receives extraction updates via /api/upload/progress/:id

## Bug Fix: Chunk Upload Stops at ~40%
- [x] Diagnosis: proxy idle timeout drops connection when sequential chunks leave gaps > ~60s
- [x] Reduced chunk size from 5 MB to 2 MB so each chunk completes faster
- [x] Changed from sequential to parallel batch upload (3 chunks at a time) to keep connection active
- [x] Added per-chunk retry with exponential backoff (1s, 2s, 4s) up to 3 retries
- [x] Per-chunk XHR timeout set to 2 minutes (was unlimited)
- [x] Accurate overall progress using per-chunk byte tracking across parallel uploads

## Feature: Restrict Large Uploads (>100 MB) to Site Owner Only
- [x] Server: /initiate rejects with 403 if totalBytes > 100 MB and user.openId !== OWNER_OPEN_ID
- [x] Frontend: passes totalBytes in initiate body; 403 error surfaces as toast with clear message
- [x] Chunk size reduced to 512 KB to pass through strict production proxy limits
- [x] Parallel batch size increased to 4 chunks at a time

## Feature: Version Restore + Auto-Delete + Upload Size Warning
- [ ] Add replacedAt timestamp column to content_package_versions table
- [ ] Generate and apply migration SQL
- [ ] DB helper: setVersionReplacedAt(versionId, timestamp)
- [ ] DB helper: getVersionsDueForDeletion(packageId) — versions where replacedAt < now - 30 days
- [ ] DB helper: deleteVersionAssets(versionId) — remove S3 files and DB rows
- [ ] tRPC procedure: packages.versions.restore — sets package currentVersionId, clears replacedAt on restored version, sets replacedAt on previously current version
- [ ] tRPC procedure: packages.versions.purgeExpired — deletes S3 assets + DB rows for versions past 30-day window (called on page load)
- [x] FileDetailPage Versions tab: "Restore" button on non-current versions
- [x] FileDetailPage Versions tab: "Auto-delete in Xd" amber badge + "Pending deletion" badge on replaced versions
- [ ] FileDetailPage Versions tab: confirmation dialog before restore (deferred)
- [x] Frontend: show "File size is restricted to 100 MB." inline warning when selected file exceeds 100 MB
- [x] Upload button disabled for oversized files for non-privileged users

## Feature: Split Admin Role into Site Admin + Org Admin
- [x] Schema: users.role enum updated to ["site_owner","site_admin","org_admin","user"]
- [x] Schema: org_members.role enum updated to include org_admin
- [x] Migrated existing admin users to site_admin
- [x] Applied migration SQL
- [x] Server: adminProcedure now allows site_owner + site_admin
- [x] Server: upload size gate — site_owner + site_admin = unlimited; org_admin + user = 100 MB cap
- [ ] Server: orgAdminProcedure scoped to their org (deferred)
- [ ] Server: packages/files queries for org_admin scoped to their assigned org only (deferred)
- [x] Frontend: role labels updated in Users admin panel (Site Admin, Org Admin, Owner, User)
- [x] Frontend: sidebar admin nav hidden from org_admin users
- [ ] Frontend: org_admin My Files shows only their org's packages (deferred)

## Feature: Org Admin Content Scoping
- [x] packages.list: filtered to org_admin's assigned org (getOrgIdForUser)
- [x] analytics.summary: scoped to org_admin's org
- [x] analytics.byPackage: 403 if package is outside org_admin's org
- [x] sessions.listByPackage: 403 if package is outside org_admin's org
- [x] folders.list: scoped to org_admin's assigned org
- [x] Helper getOrgIdForUser(userId) added to db.ts
- [x] No frontend changes needed — all queries return scoped data automatically

## Bug Fix: Upload Fails Mid-Way (Presigned S3 Multipart)
- [ ] Server: createMultipartUpload tRPC mutation — returns uploadId + array of presigned PUT URLs (one per 5 MB part)
- [ ] Server: completeMultipartUpload tRPC mutation — receives ETags from client, tells S3 to assemble, triggers ZIP processing
- [ ] Server: abortMultipartUpload tRPC mutation — cleanup on client cancel/error
- [ ] Client: UploadNewVersion uploads each part directly to S3 presigned URL (no proxy involved)
- [ ] Client: accurate per-part XHR progress (0-100%)
- [ ] Client: after all parts uploaded, calls completeMultipartUpload, then polls SSE for extraction progress
- [ ] Apply same flow to initial package upload (UploadPage)

## Bug Fix: Upload Permanently Broken — Direct-to-Storage Approach
- [ ] Investigate Forge API for presigned upload endpoint
- [ ] Test direct browser-to-S3 upload bypassing proxy entirely
- [ ] Implement chosen approach end-to-end
- [ ] Update UploadNewVersion UI for new flow

## LMS Platform Build — Full Feature Set

### Phase 2: LMS Database Schema Extensions
- [ ] Add `courses` table (title, slug, description, thumbnail_url, promo_video_url, status, org_id, instructor_id, settings JSON, is_private, is_hidden, disable_text_copy)
- [ ] Add `course_sections` table (course_id, title, sort_order, is_free_preview, description)
- [ ] Add `course_lessons` table (section_id, course_id, title, lesson_type enum, content JSON, sort_order, duration_seconds, is_free_preview, is_published, drip_days)
- [ ] Add `course_enrollments` table (course_id, user_id, org_id, enrolled_at, completed_at, progress_pct, last_lesson_id, expires_at)
- [ ] Add `lesson_progress` table (enrollment_id, lesson_id, user_id, status enum, completed_at, time_spent_seconds, scorm_data JSON)
- [ ] Add `course_pricing` table (course_id, pricing_type enum, price, sale_price, currency, payment_plan JSON, access_days, is_free)
- [ ] Add `coupons` table (org_id, code, discount_type, discount_value, max_uses, used_count, expires_at, applies_to JSON)
- [ ] Add `org_theme` table (org_id, primary_color, accent_color, bg_mode enum, font_family, admin_logo_url, favicon_url, custom_css)
- [ ] Add `page_builder_pages` table (org_id, course_id, page_type enum, blocks JSON, is_published, updated_at)
- [ ] Add `certificates` table (enrollment_id, user_id, course_id, issued_at, cert_url, cert_data JSON)
- [ ] Add `org_subscriptions` table (org_id, plan enum, stripe_subscription_id, status, current_period_end)
- [ ] Extend `org_members` role enum: org_admin, sub_admin, instructor, member
- [ ] Add `instructors` table (user_id, org_id, bio, avatar_url, title, social_links JSON)
- [ ] Add `course_reviews` table (course_id, user_id, rating, review_text, created_at)
- [ ] Add `drip_schedule` table (course_id, lesson_id, release_type enum, release_days, release_date)
- [ ] Add `social_sharing` settings to courses (enable_chapter_share, enable_completion_share, share_text)
- [ ] Run migration SQL via webdev_execute_sql

### Phase 3: LMS Server Procedures
- [ ] courses.create / update / delete / list / get
- [ ] courses.publish / unpublish / duplicate
- [ ] courses.sections.create / update / delete / reorder
- [ ] courses.lessons.create / update / delete / reorder
- [ ] courses.enroll / unenroll (admin + student self-enroll)
- [ ] courses.progress.update / get
- [ ] courses.pricing.set / get
- [ ] courses.settings.update (basic, appearance, completion, SEO, drip, social sharing)
- [ ] org.theme.get / update (role-gated: org_admin, sub_admin, instructor only)
- [ ] org.branding.update (logo, favicon, colors — role-gated)
- [ ] pageBuilder.get / save (per course or per page type)
- [ ] certificates.issue / get / list / download
- [ ] coupons.create / validate / apply / list
- [ ] enrollments.list (admin) / myEnrollments (student)
- [ ] instructors.get / update profile
- [ ] reviews.create / list / delete

### Phase 4: Admin Dashboard Shell & Theming
- [ ] Extend DashboardLayout sidebar: add LMS sections (Courses, Students, Analytics, Site Builder, Settings)
- [ ] Org theme panel: light/dark mode toggle, primary color picker, accent color picker, font selector
- [ ] Theme panel gated to org_admin, sub_admin, instructor roles only
- [ ] Persist theme to DB and apply CSS variables dynamically to admin shell
- [ ] Role-based sidebar item visibility
- [ ] Update Dashboard home with LMS stats: total courses, active enrollments, revenue, completion rate
- [ ] Add org branding settings page (logo upload, favicon, school name, custom domain)

### Phase 5: Course Builder (Admin)
- [ ] Course list page: thumbnail, status badge (Draft/Published), enrollment count, revenue
- [ ] New course wizard: title, slug, thumbnail upload, description, instructor assignment
- [ ] Course editor: Teachable-style top tabs — Curriculum / Settings / Pricing / After Purchase / Drip Schedule
- [ ] Curriculum editor: drag-and-drop sections and lessons, add/remove/reorder
- [ ] Lesson types: Video, Text/Rich Text, SCORM/ZIP (reuse existing), Quiz (reuse existing), PDF, Audio, Assignment
- [ ] Course settings sub-nav: Basic Settings, Image & Description, Course Player Appearance, Progress & Completion, Page Code, Drip Schedule, Admins/Revenue Partners/Affiliates, SEO, Social Sharing
- [ ] Pricing tab: free, one-time, subscription, payment plan, bundle
- [ ] After Purchase tab: redirect URL, welcome email, upsell funnel
- [ ] Drip schedule: by enrollment date, specific date, or course start
- [ ] Design templates selector (multiple layout options)
- [ ] Course player appearance: theme color, sidebar style, progress bar style

### Phase 6: Thinkific-Style Page Builder
- [ ] Page builder shell: left block panel, center live preview, header with Desktop/Mobile/Fullscreen toggle, Save/Discard
- [ ] Block types: Banner (hero), Text, Image, 3-Image grid, Video, Curriculum (auto), Pricing Options, Testimonials, CTA, Instructor Bio, Checklist, FAQ, Countdown Timer
- [ ] Each block: drag to reorder, click to edit inline, duplicate, delete
- [ ] Banner block: background image/color, title, subtitle, CTA button, price dropdown
- [ ] Pricing block: course pricing options with "Get started now" buttons
- [ ] Curriculum block: auto-renders sections/lessons with free preview badges
- [ ] Mobile preview mode toggle
- [ ] Save publishes page builder state to DB
- [ ] Theme settings tab: colors and fonts from org theme

### Phase 7: Student-Facing Storefront
- [ ] School home page: rendered from page builder blocks with org branding
- [ ] Course catalog page: grid/list of published courses with category filters
- [ ] Course sales page: rendered from page builder blocks, pricing sidebar
- [ ] Student enrollment/checkout flow
- [ ] My Enrollments / Student Dashboard
- [ ] Student profile page
- [ ] Apply org theme (primary color, font, logo) to all student-facing pages

### Phase 8: Teachable-Style Course Player
- [ ] Course player layout: minimal top bar (home icon, settings, Previous / Complete & Continue), left sidebar (collapsible sections + lesson list), main content area
- [ ] Sidebar: search by lesson title, section headers, lesson type icons, completion status circles
- [ ] Lesson types rendered: video player, rich text, SCORM iframe (reuse proxy), quiz engine, PDF viewer
- [ ] Progress tracking: mark complete, auto-advance, track time spent
- [ ] Complete & Continue button advances to next lesson
- [ ] Course completion: trigger certificate, show completion screen
- [ ] Notes panel (optional per org settings)
- [ ] Fullscreen toggle for SCORM/video content

### Phase 9: Stripe Billing
- [ ] Platform subscription tiers: Free (1 course, 25 students), Starter ($39/mo), Builder ($99/mo), Pro ($199/mo)
- [ ] Per-org Stripe Connect for student course payments
- [ ] Coupon/discount code at checkout
- [ ] Payment plan support (installments)
- [ ] Subscription management page
- [ ] Webhook: subscription created/updated/cancelled

### Phase 10: Analytics, Certificates & Reporting
- [ ] Enrollment analytics: total enrollments, active students, completion rate, revenue
- [ ] Per-course analytics: lesson completion funnel, quiz scores, time spent
- [ ] Student progress report
- [ ] Certificate template builder: org logo, student name, course name, date, signature
- [ ] Auto-issue certificate on course completion
- [ ] Certificate PDF download
- [ ] Export student data as CSV

## LMS Course Player Enhancements
- [ ] Course player: toggle to show/hide lesson type icons in sidebar (per-course setting, admin/instructor controlled, stored in course settings)
- [ ] Course publishing: three visibility states — Published (in catalog), Hidden (direct link only, not in catalog), Private (admin-only manual enrollment, no self-enrollment)
- [ ] Update course status enum to include hidden/private visibility alongside draft/published/archived
- [ ] Course builder: show visibility selector with descriptions for each option
- [ ] Storefront catalog: filter out hidden and private courses from public listing
- [ ] Private courses: block self-enrollment, show "Contact admin to enroll" message
- [ ] Gate Hidden and Private course visibility to Pro and Enterprise tiers only — show upgrade prompt for lower tiers
- [ ] Video player controls: default to Teachific teal (#189aa1) scheme, customizable per org via branding settings (playerAccentColor applied to progress bar, play button, and controls)
- [ ] YouTube and Vimeo embed: available as video lesson type (paste URL, renders inline player) and as embed tool in rich text editor toolbar

## LMS Spec Cross-Reference (Apr 2026)
- [ ] Add showCompleteButton, enableCertificate, language, trackProgress, requireSequential, copiedFromId to courses schema
- [ ] DB migration for new courses columns
- [ ] lms.courses.copy - duplicate a course with all sections and lessons
- [ ] lms.courses.archive - set status to archived
- [ ] lms.curriculum.copyLesson - copy lesson to another course/section
- [ ] lms.curriculum.copySection - copy section to another course
- [ ] lms.ai.generateCourse - AI course generator (topic to modules and lessons)
- [ ] lms.ai.generateQuiz - AI quiz generator from topic or lesson content
- [ ] lms.ai.generateFlashcards - AI flashcard generator
- [ ] lms.media.getUploadUrl - S3 upload URL for lesson media files
- [ ] Full lesson editor dialog for all 12 lesson types in CourseBuilderPage
- [ ] Video lesson editor: URL input (YouTube/Vimeo/Wistia/direct), provider selector, rich text add-on
- [ ] Text lesson editor: full Tiptap rich text with YouTube/Vimeo embed
- [ ] Audio lesson editor: file upload or URL, rich text add-on
- [ ] PDF lesson editor: file upload or URL, rich text add-on
- [ ] SCORM/ZIP lesson editor: link to existing content package
- [ ] Web link lesson editor: URL input, embed toggle, rich text add-on
- [ ] Download lesson editor: file upload or URL, filename, rich text add-on
- [ ] Quiz lesson editor: link to existing quiz or create new
- [ ] Flashcard lesson editor: inline flashcard editor (front/back pairs)
- [ ] Exam lesson editor: link to quiz with exam settings (time limit, pass score)
- [ ] Assignment lesson editor: instructions (rich text), submission type
- [ ] Zoom/Teams lesson editor: platform, meeting URL, scheduled datetime, duration, recurrence
- [ ] Per-lesson settings: isFreePreview, isPublished, durationSeconds, drip settings
- [ ] CourseBuilderPage Settings - Image and Description: thumbnail upload, promo video URL, description (rich text), short description
- [ ] CourseBuilderPage Settings - Player Appearance: theme color, sidebar style, show progress, allow notes, show lesson icons
- [ ] CourseBuilderPage Settings - Progress and Completion: completion type, showCompleteButton, requireSequential, enableCertificate
- [ ] CourseBuilderPage Settings - After Purchase: redirect URL, welcome email, upsell course selector
- [ ] CourseBuilderPage Settings - Page Code: header/footer code textareas
- [ ] CourseBuilderPage Settings - SEO: title, description
- [ ] CourseBuilderPage Settings - Social Sharing: share toggles, share text
- [ ] CourseBuilderPage Settings - Language: default language selector
- [ ] CourseBuilderPage Settings - Design Template: template selector
- [ ] CoursesPage: Copy/Duplicate course action
- [ ] CoursesPage: Archive course action
- [ ] CoursesPage: Status filter tabs (All/Draft/Published/Hidden/Private/Archived)
- [ ] CoursesPage: AI Course Generator modal
- [ ] CoursePlayerPage: Lesson icon toggle (respect course.playerShowLessonIcons)
- [ ] CoursePlayerPage: Sidebar search filter
- [ ] CoursePlayerPage: Notes panel (when playerAllowNotes is true)
- [ ] CoursePlayerPage: Completion screen with certificate download
- [ ] CoursePlayerPage: showCompleteButton respect course setting
- [ ] CoursePlayerPage: requireSequential lock future lessons
- [ ] Student My Courses dashboard (/school/my-courses)
- [ ] Enrollment flow: enroll button, confirm, redirect to player
- [ ] Free course auto-enrollment on click
- [ ] Preview access: free preview lessons without enrollment
- [ ] Private course: show Contact admin to enroll message
- [ ] Student profile page (/school/profile)
- [ ] Members: bulk upload via CSV/Excel
- [ ] Members: manual enrollment of member to course
- [ ] Members: member detail with courses, progress, certificates

## Media Library Consolidation
- [x] Create MediaLibraryPage with three tabs: Upload Content (SCORM/HTML5), My Files (uploaded media), Quizzes
- [x] Remove Upload Content, My Files, and Quizzes from sidebar nav
- [x] Add single "Media Library" link to sidebar nav in their place
- [x] Update all internal links/routes to point to /media-library

## Subscription Tier Gating
- [ ] Define TIER_LIMITS constant with per-plan limits (courses, members, storage, features)
- [ ] Server: gate course count per org by plan (Free: 3, Starter: 10, Builder: 25, Pro: unlimited, Enterprise: unlimited)
- [ ] Server: gate member count per org by plan (Free: 50, Starter: 200, Builder: 1000, Pro: 5000, Enterprise: unlimited)
- [ ] Server: gate AI course generation to Builder+ plans
- [ ] Server: gate AI quiz/flashcard generation to Builder+ plans
- [ ] Server: gate custom domain to Pro+ plans
- [ ] Server: gate drip scheduling to Builder+ plans
- [ ] Server: gate certificates to Starter+ plans
- [ ] Server: gate course bundles to Builder+ plans
- [ ] Server: gate advanced analytics to Pro+ plans
- [ ] Server: gate Zoom/Teams live sessions to Pro+ plans
- [ ] Server: gate hidden/private courses to Pro+ (already done)
- [ ] Server: gate custom CSS/page code to Pro+ plans
- [ ] Server: gate Zapier/webhook integrations to Pro+ plans
- [ ] Client: show upgrade prompt UI when hitting tier limits
- [ ] Client: show current plan badge on org settings page
- [ ] Client: disable/lock gated features with upgrade CTA
- [ ] Client: subscription management page for org admins

## Custom Pages Feature (Session Apr 2, 2026)
- [x] Update pages.update mutation to include showHeader, showFooter, metaTitle, metaDescription, customCss fields
- [x] Build CustomPagesPage UI with rich text editor (TipTap), slug input, show/hide header/footer toggles, SEO fields, custom CSS textarea
- [x] Add Custom Pages route to App.tsx (/lms/custom-pages)
- [x] Add Custom Pages nav link to Administration section in DashboardLayout
- [x] Verify showHeader/showFooter/metaTitle/metaDescription/customCss columns exist in DB

## Banner Display in CoursePlayerPage (Session Apr 2, 2026)
- [x] Import BANNER_SOUNDS from LessonBannerEditor for sound playback
- [x] Add LessonBanner component with top/bottom bar and left popover positions
- [x] Add playBannerSound helper function
- [x] Add activeBanner state and bannerTimerRef to CoursePlayerPage
- [x] Show start banner when lesson changes (with auto-dismiss)
- [x] Show completion banner when lesson is marked complete (with auto-dismiss)
- [x] Render LessonBanner overlay in CoursePlayerPage JSX

## Vimeo Support (Already Implemented)
- [x] Vimeo URLs already handled in CoursePlayerPage video case (lines 245-248)
- [x] Converts vimeo.com/{id} to https://player.vimeo.com/video/{id} embed URL

## Searchable Organization Selector in Custom Pages
- [x] Replace plain <select> with a searchable combobox (input + filtered dropdown) in CustomPagesPage

## Custom Teachific-Branded Authentication System (Replace Manus OAuth)
- [ ] Design new auth schema: users table with email, passwordHash, emailVerified, resetToken, resetTokenExpiry
- [ ] Build registration endpoint: POST /api/auth/register (email, password, name) → create user, send verification email
- [ ] Build login endpoint: POST /api/auth/login (email, password) → verify credentials, return JWT session token
- [ ] Build logout endpoint: POST /api/auth/logout → clear session cookie
- [ ] Build password reset flow: POST /api/auth/forgot-password (email) → send reset link, POST /api/auth/reset-password (token, newPassword)
- [ ] Build email verification flow: GET /api/auth/verify-email?token=xxx → mark user as verified
- [ ] Replace Manus OAuth callback route with custom login page at /login
- [ ] Build registration page at /register with Teachific branding
- [ ] Build forgot password page at /forgot-password
- [ ] Build reset password page at /reset-password
- [ ] Update DashboardLayout to use custom auth context instead of Manus useAuth
- [ ] Update all protected routes to check custom JWT session instead of Manus OAuth
- [ ] Remove Manus OAuth dependencies from server/_core/oauth.ts and server/_core/context.ts
- [ ] Update login/logout UI to use Teachific branding (logo, colors, copy)
- [ ] Write vitest tests for registration, login, password reset flows

## Enhanced Users Page with Org Filter/Search/Sort
- [ ] Add organization filter dropdown (searchable combobox) to Users page
- [ ] Add search input to filter users by name or email
- [ ] Add sort dropdown: Name (A-Z), Name (Z-A), Email (A-Z), Role, Date Joined
- [ ] Show user's organization(s) in the users table
- [ ] Add "Delete User" action for site owner/admins
- [ ] Add confirmation dialog for user deletion
- [ ] Update users.list tRPC procedure to accept orgId, search, sortBy params
- [ ] Show empty state when no users match filters

## Workspace/Organization Deletion
- [ ] Add "Delete Organization" button to Organizations page (visible only to site owner and site admins)
- [ ] Build confirmation dialog: warn that all courses, content, users, and data will be permanently deleted
- [ ] Build orgs.delete tRPC procedure (site owner/admin only)
- [ ] Cascade delete: remove all org-owned courses, lessons, content packages, pages, enrollments, sessions, analytics
- [ ] Show toast notification on successful deletion
- [ ] Redirect to Organizations list after deletion
- [ ] Write vitest test for org deletion with cascade checks

## Email Marketing System via SendGrid
### Database Schema
- [ ] Create email_templates table (id, orgId, name, subject, htmlBody, textBody, isDefault, createdAt, updatedAt)
- [ ] Create email_campaigns table (id, orgId, name, templateId, subject, status [draft, scheduled, sending, sent], scheduledAt, sentAt, recipientCount, openCount, clickCount, createdBy, createdAt)
- [ ] Create email_campaign_recipients table (id, campaignId, userId, email, status [pending, sent, failed, bounced], sentAt, openedAt, clickedAt)
- [ ] Create email_unsubscribes table (id, userId, email, orgId, unsubscribedAt, reason)
- [ ] Generate and apply migration SQL for all email tables

### SendGrid Integration
- [ ] Install @sendgrid/mail npm package
- [ ] Create server/sendgrid.ts helper with sendEmail(to, subject, html, text, fromName, fromEmail) function
- [ ] Request SENDGRID_API_KEY from user via webdev_request_secrets
- [ ] Build email sending queue: campaigns.send procedure processes recipients in batches
- [ ] Track delivery status: update email_campaign_recipients with sent/failed/bounced status
- [ ] Handle SendGrid webhooks for open/click tracking (POST /api/webhooks/sendgrid)
- [ ] Build unsubscribe link generator: {{unsubscribe_url}} placeholder in templates
- [ ] Build unsubscribe landing page: GET /unsubscribe?token=xxx → mark user as unsubscribed from org
- [ ] Respect unsubscribe status: filter out unsubscribed users before sending campaigns

### Email Templates
- [ ] Build 5 default email templates: Welcome, Course Enrollment, Course Completion, Newsletter, Announcement
- [ ] Each template includes: subject line, HTML body, plain text fallback, merge tags ({{user_name}}, {{org_name}}, {{course_title}}, {{unsubscribe_url}})
- [ ] Seed default templates for each org on first access to email marketing page
- [ ] Build template editor UI: rich text editor for HTML body, plain text textarea, subject line input
- [ ] Allow org admins to customize templates: edit subject, body, add custom CSS, preview before saving
- [ ] Template preview modal: show rendered HTML with sample merge tag values
- [ ] Template duplication: "Duplicate Template" button creates a copy for customization

### Email Marketing UI
- [ ] Build EmailMarketingPage at /lms/email-marketing (visible to org admins and site owner)
- [ ] Add "Email Marketing" nav link to Administration section in DashboardLayout
- [ ] Campaign list view: show all campaigns with status, recipient count, open rate, click rate, sent date
- [ ] Campaign creation wizard: Step 1 - Select template, Step 2 - Customize subject/body, Step 3 - Select audience, Step 4 - Schedule or send now
- [ ] Audience selector: All members, Enrolled in specific course, Completed specific course, Custom filter (role, join date range)
- [ ] Campaign preview: show recipient count, preview email with merge tags resolved
- [ ] Send confirmation dialog: "Send to X recipients now?" with final preview
- [ ] Campaign detail page: show send status, recipient list with open/click status, resend to failed recipients
- [ ] Template management page: list all templates, create/edit/delete/duplicate
- [ ] Unsubscribe management page: list all unsubscribed users per org, allow manual re-subscription

### Site Owner → Org Admin Communication
- [ ] Site owner can send campaigns to "All Org Admins" audience
- [ ] Site owner email marketing page shows campaigns sent to org admins vs org members
- [ ] Org admins cannot see site owner's campaigns to other orgs
- [ ] Site owner campaigns use site-level unsubscribe (not org-level)

### Testing
- [ ] Write vitest tests for email sending, unsubscribe flow, audience filtering
- [ ] Test SendGrid integration with test API key
- [ ] Test merge tag replacement in templates
- [ ] Test org-level unsubscribe isolation (unsubscribe from Org A, still receive from Org B)

## Custom Sender Domain/Email for Org Admins (Builder+ Tier)
- [ ] Add customSenderEmail and customSenderName columns to organizations table
- [ ] Add senderDomainVerified boolean column to organizations table
- [ ] Add senderDomainVerifiedAt timestamp to organizations table
- [ ] Build UI in org settings for Builder+ admins to set custom from name and email
- [ ] Validate custom email domain against org subscription tier (Builder and above only)
- [ ] Use custom sender email/name when sending campaigns for that org (fall back to hello@teachific.net for Free/Starter)
- [ ] Show "Custom Sender" badge in email marketing page when custom domain is active
- [ ] Show upgrade prompt for Free/Starter orgs trying to set custom sender

## Fix Custom CSS Injection Scope
- [ ] Remove custom CSS injection from admin dashboard / DashboardLayout
- [ ] Apply org custom CSS only to student-facing routes: course player, course catalog, learner dashboard, enrollment pages, certificate pages, public custom pages
- [ ] Build a StudentLayout wrapper that loads the active org's custom CSS and injects it into a <style> tag scoped to student pages
- [ ] Admin dashboard always uses Teachific default branding (no custom CSS override)
- [ ] Custom CSS editor in org settings should preview in a student-page context, not admin context

## Platform Admin Nav Fix
- [x] Remove Platform Admin header button from DashboardLayout top bar
- [x] Platform Admin remains in profile dropdown (site_owner/site_admin only)
- [x] Profile menu order: Profile, Organization Settings, (divider), Platform Admin [admin only], (divider), Sign Out

## Sidebar Settings → Org Setup
- [x] "Settings" link in sidebar nav now points to /lms/settings (org settings page)
- [x] Profile dropdown "Settings" now says "Organization Settings" and points to /lms/settings
- [ ] Create OrgSettingsPage at /lms/settings with tabs: General, Branding, Domain, Email Sender, Subscription
- [ ] General tab: org name, slug, description, contact email
- [ ] Domain tab: custom domain binding instructions and status
- [ ] Email Sender tab: custom from name and email (Builder+ only), with upgrade prompt for lower tiers
- [ ] Subscription tab: current plan, usage stats, upgrade CTA

## Branding Page: Logo Upload
- [ ] Add logo upload section to BrandingPage (org logo used in student-facing pages, school page, course player header)
- [ ] Upload logo to S3 via storagePut, save URL to org record (organizations.logoUrl column already exists)
- [ ] Show current logo preview with remove button
- [ ] Logo accepted formats: PNG, JPG, SVG, WebP — max 2MB
- [ ] Logo displayed in: SchoolPage header, CoursePlayerPage header, email templates (org logo)

## Bug: Add Course → 404
- [x] Fix /lms/courses/new route — "new" is being matched as :id by the dynamic route, causing 404
- [x] Ensure /lms/courses/new is declared before /lms/courses/:id in App.tsx router
- [x] Add /lms/courses/:id/curriculum, /settings, /pricing, /drip, /after_purchase routes to App.tsx
- [x] CourseBuilderPage derives active tab from URL sub-path

## Org Admin Dashboard Redesign
- [ ] Replace the current Dashboard.tsx with an org-focused analytics dashboard
- [ ] Welcome header with org name and greeting
- [ ] Key metrics cards: Total Revenue (past 30 days), New Registrations (past 30 days), Course Sales (past 30 days), Active Members
- [ ] Revenue/enrollment chart with daily/weekly/monthly toggle (line chart showing revenue or enrollment trend)
- [ ] Live activity feed (right sidebar): recent enrollments, course purchases, logins — show user name, course name, timestamp, price (if sale)
- [ ] Recently edited courses section: grid of course cards with thumbnail, title, status badge (Published/Draft), last edited timestamp
- [ ] All data scoped to the org admin's organization (org_admin sees their org only, site_owner/site_admin see all orgs or selected org)

## Member (Learner) Dashboard
- [ ] When logged-in user role is "user" (org member), show a learner home dashboard instead of the admin dashboard
- [ ] Display course cards for all courses the member is enrolled in or has access to
- [ ] Each card shows: course thumbnail, title, org name, progress bar (% complete), "Continue" or "Start" button
- [ ] Group by: In Progress, Not Started, Completed
- [ ] If no courses, show a friendly empty state with a link to the course catalog
- [ ] Role-based routing: org_admin and above → org admin dashboard; user role → learner dashboard

## Full WYSIWYG Drag-and-Drop Page Builder
- [ ] Replace simple text editor with a full block-based page builder
- [ ] Left panel: section type library (Banner, Text+Media, Image Block, CTA, Course Outline, Video, Testimonials, Pricing, Checklist, Social Proof, HTML Block)
- [ ] Canvas: live WYSIWYG preview with click-to-edit inline editing
- [ ] Drag to reorder sections (dnd-kit)
- [ ] Each block has a settings panel (background color, text, image URL, button text/link, etc.)
- [ ] Banner block: full-width hero with background image/color, headline, subtext, CTA button
- [ ] Text & Media block: left/right image + text layout
- [ ] Image Block: gallery or single image with caption
- [ ] CTA block: centered headline + button
- [ ] Course Outline block: pulls curriculum from a selected course
- [ ] Video block: embed YouTube/Vimeo or upload
- [ ] Testimonials block: quote cards with avatar, name, role
- [ ] Pricing block: shows pricing options from a selected course
- [ ] Checklist block: bullet list with checkmark icons
- [ ] HTML block: raw HTML/CSS/JS injection
- [ ] Page settings panel: slug, SEO title/description, show/hide header+footer
- [ ] Save and publish controls
- [ ] Public renderer at /p/:slug for published pages

## Org Auto-Detection (No Manual Org Selection for Org Admins)
- [ ] Org admins should never see an org selector dropdown — their org is auto-detected from their membership
- [ ] All lmsRouter dashboard/analytics/course procedures should derive orgId from ctx.user's org membership, not from input
- [ ] If a user is admin of multiple orgs, show an org switcher in the header (not a dropdown on every page)
- [ ] Platform Admin pages are the only place where org filtering/sorting by organization is shown

## Nav Restriction: Platform Admin Items Stay in Platform Admin
- [ ] Remove any org-level filtering/sorting from the sidebar nav menu items
- [ ] Sidebar nav items (Courses, Members, Analytics, etc.) should be scoped to the user's current org automatically
- [ ] Organization selector/filter belongs only in Platform Admin panel

## Course Image Upload in Course Settings
- [ ] Add thumbnail/cover image upload to course settings (General tab in CourseBuilderPage)
- [ ] Upload via S3 storagePut, store URL in courses.thumbnailUrl
- [ ] Show thumbnail on course cards in CoursesPage and learner dashboard

## Pricing Plan Improvements
- [ ] Add "Free" option as a primary pricing type (no payment required, instant enrollment)
- [ ] Add "Monthly Payment Plan" option: total price divided into N monthly payments
- [ ] Payment plan fields: number of payments (e.g. 3), amount per payment, total price
- [ ] Show payment count on pricing cards (e.g. "3 payments of $33.33")
- [ ] Primary pricing section: Free / One-time / Subscription / Payment Plan radio selector
- [ ] Additional pricing options: allow multiple pricing tiers per course
- [ ] Copy enrollment link button per pricing option

## Course Builder Content Editor Improvements
- [ ] Move lesson content editor from left slide-out to a right-side panel (full height, wide enough for proper editing)
- [ ] Editor panel should keep curriculum list visible on the left while editor opens on the right
- [ ] Add AI content generator button in the lesson editor toolbar
- [ ] AI generator: prompt input → generates lesson text, summaries, quiz questions, or outlines
- [ ] AI generator uses invokeLLM server-side via a new tRPC mutation (lms.lessons.generateContent)
- [ ] Show generated content in a preview/insert dialog before applying to the editor

## Lesson Banner Editor Improvements
- [ ] Add left/right popout position toggle for the popout banner type (currently only supports left)
- [ ] Add image upload support for banner images (not just URL entry)
- [ ] Image upload should use storagePut to upload to S3 and return the public URL
- [ ] Store the uploaded image URL in the banner config (startBanner.imageUrl, completeBanner.imageUrl)

## Course Builder Right Panel Width
- [x] Widen the right slide-out lesson editor panel to cover 72vw (was max-w-2xl = 672px)
- [x] Panel now overlays the curriculum list with proper width for content editing

## Sound Preview Fix in Banner Editor
- [ ] Fix sound preview buttons — Pixabay CDN URLs are unreliable/blocked
- [ ] Upload 5 reliable notification sounds to Teachific CDN (chime, bell, success, fanfare, ding)
- [ ] Replace BANNER_SOUNDS URLs with CDN-hosted versions

## Auto-Open Lesson Editor on New Lesson
- [ ] When a new lesson is created in CourseBuilderPage, automatically open the lesson editor panel (LessonEditorSheet) for the newly created lesson
- [ ] No need for the user to click "Edit" after adding a lesson — editor opens immediately

## Bug: Web Link Lesson Save Error
- [x] Fix updateLesson mutation sending null for packageId, quizId, durationSeconds — should send undefined (omit) instead of null
- [x] Strip null values from the form payload before calling updateLesson mutation in LessonEditorSheet

## Quiz & Exam Question Type Overhaul
- [ ] Remove dependency on pre-existing question bank for exams — allow standalone question creation
- [ ] Add AI question generator: prompt → auto-generate multiple choice, T/F, short answer questions
- [ ] Support question types: Multiple Choice, Short Answer, Long Answer (essay), True/False, Hotspot (point to area in image), Match Items (words ↔ words, words ↔ images)
- [ ] Each question can have: image upload, video upload, YouTube/Vimeo URL embed, file link
- [ ] Hotspot question: upload an image, draw clickable regions on it, student clicks the correct region
- [ ] Match Items: drag-and-drop pairs, support image thumbnails on either side of the pair
- [ ] Short/Long Answer: configurable word/character limits, optional rubric for grading
- [ ] All question types support rich text in the question stem (bold, italic, lists, code)
- [ ] Quiz/Exam builder: add questions manually, import from question bank, or AI generate
- [ ] Question bank: tag questions by topic/difficulty, reuse across multiple quizzes/exams

## Feature: Public Page Renderer + Block/Page Clipboard
- [x] Public page renderer at /p/:slug (published custom pages accessible publicly)
- [x] Block clipboard in PageBuilder: copy individual blocks to clipboard, paste into any page
- [x] Full page duplication in CustomPagesPage (duplicate page with all blocks)

## Feature: Course URL Display in Settings
- [x] Show full course URL (origin + /lms/courses/:slug) below slug field in Course Settings
- [x] One-click copy button to copy the full URL to clipboard

## Feature: Comprehensive Member Activity Tracking
- [ ] Add member_activity_events table (eventType, userId, orgId, courseId, lessonId, pageUrl, metadata, sessionId, durationMs, createdAt)
- [ ] Backend batch-insert procedure for activity events (fire-and-forget, no auth required for embed)
- [ ] useActivityTracker hook: auto page view on route change, session heartbeat every 30s, video play/pause/complete, click tracking
- [ ] Wire tracker into LMS DashboardLayout so it runs on every authenticated member page
- [ ] Member Activity analytics page: per-member timeline, page views, video events, session durations
- [ ] Admin can filter by member, date range, course, event type

## Feature: Student Log Reports
- [ ] member_activity_events table with full event taxonomy (page_view, video_play/pause/complete, session_heartbeat, lesson_start/complete, quiz_start/submit, click, download, enrollment, course_complete)
- [ ] Batch-insert tRPC procedure for activity events (fire-and-forget)
- [ ] useActivityTracker hook: auto page view, 30s heartbeat, video instrumentation, click tracking
- [ ] Wire tracker into LMS DashboardLayout for all authenticated pages
- [ ] Student Log Reports page: filterable by student, date range, course, event type
- [ ] Per-student timeline view with event icons and timestamps
- [ ] Summary stats: total time, pages visited, videos watched, lessons completed
- [ ] CSV export of raw event log

## Feature: Email Templates Editor (Org Settings)
- [ ] email_templates table: orgId, templateKey (welcome, enrollment, completion, quiz_result, reminder, announcement), subject, htmlBody, isEnabled, logoUrl, primaryColor, footerText
- [ ] Backend CRUD procedures for email templates
- [ ] Email Templates tab in Org Settings with template list
- [ ] Rich HTML editor for each template with variable placeholders ({{firstName}}, {{courseName}}, etc.)
- [ ] Theme customization: primary color, logo upload, footer text
- [ ] Live email preview panel (rendered HTML)

## Feature: Notification Toggles (Org-wide + Per-course)
- [ ] Add notificationSettings JSON column to org_themes (or organizations): toggles for enrollment, completion, quiz_result, reminder, announcement
- [ ] Add courseNotificationOverrides JSON column to courses table
- [ ] Notifications tab in Org Settings: org-wide on/off toggles per notification type
- [ ] Notification overrides section in Course Settings: inherit from org or override per course
- [ ] Backend procedures to get/update org notification settings and course overrides

## Feature: Web Design Blocks in Course Lesson Content
- [ ] Background Image Section block (full-width section with bg image, overlay, text overlay)
- [ ] Banner Image block (image with optional caption and link)
- [ ] CTA Section block (headline, subtext, primary button, secondary button, background color)
- [ ] Button block (single styled button with URL, style variants: primary/secondary/outline/ghost)
- [ ] Pre-formatted List blocks: Checklist (checkmarks), Icon List (custom icons), Numbered Steps, Feature Grid
- [ ] All new blocks available in PageBuilder block library and renderable in lesson content

## Feature: Digital Downloads Sales Module
- [ ] digital_products table (title, slug, description, fileUrl, fileKey, fileType, fileSize, salesPageBlocksJson, thumbnailUrl, orgId, isPublished)
- [ ] digital_product_prices table (productId, label, amount, currency, type: one_time|payment_plan, installments, installmentAmount, intervalDays)
- [ ] digital_orders table (productId, priceId, orgId, buyerEmail, buyerName, amount, status, paymentRef, accessExpiresAt, maxDownloads, downloadCount, downloadToken, createdAt)
- [ ] digital_download_logs table (orderId, productId, downloadedAt, ipAddress, userAgent)
- [ ] Backend: product CRUD, file upload to S3, order creation, download token generation
- [ ] Backend: access control check (expiry, download count limit), download log insert
- [ ] Backend: download notification email on purchase
- [ ] Admin: DigitalProductsPage (list, create, publish/unpublish)
- [ ] Admin: DigitalProductEditorPage (file upload, pricing plans, sales page builder, access controls)
- [ ] Public: /shop/:slug sales page with product info, pricing, buy button
- [ ] Checkout: payment form (single payment + payment plan), order confirmation page
- [ ] Secure download: /api/download/:token endpoint with access control
- [ ] Admin: Digital Downloads Reports (orders table, download logs, per-buyer access status)
- [ ] Sidebar nav entry for Digital Downloads under admin section

## Feature: Webinar Module
- [ ] Webinar DB tables: webinars, webinar_registrations, webinar_sessions, webinar_funnel_steps
- [ ] Backend tRPC procedures: webinar CRUD, registration, session tracking, funnel steps, AI viewer count
- [ ] WebinarsPage admin list
- [ ] WebinarEditorPage: details, video (upload/embed/Zoom/Teams), schedule, AI viewers, funnel builder
- [ ] Public registration page /webinar/:slug/register with countdown timer and sales page blocks
- [ ] Webinar room /webinar/:slug/watch: video player, AI viewer ticker, live chat, post-webinar offer overlay
- [ ] Post-webinar funnel: CTA to product, custom URL, or thank-you page
- [ ] Webinar Reports page: registrations, attendance, funnel conversion, drop-off
- [ ] Wire routes and sidebar nav for webinars

## Feature: Mobile Responsiveness (All Admin & Org Pages)
- [ ] DashboardLayout: collapsible drawer sidebar on mobile, hamburger menu button
- [ ] OrganizationsPage: card/list layout on mobile instead of table
- [ ] UsersPage: card/list layout on mobile
- [ ] MembersPage: card/list layout on mobile
- [ ] AnalyticsPage: responsive stat cards and charts
- [ ] BrandingPage: responsive form layout
- [ ] CustomPagesPage: responsive table/list
- [ ] OrgSettingsPage: responsive tabs
- [ ] CourseBuilderPage: scrollable tab bar on mobile (done), responsive content
- [ ] MediaLibraryPage: stacked layout on mobile (no two-panel split)
- [ ] QuizBuilderPage: responsive question list
- [ ] WebinarsPage: responsive card/list
- [ ] DigitalProductsPage: responsive card/list

## Session: Mobile Responsiveness + New Features (Apr 2, 2026)
- [x] DigitalProductsPage: mobile card layout with dropdown actions
- [x] WebinarsPage: mobile card layout with dropdown actions
- [x] AdminUsersPage: mobile card row layout (hidden desktop columns on mobile)
- [x] MembersPage: responsive stats grid (1 col on mobile, 3 on sm+)
- [x] AdminOrgsPage, AdminPermissionsPage, AdminSettingsPage, PlatformAdminPage: responsive padding
- [x] DigitalProductEditorPage: all 2-col and 3-col grids responsive
- [x] WebinarEditorPage: all 2-col and 3-col grids responsive, tabs scrollable on mobile
- [x] CourseBuilderPage: all 2-col grids responsive
- [x] CoursesPage: stats grid and form grids responsive
- [x] BrandingPage, LmsAnalyticsPage: responsive padding
- [x] SchoolPage: stats grid responsive
- [x] OrgSettingsPage: tab bar scrollable on mobile (overflow-x-auto)
- [x] Digital Downloads route wired to /admin/downloads in App.tsx
- [x] Webinars route wired to /lms/webinars in App.tsx
- [x] Activity Log route wired to /lms/activity in App.tsx
- [x] DashboardLayout sidebar: Digital Downloads, Webinars, Activity Log nav items added
- [x] WebinarEditorPage: removed self-wrapping DashboardLayout
- [x] OrgSettingsPage: Email Templates tab added (list of 6 template types with Edit buttons)
- [x] OrgSettingsPage: Notifications tab added (5 toggle switches + course-level override info)
- [x] StudentLogReportsPage: built at /lms/activity with org picker, filters (student, course, event type, date range, search), summary stats, mobile card + desktop table layout, CSV export, pagination

## Bug Fixes Reported Apr 2, 2026 (Mobile Screenshots)
- [x] BrandingPage: remove "Admin Dashboard" tab - branding should only affect student-facing school, not admin UI
- [x] BrandingPage: fix page description to say "student school" not "admin dashboard and student school"
- [x] BrandingPage: add org logo upload section (PNG/JPG/SVG, max 2MB, stored in S3, shown on school page and course player)
- [x] DashboardLayout sidebar: restore styled "teach" + "ific" teal + "™" text lockup
- [x] DashboardLayout mobile header: styled Teachific™ logo lockup when no active page
- [x] Notification Settings wired to backend (lms.notifications procedures)
- [x] Email Templates tab wired to emailBranding backend (logo, color, footer, sender name)
- [x] LMS Dashboard page at /lms with metrics, revenue chart, recent activity, recent courses
- [x] My Courses (Learner Dashboard) page at /lms/my-courses
- [x] MembersPage rebuilt with full enrollment data, CSV export, manual enrollment dialog
- [x] AdminOrgsPage: edit/delete org actions with confirmation dialogs
- [x] CoursesPage: status filter tabs (All, Published, Draft, Archived)
- [x] Digital Downloads Reports page at /admin/downloads/reports
- [x] Webinar Reports page at /lms/webinars/reports
- [x] Email Marketing page at /lms/email-marketing with campaign CRUD and stats
- [x] Sidebar: Downloads Reports, Webinar Reports, Email Marketing links added
- [x] lmsDb: getMembersWithEnrollments, email campaign CRUD helpers added
- [x] lmsRouter: emailMarketing router, members.listWithEnrollments, members.manualEnroll added
- [x] routers.ts: orgs.delete procedure added

## Lesson-Level Settings + Prerequisite Gating (Apr 2, 2026)
- [x] Add lesson settings columns to DB: isPrerequisite, requiresCompletion, passingScore, allowSkip, estimatedMinutes
- [x] Generate and apply migration SQL (0021_giant_blo...)
- [x] Update updateLesson procedure to accept all new fields (lmsRouter.ts)
- [x] Add prerequisite gating section to LessonEditorSheet Settings tab
  - Prerequisite Gate toggle (isPrerequisite) with explanation
  - Require Completion toggle (requiresCompletion)
  - Allow Skip toggle (allowSkip)
  - Passing Score input (passingScore, for quiz/exam lessons)
  - Estimated Time input (estimatedMinutes)
- [x] Enforce gating in CoursePlayerPage: isLessonLocked() checks all prior prerequisite lessons
- [x] Show lock icon + 'Locked' label in lesson sidebar for gated lessons
- [x] Show 'Gate' badge on prerequisite lessons that are not yet completed
- [x] Show 'Prerequisite' badge in lesson header when lesson is a gate
- [x] Show locked overlay in main content area with link to prerequisite lesson
- [x] Block handleLessonClick for locked lessons with toast error naming the blocking lesson
- [x] Save checkpoint

## Sidebar Navigation Cleanup (Apr 2, 2026)
- [x] Merge "Dashboard" + "LMS Dashboard" into single "Dashboard" → /lms
- [x] Remove "My Courses" from sidebar top group (learner view accessible from Dashboard or Courses)
- [x] Group content items together: Courses, Digital Downloads, Webinars (in that order, under a CONTENT section label)
- [x] Remove "Downloads Reports" from sidebar
- [x] Remove "Webinar Reports" from sidebar
- [x] Remove "Activity Log" from sidebar (link from Analytics page instead)
- [x] Add "Reports" button/link inside DigitalProductsPage → /admin/downloads/reports
- [x] Add "Reports" button/link inside WebinarsPage → /lms/webinars/reports
- [x] Add report links to AnalyticsPage (Downloads Reports, Webinar Reports, Activity Log)
- [x] Keep final nav order: Dashboard, Media Library, [CONTENT: Courses, Digital Downloads, Webinars], Members, [ADMINISTRATION: Organizations, Users, Analytics, Branding, Custom Pages, Email Marketing, Settings]

## User Management Enhancements (Apr 2, 2026)
- [x] Backend: createUser procedure (name, email, password, role, orgId)
- [x] Backend: updateUser procedure (role, org assignment, name, email)
- [x] Backend: listUsersWithOrg procedure (includes org name column, searchable by org for platform admins)
- [x] Backend: assignUserToOrg procedure (platform admin only)
- [x] Backend: enrollUserInCourses procedure (bulk enroll user in selected courses)
- [x] AdminUsersPage: Add User button + dialog (name, email, temp password, role, org assignment for platform admins)
- [x] AdminUsersPage: Edit User sheet/dialog (role, org, enroll in courses)
- [x] AdminUsersPage: search includes organization column for platform admins
- [x] AdminUsersPage: org filter dropdown for platform admins
- [x] MembersPage: Add Member button + dialog (name, email, role, course enrollment)
- [x] MembersPage: Edit Member sheet (role change, course enrollment)
