# Design System Document

## 1. Overview & Creative North Star: "The Neon Pulse"
This design system moves beyond the generic social media grid to create a high-end, editorial-inspired digital ecosystem. Our Creative North Star is **"The Neon Pulse"**—an aesthetic that balances the architectural depth of a premium dark-mode interface with the energetic, high-contrast vibrations of youth culture. 

Unlike standard "flat" dark modes, this system utilizes intentional asymmetry and tonal layering to drive focus. We create immersion through "Atmospheric Depth," where the interface feels like it has physical volume, achieved through stacked transparencies and blurred light sources rather than heavy lines and shadows.

---

## 2. Colors: Tonal Architecture
The palette is rooted in a deep charcoal base, punctuated by high-octane accents that "glow" against the darkness.

### Core Tokens
- **Background (`#0e0e0f`):** The absolute foundation.
- **Primary - Electric Blue (`#8ff5ff`):** Used for primary CTAs and critical focus points.
- **Secondary - Neon Purple (`#d575ff`):** Used for community-driven actions and expressive elements.
- **Tertiary - Bright Teal (`#aaffdc`):** Used for success states and secondary highlights.

### The "No-Line" Rule
To maintain a high-end editorial feel, **1px solid borders are strictly prohibited** for sectioning. Layout boundaries must be defined through:
1.  **Background Shifts:** Using `surface-container-low` against a `background` base.
2.  **Vertical Space:** Utilizing the Spacing Scale (specifically `8`, `12`, and `16`) to create natural groupings.
3.  **Tonal Transitions:** A subtle change in surface color is more sophisticated than a rigid line.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested layers. Each "inner" container should move up or down the hierarchy to define its importance:
- **Surface (`#0e0e0f`):** The base canvas.
- **Surface Container Low (`#131314`):** Large structural sections.
- **Surface Container High (`#201f21`):** Floating cards or interactive modules.

### The "Glass & Gradient" Rule
For hero elements and floating menus, use **Glassmorphism**. Apply `surface-container-highest` at 60% opacity with a `20px` backdrop-blur. 
**Signature Textures:** Main CTAs should use a linear gradient from `primary` to `primary-container` at a 135-degree angle to give them a "lit from within" soul.

---

## 3. Typography: Editorial Boldness
We pair the geometric precision of **Plus Jakarta Sans** with the versatile clarity of **Inter**.

- **Display & Headlines (Plus Jakarta Sans):** Used for high-impact branding and page titles. These should be tracked slightly tighter (-2%) to feel authoritative and modern.
- **Titles & Body (Inter):** Optimized for readability in community feeds. 
- **The Hierarchy Strategy:** Use extreme scale differences. A `display-lg` headline next to a `body-sm` label creates a "high-fashion" contrast that feels intentional and curated.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are replaced by **Ambient Luminosity**.

- **The Layering Principle:** Achieve lift by stacking. A `surface-container-lowest` card placed on a `surface-container-low` section creates a recessed, "carved" look. A `surface-bright` card on a `surface` background creates a "lifted" look.
- **Ambient Shadows:** When a float is required, use a shadow color tinted with the `primary` or `secondary` token at 4% opacity. The blur should be at least `40px` to mimic soft, environmental light.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components: The Signature Kit

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary_fixed` text, `full` roundedness.
- **Secondary:** `surface_container_highest` background with a `secondary` "Ghost Border."
- **Interaction:** On hover, increase the brightness of the gradient; do not use a standard overlay.

### Cards (Feed Items)
- **Styling:** No borders. Use `surface_container` as the base. 
- **Depth:** Use a 1px inner glow (top-left) using `primary` at 10% opacity to simulate a light source hitting the edge of the card.
- **Spacing:** Use `padding: 6 (1.5rem)` for internal breathing room.

### Input Fields
- **Base:** `surface_container_low`. 
- **Active State:** Transition the background to `surface_container_high` and add a `primary` "Ghost Border."
- **Shape:** Use `md` (0.75rem) roundedness to keep the vibe sleek.

### Navigation Chips
- **Selection:** Use `primary` background with `on_primary_fixed` text.
- **Unselected:** `surface_container_highest` with no border. Use `full` roundedness for a pill shape.

### Community "Pulse" Indicator (New Component)
A small, glowing orb using the `tertiary` token with an outer `12px` blur, used next to active community names to signify "Live" activity.

---

## 6. Do's and Don'ts

### Do
- **Do** use large amounts of negative space (Spacing `16`+) between major sections.
- **Do** use `primary` and `secondary` gradients to draw the eye to the most important community action.
- **Do** ensure all text on `surface` containers meets WCAG AA contrast using the `on_surface` and `on_surface_variant` tokens.

### Don't
- **Don't** use 100% white (`#FFFFFF`) for dividers; it breaks the "Neon Pulse" immersion.
- **Don't** use sharp corners; adhere strictly to the **Roundedness Scale** (defaulting to `md` for inputs and `xl` for large cards).
- **Don't** overcrowd the screen. If a section feels "busy," increase the background-tinted spacing rather than adding lines.