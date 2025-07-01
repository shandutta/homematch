# **Product Requirements Document (PRD)**

**Product Name:** HomeMatch  
**Owner:**  
 **Updated:** 30 Jun 2025 (rev 2)

---

## **1  Problem / Opportunity**

Millennial homebuyers (starting with you and Parul) need one hub to aggregate MLS/portal listings and recent sales, score them against deeply personal criteria (kitchen spec, lawn size, safety, etc.), and surface matches before Bay‑Area inventory disappears.

---

## **2  Goals & Success Metrics**

| Goal | Metric | Target |
| ----- | ----- | ----- |
| Surface only “good‑fit” listings | % listings swiped **Right** ≥ 4★ | ≥ 75 % |
| Notify user fast | Time from portal publish → app alert | ≤ 1 hr |
| Enable joint decision‑making | \# listings with both users’ swipe decisions recorded | ≥ 80 % of viewed |
| Phase‑0 cost efficiency | Monthly infra cost | ≤ $50 |

---

## **3  User Roles & Auth**

| Role | Capabilities |
| :---- | :---- |
| **Primary user (You)** | Create / edit preference profiles, weightings, POI set |
| **Secondary user (Parul)** | Same as primary; separate swipe votes |
| **Viewer (future)** | Read‑only access |

**Auth:** Google OAuth **or** email‑plus‑password with OTP (Supabase Auth). Users share a household workspace.

---

## **4  Core Functional Requirements (Phase 0\)**

### **4.1  Listing & Sales Ingestion**

* **Hourly** scraper / API poll for:  
  * Zillow & Redfin public APIs (rate‑limited)  
  * Paid MLS vendor toggle (Phase 2) with API‑key upload  
* Normalize to unified `property` schema; dedupe  
* **Recent‑sales ingest**  
  * Default look‑back **3 mo**  
  * AI routine adjusts window per neighborhood (e.g., widen to 6–12 mo if low turnover)  
  * Universal override in Preferences UI

### **4.2  Preference Engine**

* Hard filters: price, beds/baths, min 1 800 sf, lawn ≥ 200 sf, kitchen updated ≤ 10 yrs, etc.  
* **Weightings JSON** stored per household; editable in Preferences UI.  
* Commute / POI filter: Google Distance Matrix; initial POIs pre‑seeded:  
  * **Airport:** SFO (San Francisco Intl.)  
  * **Friend 1:** 1335 Glen Eyrie Way, San Jose CA 95125  
  * **Parents:** 925 McBride Loop, San Jose CA 95125  
  * Users may add/edit/delete POIs anytime.

### **4.3  Delivery Channels (Phase 0)**

* **Daily email digest** (8 am PT): top‑10 scored listings \+ 3 notable recent sales.  
* Responsive web dashboard (Next.js PWA) — SMS / native push deferred to Phase 1.

### **4.4  UI & Interaction**

* Next.js responsive site includes:  
  * Dashboard: map \+ card feed with **Tinder‑style swipe (Left/Right) gesture** on desktop/mobile (replaces thumbs‑up/down).  
  * Preferences editor (filters, weights, POIs, sales look‑back window).  
  * Recent‑sales toggle layer with AI‑suggested look‑back tip.

### **4.5  Collaboration & History**

* Swipe decisions stored per user; shared listing view shows both users’ positions.  
* Comment thread per listing (Phase 2).

---

## **5  Non‑Functional Requirements**

| Category | Requirement |
| :---- | :---- |
| Performance | Listing ingest \< 10 min; page load \< 2 s |
| Security | OAuth/OTP; Supabase row‑level security by `household_id` |
| Cost | Vercel Hobby \+ Supabase Pro ≤ $50/mo; MLS vendor off by default |
| Scalability | 25 active users without re‑architecture |

---

## **6  Tech Stack Recommendation**

| Layer | Choice | Notes |
| :---- | :---- | :---- |
| Front‑end | **Next.js (React)** on Vercel | SSR \+ PWA, swipe support via Framer Motion |
| Back‑end | **Supabase** (Postgres \+ Auth \+ Storage) | Row‑level security, edge functions for cron |
| Scraper | Node.js edge function | Hourly; fallback RapidAPI wrappers |
| Maps & Distance | Google Maps \+ Distance Matrix API | Commute calc |
| Email | Resend / SendGrid | 10k emails free tier |
| SMS / Push | **Phase 1** — Twilio & Web Push |  |
| Wildfire data | Zillow Wildfire API (Phase 2 scoring) |  |

---

## **7  Phase Roadmap**

| Phase | Scope | Timeline |
| :---- | :---- | :---- |
| **0 – MVP** | Dashboard, swipe UI, hourly ingest, preferences UI, daily email digest | 6 wks |
| **0.1 – Local Prototype** | Basic swipe UI, Zillow API integration, backend proxy, real property display | 1 day |
| **0.2 – Cloud MVP** | Cloud deployment, multi-neighborhood support, POI integration, settings UI, expanded card view | 2 wks |

---

## **8 Version 0.1 \- Completed Features ✅**

### **What We Built (Local Prototype)**

* **Frontend:** Responsive HTML/CSS/JS app with Tinder-style swipe interface  
* **Backend:** Node.js Express server with CORS handling  
* **Data Integration:**  
  * Zillow API via RapidAPI (live property data)  
  * Google Maps API configured (ready for commute calculations)  
  * Supabase credentials configured  
* **Core Features:**  
  * Real-time property fetching from Zillow  
  * Swipe left/right functionality  
  * Match percentage display  
  * Property cards with price, location, beds/baths, sqft  
  * Stats dashboard (properties viewed, liked, matches)  
* **Development Setup:**  
  * Local development server (Python for frontend, Node for backend)  
  * API key management via .env file  
  * Mock data fallback for testing

### **Technical Achievements:**

* Successfully bypassed CORS issues with backend proxy  
* Integrated multiple third-party APIs  
* Created responsive design that works on desktop/mobile  
* Implemented real-time data fetching with proper error handling

---

## **9 Version 0.2 \- Next Steps 🚧**

### **9.1 Cloud Deployment**

* **Frontend:** Deploy to Vercel with environment variables  
* **Backend:** Deploy to Vercel Functions or Railway  
* **Database:** Initialize Supabase tables and RLS policies  
* **Domains:** Set up custom domain with HTTPS

### **9.2 Multi-Neighborhood Support**

* **AI-Powered Boundaries:** Use LLM to define neighborhood geographic boundaries  
* **Batch Fetching:** Pull properties from multiple neighborhoods simultaneously  
* **Dynamic Loading:** Initial load of 50 properties, then lazy-load as user swipes  
* **Empty State:** Prompt users to expand criteria when all properties viewed

### **9.3 POI Integration**

* **Commute Calculation:** Real-time Google Distance Matrix integration  
* **POI Management:**  
  * Add/edit/delete custom POIs  
    * Pre-seeded: SFO, Friend's house, Parents' house  
* **Display:** Show commute times on property cards  
* **Filtering:** Exclude properties exceeding max commute thresholds

### **9.4 Database & User Management**

* **Swipe Persistence:** Save all swipe decisions to Supabase  
* **User Comparison:** Show both users' swipe decisions side-by-side  
* **History View:** Access previously swiped properties  
* **Analytics:** Track swipe patterns and preferences

### **9.5 Settings & Preferences UI**

* **Hard Filters:**  
  * Price range ($1.8M \- $2.3M default)  
    * Square footage (1,800 \- 3,000 sf)  
    * Beds/baths minimums  
    * Lawn size (≥ 200 sf)  
    * Kitchen age (≤ 10 years)  
* **Weighting Sliders:**  
  * Lawn (30%)  
    * Kitchen (25%)  
    * Commute (20%)  
    * Safety (15%)  
    * View (10%)  
* **Neighborhood Selection:** Multi-select from approved list  
* **Zillow-style Filters:** Replicate additional filters from Zillow UI

### **9.6 Enhanced Property Details**

* **Expandable Cards:** Click to expand Tinder-style with full details  
* **Photo Gallery:** Swipeable photo carousel  
* **Property Details:**  
  * Full description  
    * Year built, lot size, HOA fees  
    * School ratings  
    * Walk/bike scores  
    * Neighborhood safety data  
* **Map View:** Show property location with POI distances

### **9.7 Technical Improvements**

* **Performance:** Implement caching and pagination  
* **Real-time Updates:** WebSocket for instant new listing alerts  
* **Progressive Web App:** Offline support and app-like experience  
* **Error Recovery:** Robust handling of API limits and failures

---

## **10 Embedded Home‑Purchase Preferences (snapshot)**

### **Core must‑haves loaded as default hard filters:**

* List price $1.8 – 2.3 M (stretch bid ceiling $2.5 M).  
* 1 800–3 000 sf, lawn ≥ 200 sf, kitchen updated ≤ 10 yrs.  
* Transitional style (avoid heavy wood or all‑white boxes).  
* Safe micro‑markets in: Willow Glen, Cambrian, Almaden, Los Gatos fringe, Cupertino, Palo Alto, Menlo Park, Mountain View, San Mateo, San Carlos, Belmont, western SF (Richmond, Sunset, Cole Valley, Noe, Diamond Heights, Bernal), Walnut Creek, Lafayette, Piedmont, Rockridge/Temescal, Oakland Hills, Berkeley Hills.  
* Exclude Marin, far‑northern East Bay, Fremont core.  
* Deck alone insufficient; must have usable back‑lawn.

(Full preference doc remains linked; engine references it for scoring.)

---

## **11 Implementation Priority (v0.2)**

1. ## **Week 1:**

   * Cloud deployment (Vercel \+ Supabase setup)  
     * Database schema and swipe persistence  
     * Basic settings UI

2. ## **Week 2:**

   * Multi-neighborhood search  
     * POI/commute integration  
     * Expandable card details  
     * Photo gallery

---

## **12 Open Items**

1. Confirm weight percentages (default lawn 30 %, kitchen 25 %, commute 20 %, safety 15 %, view 10 %).  
2. Define POI travel‑time thresholds (airport ≤ 45 min, parents ≤ 30 min?).  
3. Phase‑2 wildfire cost: incorporate Zillow Wildfire Risk Score & carrier quotes into scoring.  
4. NEW: Define neighborhood boundaries for AI-assisted search expansion  
5. NEW: Determine optimal batch size for property loading (50 initial, then \# per load?)

## ---

## **13 Acceptance Criteria**

### **v0.1 (COMPLETE ✅)**

* Users can view real Zillow properties in swipe interface ✔️  
  * Backend successfully fetches and transforms API data ✔️  
    * Basic filtering by price range works ✔️  
    * Swipe gestures function on desktop/mobile ✔️

### **v0.2 (In Progress)**

* Application runs entirely in cloud without local setup ⏳  
  * Properties load from all specified neighborhoods ⏳  
    * Commute times display for each property ⏳  
    * Swipe decisions persist to database ⏳  
    * Both users can see each other's swipes ⏳  
    * Settings UI allows preference customization ⏳  
    * Property cards expand to show full details ⏳  
    * Photo galleries are swipeable ⏳

## ---

## **14  References**

[S\&P House Purchase Preferences (updated 30 Jun 2025)](https://docs.google.com/document/d/1YL3FqnIAwqyw4X290J2A7hSNhI3mJQy1-D-CH4WzzsE/edit?tab=t.0)

House preferences (updated 30 Jun 2025\)

Budget & Financing • Comfort target list price: $1.8 – $2.2 M (20 % down, ≤ 38 % of net pay). • Stretch ceiling: can compete up to \~$2.4–$2.5 M *after* bidding, but prefer not to list/offer above $2.3 M. • 20 % down preferred (15 % LTV acceptable if rate competitive and preserves cash).

Must‑Have Features • Dedicated den or media room for loud movie watching. • Interior style: transitional—clean modern lines with a touch of character; avoid ultra‑historic, heavy‑wood, or sterile all‑white spaces. • Floor‑plan geometry: avoid odd or highly angular room shapes; prefer clean, rectangular flow. • Hardwood floors preferred; cabinetry should feel current (wood OK); limit carpet to bedrooms. • **Kitchen expectations:** updated within last 10 years, full‑size, open to dining/living areas; no cramped galley layouts or vintage ranges. • Living area sweet spot 1,800–3,000 sf; \>3,200 sf generally more space than needed. • Move‑in ready: recent roof, HVAC, electrical, plumbing. • Curb appeal: landscaped approach with minimal concrete; front lawn optional. • **Back‑yard requirement:** fully fenced, usable grass lawn (≥ 200 sf) in addition to any deck or patio—deck alone is not sufficient. • Safe, low‑crime neighborhood more important than school ratings. • Prefer single‑family detached; reasonable HOA acceptable if it adds value. • Defined entry/foyer or mud‑room buffer preferred—avoid layouts where front door opens directly into main living space. • Modern energy‑efficient features (EV‑ready garage, dual‑pane windows, updated insulation). • Fireplaces fine if design complements interior; avoid overly plain inserts. • Open flow with clearly defined living, dining, and media zones. • Colour palette: balanced warm or neutral tones; avoid interiors dominated by very dark/black modern themes.

Geographic Preferences • South Bay / Silicon Valley: Willow Glen, Cambrian, Almaden, Los Gatos fringe, Cupertino, Palo Alto, Menlo Park, Mountain View, San Mateo. • Peninsula/SF: San Carlos, Belmont, western SF neighborhoods (Richmond, Sunset, Cole Valley, Noe Valley—especially Noe\!, Diamond Heights, Bernal Heights), South SF. • East Bay: Walnut Creek, Lafayette, Piedmont, Rockridge/Temescal, Oakland Hills, Berkeley Hills. • Diversity important: prefer mixed‑demographic neighborhoods; avoid areas overwhelmingly centered on a single community (e.g., Fremont core, certain Sunnyvale pockets).

Nice‑to‑Haves • Bay or city views (bonus but not required). • Shade trees and established landscaping. • Architectural interest—avoid blank “window wall” rears; interesting yard elevation or façade. • Recent interior design with balanced wood and modern finishes; avoid excessive white marble. • Distinctive design welcome, but avoid homes that feel like museum pieces.

Resale Considerations • Good school districts boost resale, though not a current priority. • HOA acceptable if it supports neighborhood quality and amenities without onerous restrictions.