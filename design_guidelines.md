# Crime Reporter & Safety Assistant - Design Guidelines

## Design Approach

**Selected Framework:** Design System Approach - Material Design 3 Principles
**Rationale:** Safety-critical application requiring clear hierarchy, immediate recognition, and consistent interaction patterns. Users need quick access to emergency features without cognitive load.

**Core Design Principles:**
1. **Clarity over creativity** - Every element must be immediately understandable
2. **Accessibility first** - High contrast, large touch targets, clear status indicators
3. **Speed of recognition** - Users should find critical features (SOS) instantly
4. **Trust through consistency** - Familiar patterns reduce anxiety in emergency situations

---

## Typography

**Font Family:** Inter (via Google Fonts CDN) - excellent readability, professional, works well at all sizes

**Type Scale:**
- **Hero/Dashboard Title:** text-4xl font-bold (36px)
- **Section Headings:** text-2xl font-semibold (24px)
- **Subsection/Card Titles:** text-lg font-semibold (18px)
- **Body Text:** text-base font-normal (16px)
- **Labels/Metadata:** text-sm font-medium (14px)
- **Helper Text:** text-xs font-normal (12px)

**Hierarchy Rules:**
- Dashboard sections use clear heading levels (h1 → h2 → h3)
- Emergency features (SOS) use larger, bolder typography
- Data-heavy sections (crime stats) use tabular numbers with consistent alignment

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistent rhythm
- Tight spacing: p-2, gap-2 (8px) - within cards, form groups
- Standard spacing: p-4, gap-4 (16px) - card padding, component gaps
- Section spacing: p-6, gap-6 (24px) - between major sections
- Large spacing: p-8, gap-8 (32px) - dashboard sections, hero areas
- Extra large: p-12, p-16 (48-64px) - major section separators

**Grid Structure:**
- Dashboard: Sidebar (fixed 256px) + Main content area (flex-1)
- Responsive breakpoints: Mobile (stack), Tablet (md:), Desktop (lg:)
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for features
- Max container width: max-w-7xl for main content areas

**Container Hierarchy:**
- Full viewport layouts for maps and heatmaps
- Contained layouts (max-w-6xl) for dashboard content
- Narrow forms (max-w-md) for login/register

---

## Component Library

### Navigation
- **Sidebar Navigation:** Fixed left sidebar with icon + label for main features (Dashboard, SOS, Safe Places, Crime Map, Contacts, Profile)
- **Mobile:** Bottom navigation bar or hamburger menu
- **Header:** Minimal top bar with user info and logout

### Authentication Pages
- **Layout:** Centered card (max-w-md) on full-screen background
- **Forms:** Stacked inputs with clear labels, generous spacing (gap-4)
- **OTP Input:** Large, separated number boxes for verification code
- **CTA Buttons:** Full-width primary buttons

### Dashboard Cards
- **Structure:** Rounded-lg cards with shadow-sm, p-6 padding
- **Card Header:** Title + optional action button
- **Card Body:** Content with appropriate spacing
- **Data Display:** Use definition lists (dl/dt/dd) for key-value pairs

### SOS Button (Critical Feature)
- **Position:** Fixed bottom-right (fixed bottom-8 right-8) on mobile/tablet, prominent in dashboard center on desktop
- **Size:** Large circular button (w-32 h-32 md:w-40 md:h-40)
- **Visual Treatment:** High contrast with red accent, pulsing animation when activated
- **Label:** Clear "SOS" text with "Press for Emergency" subtitle
- **Touch Target:** Minimum 44×44px (exceeds this)

### Emergency Contacts
- **List View:** Card-based list with contact name, phone, edit/delete actions
- **Add Form:** Simple 2-field form (name + phone) with validation
- **Empty State:** Helpful illustration with "Add your first emergency contact" prompt

### Location & Map Components
- **Map Container:** Full-width map embed (h-64 to h-96) with zoom controls
- **Location Display:** Card showing lat/long, address, timestamp of last update
- **Live Indicator:** Pulsing dot showing real-time tracking status
- **Safe Places List:** Cards with icon, name, distance, "Get Directions" button

### Crime Heatmap
- **Visualization:** Full-width map with color-coded zones (green/yellow/orange/red)
- **Stats Panel:** Overlay card showing crime count, severity score, trend
- **Legend:** Clear color key explaining risk levels
- **Filters:** Toggle buttons for crime types, date ranges

### AI Insights Panel
- **Layout:** Prominent card in dashboard with distinct border
- **Icon:** AI/sparkle icon indicating Gemini integration
- **Content:** Risk score (large number with badge), bullet-point safety suggestions
- **Refresh:** Manual refresh button to get updated analysis

### Forms & Inputs
- **Input Fields:** Bordered inputs with focus states, p-3 padding
- **Labels:** Above inputs, text-sm font-medium
- **Validation:** Inline error messages in red, success states in green
- **Buttons:** 
  - Primary: Full rounded, px-6 py-3, font-semibold
  - Secondary: Outline variant
  - Danger: Red variant for delete actions

### Data Tables
- **Structure:** Responsive tables with alternating row backgrounds
- **Headers:** Sticky headers for long lists, font-semibold
- **Actions:** Icon buttons in last column
- **Mobile:** Stack into cards on small screens

---

## Responsive Behavior

**Mobile (< 768px):**
- Single column layouts
- Bottom navigation
- Stacked cards
- SOS button fixed bottom-center
- Simplified map views

**Tablet (768px - 1024px):**
- Two-column grids where appropriate
- Collapsible sidebar
- Side-by-side forms

**Desktop (> 1024px):**
- Full sidebar navigation
- Three-column grids
- Multi-panel dashboard views
- Larger map displays

---

## Images

**Hero Section (Landing Page - if implemented):**
- Large hero image showing diverse people feeling safe in urban environment
- Dimensions: Full-width, h-96 to h-screen/2
- Overlay: Dark gradient overlay (bg-gradient-to-r from-black/60 to-black/30)
- Buttons: Blurred background buttons (backdrop-blur-md bg-white/20)

**Dashboard:**
- No hero image needed - focus on functional layout
- Icons: Use Heroicons via CDN for all UI icons (solid for filled, outline for stroked)
- Map placeholders: Use actual map embeds (Google Maps/OpenStreetMap)
- Empty states: Simple illustrative icons, not full images

**Feature Icons:**
- Location pin, shield (safety), alert triangle (danger), hospital cross, police badge
- Consistent icon set throughout (Heroicons)

---

## Accessibility & States

- **Focus States:** 2px ring with offset on all interactive elements
- **Contrast:** Minimum WCAG AA compliance (4.5:1 for text)
- **Touch Targets:** Minimum 44×44px for all buttons/links
- **Screen Readers:** Proper ARIA labels, semantic HTML
- **Loading States:** Skeleton screens for data loading, spinners for actions
- **Error States:** Clear error messages with recovery actions
- **Success States:** Confirmation messages with auto-dismiss

---

## Animation Guidelines

**Use Sparingly:**
- SOS button: Subtle pulse when ready, urgent pulse when activated
- Location updates: Smooth marker transitions on map
- Data loading: Simple fade-in for new content
- Transitions: duration-200 for most interactions

**Avoid:**
- Unnecessary page transitions
- Distracting scroll animations
- Auto-playing media
- Parallax effects

---

## Special Considerations

**Emergency Context:**
- High contrast for all critical actions
- No reliance on color alone for status
- Large, clear typography for panic situations
- Obvious "cancel" options for accidental activations
- Confirmation dialogs for destructive actions only (not SOS)

**Trust Indicators:**
- Clear status messages ("Location updated 2 min ago")
- Visible connection status
- Transparent data handling notices
- Secure lock icons for authentication