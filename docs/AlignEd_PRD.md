# AlignEd: Enterprise Product Requirements Document (PRD)

---

## Executive Summary
AlignEd is a web-based academic and career decision support system designed specifically for Senior High School (SHS) students in Central Luzon, Philippines. The platform addresses the critical challenge of academic misalignment driven by financial constraints, familial expectations, and peer pressure. By integrating a RIASEC-based personality assessment, an AI-driven recommendation engine, a localized university directory, and innovative exploration tools like an AR Career Preview and a "Future Self" text simulation, AlignEd provides a unified, data-driven interface to empower students in making informed professional choices.  

## Product Vision
To be the definitive, intelligent career guidance infrastructure for Filipino students, transforming the daunting college transition into a data-driven, self-actualizing journey that aligns natural aptitude with accessible educational opportunities.

## Problem Statement
The transition to higher education in the Philippines involves complex decision-making heavily influenced by parental expectations, peer pressure, and financial instability. Often, students prioritize practical or socially expected paths over their inherent interests. This misalignment occurs because students lack exposure to structured assessments and organized career information. Consequently, students enroll in mismatched programs, leading to career dissatisfaction, diminished well-being, and a workforce lacking enthusiasm and motivation.  

## Goals & Objectives
* **Analyze User Challenges:** Identify and address uncertainties in interests, lack of reliable information, and external pressures facing SHS students.  
* **Design Scalable Architecture:** Architect a robust database and user interface supporting efficient data processing and seamless user interaction.  
* **Develop Core Modules:** Implement the RIASEC Personality Assessment, Course/Career Recommendation Module, and a localized University Directory.  
* **Enhance Decision Support:** Provide detailed course breakdowns, including pros, cons, and subjects.  
* **Integrate Innovative Exploration:** Deploy a basic AR Career Preview and a "Future Self" text simulation.  
* **Ensure System Efficacy:** Rigorously test functionality and evaluate the platform's effectiveness in improving student confidence in career selection.  

## User Personas

| Persona Name | Role | Pain Points | Primary Goal |
| :--- | :--- | :--- | :--- |
| **The Undecided Student** | Grade 12 SHS Student in Central Luzon | Overwhelmed by choices; pressured by parents to take nursing/engineering; unaware of personal strengths. | To discover a course that matches their personality and is offered in a nearby, affordable university. |
| **The Pragmatic Dreamer** | Grade 11 SHS Student | Wants to pursue arts but fears financial instability; lacks data on career outcomes. | To find realistic career trajectories and understand the pros and cons of their desired program. |
| **The Guidance Counselor (Secondary)** | High School Faculty | Managing hundreds of students manually; lacks modern tools to provide targeted advice. | To use aggregated, data-driven insights to guide students more effectively. |

## Functional Requirements
* **User Registration & Authentication:** Secure sign-up/login via email or OAuth, capturing basic student demographics.
* **RIASEC Assessment Engine:** A dynamic questionnaire calculating dominant personality traits based on Holland's model.  
* **Matching Algorithm:** Logic to map the calculated RIASEC profile to specific college programs and career paths.  
* **Central Luzon HEI Directory:** A searchable, filterable database of Higher Education Institutions (HEIs) offering the recommended courses.  
* **Course Detail Interface:** Pages displaying curriculum highlights, pros/cons, and career outlooks for specific degrees.  
* **AR Preview Trigger:** Browser-based interface utilizing the device camera to project marker-based career visuals.  
* **Simulation Generator:** A text-based engine producing narrative descriptions of a typical day in a suggested profession.  

## Non-Functional Requirements
* **Performance:** The platform must achieve a minimum Lighthouse score of 90+ across Performance, Accessibility, and SEO.
* **Responsiveness:** Mobile-first design is mandatory, ensuring parity across desktop, tablet, and low-end mobile devices.
* **Accessibility:** WCAG 2.1 AA compliance, including keyboard navigability and screen reader support.
* **Concurrency:** Architecture must support at least 5,000 concurrent assessment sessions without degradation in response time.
* **Data Integrity:** Secure storage of psychometric data with rigid adherence to the Data Privacy Act of 2012 (Philippines).

---

## System Architecture

The conceptual framework operates on an Input-Process-Output model.  

* **Input Layer:** Ingests student data, personality assessment responses, and maintains static databases of HEIs, programs, and careers.  
* **Process Layer:** An AI-driven recommendation system processes inputs. The engine executes the matching of traits to appropriate academic and professional paths. It handles interactions, forum data, and continuous information retrieval.  
* **Output Layer:** Delivers personalized recommendations based on the RIASEC profile. Generates the mapped list of suitable HEIs and programs. Exposes peer-support forum access.  

**Technical Architecture Diagram (Descriptive):**
* **Client:** Next.js 15 App Router running on Vercel Edge Network.
* **State:** React Context for session state; Zustand for complex client-side interactions (AR triggers, quiz progress).
* **Backend/BaaS:** Supabase handling PostgreSQL, Auth, and Edge Functions.
* **Communication:** REST/GraphQL via Supabase client, utilizing Next.js Server Actions for secure data mutations.

## Technical Stack Justification

| Technology | Role | Justification for Enterprise Scalability |
| :--- | :--- | :--- |
| **Next.js 15+** | Full-Stack React Framework | Leverages the App Router, Partial Prerendering, and Server Components to ship minimal JavaScript, resulting in ultra-fast page loads critical for mobile users in regions with variable internet speeds. |
| **TypeScript** | Type-safe JavaScript | Ensures maintainability, catches runtime errors during compilation, and self-documents the API contracts between the Supabase backend and Next.js frontend. |
| **Tailwind CSS** | Utility-first CSS | Enables rapid UI iteration, eliminates dead CSS code, and keeps the bundle size minuscule compared to traditional CSS frameworks. |
| **Supabase** | Backend-as-a-Service | Provides production-ready PostgreSQL, built-in connection pooling, instant APIs, and Row Level Security (RLS) out of the box, allowing the team to focus on business logic rather than infrastructure management. |
| **shadcn/ui** | Component Library | Unstyled, copy-paste components that give developers full ownership of the code, preventing vendor lock-in while ensuring accessible, high-quality base elements. |
| **Aceternity & Magic UI** | Advanced UI/Motion | Provides complex, engaging visual components (e.g., glassmorphism, advanced hero sections) to capture the attention of Gen Z users without sacrificing performance. |

---

## Database Design
The foundation is Supabase PostgreSQL.

**Core Tables:**
* `users`: UUID, email, full_name, created_at.
* `student_profiles`: user_id (FK), grade_level, school_name, location_city.
* `assessments`: id, user_id (FK), status (in_progress, completed), created_at.
* `riasec_scores`: assessment_id (FK), realistic, investigative, artistic, social, enterprising, conventional, dominant_type.
* `universities`: id, name, location, description, admission_link.
* `courses`: id, name, riasec_category, description, pros, cons.
* `university_courses`: university_id (FK), course_id (FK), estimated_tuition.

**Optimization:**
Indexes will be applied to `user_id` on all relational tables, and `riasec_category` on the `courses` table to ensure rapid recommendation querying.

## API Design Strategy
* We will rely heavily on **Next.js Server Actions** for internal mutations (e.g., submitting quiz answers) to keep the client light and secure.
* For data fetching, we will utilize **Next.js Route Handlers** combined with Supabase's native API.
* Data that does not change frequently (e.g., University Directory, Course Details) will utilize static rendering with time-based revalidation (ISR).
* User-specific data (e.g., Assessment Results, Future Self narratives) will be dynamically rendered on the server.

## Authentication & Security
* **Provider:** Supabase Auth (Email/Password + Google OAuth readiness).
* **Data Protection:** Supabase Row Level Security (RLS) will be strictly enforced. Students can only `SELECT`, `UPDATE`, or `DELETE` records where `user_id == auth.uid()`.
* **Public Data:** Tables like `universities` and `courses` will have `ENABLE ROW LEVEL SECURITY` with a policy allowing read access to `anon` and `authenticated` roles, but blocking mutations.
* **Security Headers:** Next.js middleware will inject strict Content Security Policies (CSP), X-Frame-Options, and X-Content-Type-Options.

## UI/UX Design System
* **Design Philosophy:** "Empathetic Guidance." The UI must feel welcoming, modern, and non-intimidating to teenagers.
* **Color Palette:** Calming primary tones (blues/teals) representing stability, paired with energetic accents (orange/yellow) for interactive elements and gamification.
* **Component Strategy:**
    * **shadcn/ui:** Used for forms, inputs, modals, and foundational layout elements to guarantee accessibility.
    * **Aceternity UI:** Deployed for the landing page hero section, feature highlights, and complex interactive data visualizers (e.g., RIASEC radar charts).
    * **Magic UI:** Utilized for gamified feedback, success badges upon quiz completion, and micro-interactions.
    * **Framer Motion:** Handles smooth page transitions, stagger animations on list renders, and satisfying feedback animations during the assessment quiz.
* **Accessibility:** All interactive elements must have clear focus states, ARIA labels, and maintain high contrast ratios. Dark mode will be supported natively via Tailwind.

---

## Feature Breakdown

### 1. RIASEC Assessment Module
A responsive, paginated quiz interface. Each question contributes to a running tally of the six Holland Code traits. State is preserved locally via `localStorage` to prevent data loss on refresh, syncing to Supabase via debounced Edge Functions.  

### 2. AI-Powered Course Recommendation System
Matches the computed dominant RIASEC type against the `courses` table. The algorithm will rank recommendations based on primary, secondary, and tertiary trait alignments, outputting a curated list of top 3-5 programs.

### 3. University Directory Module
A static, easily navigable directory focused exclusively on Central Luzon HEIs. Features a search bar and filters for location and course offerings.  

### 4. Course Details Module
Displays program descriptions, core subjects, potential careers, and structured pros and cons. Designed using Aceternity UI bento grids for high visual impact and readability.  

---

## AI Recommendation Architecture
While MVP relies on static database mapping, the architecture supports future ML integration.
* **Current State:** Deterministic SQL queries matching `dominant_type` to `course.riasec_category`.
* **Future Extensibility:** Supabase Vector can be introduced later. Course descriptions and student qualitative inputs can be embedded, allowing semantic similarity searches beyond simple keyword matching.

## AR Module Architecture
The AR Career Preview utilizes a lightweight approach.  
* **Implementation:** Browser-based WebAR (e.g., AR.js or MindAR) avoiding native app requirements.
* **Functionality:** Students point their mobile browser at a generated QR/marker on the screen. The browser renders a 3D asset (e.g., a stethoscope for nursing, a hardhat for engineering) superimposed on their environment.
* **Constraints:** Assets must be heavily optimized (GLTF/GLB formats under 2MB) to ensure performance on low-end devices.

## Future Self Simulation Architecture
The "Future Self" module generates a short narrative of a typical workday.  
* **MVP Approach:** Procedurally generated templates populated with variables from the database (e.g., "As a [Job Title] in [Industry], your typical day involves [Task 1]...").
* **Scalable AI Integration:** Implementation of an Edge Function calling a secure LLM API (e.g., Google Gemini).
* **Prompt Architecture:** Strict system prompts injected with the student's selected career, preventing hallucinations and enforcing safe, realistic, and locally relevant career narratives. Moderation layers will validate output before display.

---

## Scalability & Performance Planning
* **MVP Stage:** Next.js deployed on Vercel utilizing Server Components. Database connections managed by Supabase's built-in PgBouncer.
* **Mid-Scale (50-80%):** Implementation of Redis (via Upstash) for caching high-traffic static queries like the University Directory to reduce database load.
* **Production/Growth:** Edge caching via Vercel Edge Network. Implementation of rate limiting on API routes to prevent abuse. Transitioning computationally heavy tasks (like generating complex LLM narratives) to background queues using Upstash QStash.

## DevOps & Deployment
* **Hosting:** Frontend on Vercel; Backend on Supabase Cloud.
* **CI/CD:** GitHub Actions enforcing continuous integration. PRs must pass automated linting, type-checking, and unit tests before merging to the main branch.
* **Environment Management:** Strict separation of Development, Staging, and Production environments in both Vercel and Supabase.
* **Monitoring & Logging:** Integration of Sentry for real-time error tracking and performance monitoring.

## Testing Strategy
* **Unit Testing:** Vitest for testing utility functions, assessment scoring algorithms, and isolated React components.
* **Integration Testing:** React Testing Library to ensure components interact correctly with the Supabase client mock.
* **E2E Testing:** Playwright implemented to simulate full user journeys (Signup -> Assessment -> View Recommendations -> View Directory).
* **User Acceptance Testing:** Conducted locally with target SHS students to validate the "Empathetic Guidance" UX thesis.  

## Analytics & Monitoring
* **Product Analytics:** PostHog integration to track user funnels (e.g., Assessment drop-off rates, most viewed courses).
* **Performance Monitoring:** Vercel Analytics to monitor Web Vitals (LCP, FID, CLS) ensuring the mobile-first commitment is met.

---

## MVP Scope
The MVP explicitly includes the RIASEC assessment, deterministic course matching, Central Luzon university directory, static course details, basic WebAR marker triggers, and template-based text simulations. The MVP relies entirely on manually researched, static data for institutions and courses, with no live API connections to external labor markets.  

## Future Roadmap
Items intentionally excluded from MVP but architected for future integration:  
* Skills Gap Analysis tool.
* Dynamic Financial Information module and automated scholarship matching.
* Integration of TESDA Alternative Pathways.
* Real-time labor market API data feeds.
* Full-scale spatial AR environments.
* Dedicated native mobile application.

## Risks & Mitigation

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **High Assessment Abandonment** | Low completion rates | Implement gamified progress bars via Magic UI; allow progress saving to `localStorage`. |
| **Outdated Static Data** | Loss of user trust | Design a CMS dashboard allowing administrators to easily update HEI and course data without deploying code. |
| **Slow Mobile Performance** | Poor UX on budget devices | Enforce strict Next.js Image optimization; lazy load AR dependencies; keep 3D models under 2MB. |

## Development Timeline
Based on Agile methodology and an iterative SDLC model:  
* **Phase 1 (Weeks 1-2):** Architecture setup, Supabase schema configuration, CI/CD pipeline, basic auth flows.
* **Phase 2 (Weeks 3-4):** UI Component library initialization, RIASEC assessment frontend/backend logic.
* **Phase 3 (Weeks 5-6):** Recommendation engine, University Directory, and Course Details interfaces.
* **Phase 4 (Weeks 7-8):** Integration of AR WebXR tools and Future Self simulation logic.
* **Phase 5 (Weeks 9-10):** E2E testing, performance optimization, UAT, and final deployment adjustments.

---

## Suggested Folder Structure

align-ed/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (auth)/             # Authentication routes
│   │   ├── (dashboard)/        # Post-login routes
│   │   ├── api/                # Route handlers
│   │   └── layout.tsx
│   ├── components/             # Reusable UI architecture
│   │   ├── ui/                 # shadcn core components
│   │   ├── aceternity/         # Complex animated blocks
│   │   ├── magic/              # Micro-interactions
│   │   └── shared/             # Domain-specific components
│   ├── lib/                    # Utilities and clients
│   │   ├── supabase/           # Client/Server auth helpers
│   │   └── utils.ts
│   ├── types/                  # TypeScript definitions
│   └── store/                  # Zustand state management
├── supabase/                   # Backend configurations
│   ├── migrations/
│   └── functions/              # Edge functions
├── public/                     # Static assets & AR models
└── tests/                      # Playwright E2E specs

## Engineering Best Practices
* **Client vs. Server Components:** Default strictly to Server Components. Only apply "use client" at the lowest possible leaf node in the component tree to minimize client-side JavaScript.

* **Data Fetching:** Fetch data close to where it is used. Avoid global state for server data; rely on React Server Components for prop drilling mitigation.

* **Commit Standards:** Enforce Conventional Commits (e.g., feat:, fix:, chore:) to automate semantic versioning and changelog generation.

## Conclusion
AlignEd represents a paradigm shift in how Filipino students navigate their academic futures. By utilizing modern web architecture (Next.js 15, Supabase) combined with highly engaging UI systems (shadcn, Aceternity, WebAR), this system scales gracefully from a focused thesis project to an enterprise-grade startup platform, fulfilling the core mission of transforming confusion into clarity.