# PRD: Scene Navigation Gallery Quick Picker

Labels: enhancement, ready-for-agent

## Problem Statement

Rusty Art is an art-first public static website. The current scene navigation lets visitors move left and right between artworks, but the full public archive lives below the fold inside an archive panel. Because the artwork stage fills the viewport, most visitors will not discover that archive panel, especially on mobile. The center quick-picker is technically available, but as a native select it is poor at showing a visual archive: it hides thumbnails, makes long headline labels hard to scan, and does not feel like browsing artwork.

Visitors need an obvious, touch-friendly way to see all public archive artworks from the current scene, pick one visually, and return immediately to the artwork stage without scrolling to the bottom of the page.

## Solution

Replace the center quick-picker select with a prominent current-artwork gallery trigger. The trigger should keep the current quick-switch position between the left/right controls, but clicking or touching it opens a gallery modal. The modal displays the same public archive card content currently used by the archive panel: thumbnail, date, source, title, headline, and artist influence. The list should show newest artworks first, highlight the current artwork, and load the selected artwork when a visitor chooses a card.

The left/right controls remain for fast sequential browsing. The modal becomes the primary way to browse the full public archive. The below-fold archive panel should no longer be the main discovery path and can be removed from the public page once the modal provides equivalent browsing value.

## User Stories

1. As a first-time visitor, I want to see that the current artwork title is clickable, so that I can discover the full gallery without scrolling.
2. As a returning visitor, I want to open all artworks from the top controls, so that I can jump directly to an older piece.
3. As a mobile visitor, I want a touch-friendly gallery sheet, so that I can browse without using a cramped native dropdown.
4. As a desktop visitor, I want a modal gallery overlay, so that I can browse the archive while staying anchored to the current scene.
5. As a visitor viewing the latest artwork, I want newer pieces to appear at the top of the gallery, so that the freshest public archive entries are easiest to find.
6. As a visitor browsing historical artworks, I want the current artwork highlighted in the gallery, so that I know where I am in the archive.
7. As a visitor, I want each gallery item to show a thumbnail, so that I can choose by visual memory instead of headline text alone.
8. As a visitor, I want each gallery item to show the date, so that I can understand when the Belgian-news-inspired artwork was published.
9. As a visitor, I want each gallery item to show the news source, so that I can understand the public archive context at a glance.
10. As a visitor, I want each gallery item to show the artwork title, so that I can recognize the scene before opening it.
11. As a visitor, I want each gallery item to show the headline context, so that I can choose based on the news signal behind the artwork.
12. As a visitor, I want each gallery item to show the artist influence, so that I can browse by visual lineage.
13. As a visitor, I want selecting a gallery item to load that artwork, so that I can jump across the archive in one action.
14. As a visitor, I want the gallery to close after I select an artwork, so that the scene becomes the focus again.
15. As a keyboard user, I want to open the gallery from the quick-switch controls, so that the feature is not mouse-only.
16. As a keyboard user, I want to close the gallery with Escape, so that modal navigation follows common browser expectations.
17. As a keyboard user, I want focus to return to the gallery trigger after closing, so that I do not lose my place in the interface.
18. As a keyboard user, I want gallery cards to be reachable and activatable from the keyboard, so that all public archive navigation remains accessible.
19. As a screen-reader user, I want the gallery to have dialog semantics and a clear title, so that I understand that I am browsing the public archive.
20. As a screen-reader user, I want the active artwork to be announced or marked, so that I can tell which archive item is currently showing.
21. As a visitor using left/right controls, I want their labels and key hints to match the actual navigation order, so that older/newer or previous/next behavior is not confusing.
22. As a visitor using arrow keys, I want keyboard navigation to keep working after this change, so that fast scene navigation is preserved.
23. As a visitor using focus mode, I want the gallery trigger to remain useful, so that hiding the below-fold content does not remove archive navigation.
24. As a visitor on a small viewport, I want the gallery layout to fit safely within the screen, so that cards are scrollable without the artwork stage fighting the page scroll.
25. As a visitor on a device with safe-area insets, I want modal controls to remain reachable, so that close and selection controls are not hidden by browser chrome.
26. As a visitor on a slow connection, I want the gallery to use existing manifest metadata and lazy thumbnails, so that opening the gallery does not fetch every artwork payload.
27. As a visitor, I want the scene loading state to still disable conflicting controls, so that I do not accidentally trigger overlapping artwork loads.
28. As a visitor, I want failed artwork loads to keep showing the existing fallback/status behavior, so that a bad archive item does not break the gallery experience.
29. As a visitor arriving from a direct artwork link, I want the gallery trigger and active highlight to reflect that linked artwork, so that deep links remain coherent.
30. As a visitor arriving in capture/rendering contexts, I want capture output to remain clean, so that gallery UI does not appear in generated captures.
31. As a maintainer, I want the gallery to reuse the current public archive card presentation facts, so that thumbnail trust rules and card labels stay consistent.
32. As a maintainer, I want the public archive manifest contract to remain unchanged, so that the private public archive publisher does not need a migration.
33. As a maintainer, I want the implementation to stay static-site compatible, so that Cloudflare Pages deployment remains simple.
34. As a maintainer, I want the below-fold archive duplicate removed or demoted, so that there is one obvious public archive browsing path.
35. As a maintainer, I want tests at existing presentation and controller seams, so that future navigation changes do not regress the gallery behavior.

## Implementation Decisions

- The public archive contract remains unchanged. The feature consumes the existing manifest items, latest pointer, artwork payload locations, and thumbnail metadata.
- The public archive manifest order is treated as the canonical gallery order. Current data is newest-first. If defensive sorting is added later, selection must still map back to the original manifest item or file, not to a stale visual index.
- The center quick-picker should no longer be a native select. It should become a current-artwork trigger styled as part of the quick-switch controls.
- The trigger label should summarize the active artwork using compact public archive facts, such as date, artist, and title. On small viewports, the label may be shorter but must still make the gallery action discoverable.
- The left/right buttons remain in the quick-switch controls for sequential scene navigation.
- The visible direction labels and key hints must be corrected so they match the actual navigation order. If the controls remain circular, copy should avoid misleading older/newer claims unless the behavior truly matches those claims.
- The gallery opens as a modal overlay on larger viewports and behaves like a full-screen or bottom-sheet gallery on mobile viewports.
- The gallery must include a clear close control, Escape close behavior, backdrop close behavior if it does not conflict with scroll, and focus restoration to the gallery trigger.
- The gallery should reuse the existing archive card presentation model so that trusted thumbnail validation, fallback labels, source labels, and card text remain consistent.
- The gallery should render from manifest metadata and existing thumbnail fields. It should not fetch every artwork payload merely to show the gallery.
- Selecting a gallery card calls the same artwork-loading path used by the current quick-picker and archive cards.
- Selecting the currently active artwork should close the gallery or no-op without triggering a redundant load.
- The current artwork must be visually marked in the gallery and exposed with an accessible current-state marker.
- The below-fold archive panel should be removed as the primary archive browser after the modal provides equivalent card browsing. The story, links, and provenance panel remains available below the artwork stage.
- The old load-more interaction is no longer needed for the primary archive browser. The gallery can render all manifest items because the current archive size is modest and thumbnails are lazy-loaded.
- Loading state should continue to disable conflicting navigation controls while an artwork load is in flight.
- Existing fallback and status rendering should remain the error path for failed artwork loads.
- Capture mode should not show or open the gallery UI.
- No schema changes, backend changes, private automation changes, or public archive publisher changes are required.

## Testing Decisions

- Good tests should assert visitor-visible behavior and public contracts, not internal DOM construction details beyond stable accessibility and rendered content outcomes.
- Test the presentation-facts seam that builds quick-switch labels and gallery/archive card facts from manifest items.
- Test that gallery card facts preserve trusted thumbnail behavior, source labels, date/title/headline/artist labels, and active/current state.
- Test the archive interaction seam that selecting by file or manifest item loads the intended artwork and avoids redundant reloads of the current artwork.
- Test the runtime shell event-binding seam for opening the gallery trigger, closing via close/Escape, and invoking selection callbacks.
- Test mobile/compact presentation facts at the highest available seam so the trigger remains usable without snapshotting exact CSS.
- Test keyboard accessibility behavior by verifying focusable controls, activation keys, Escape close, and focus restoration where the test environment supports it.
- Reuse the existing node test style already used for archive thumbnail presentation and DOM-stubbed archive card rendering.
- Reuse the existing navigation/controller tests as prior art where possible rather than introducing a browser automation framework for the first version.
- Verify the final frontend with the static-site build command.

## Out of Scope

- Search, filtering, faceting, or grouping by source, artist, date range, or visual style.
- Infinite scrolling or virtualization for the first version.
- Changes to the public archive manifest, latest file, artwork payload schema, or media asset schema.
- Changes to the private Rusty Art generation automation or public archive publisher.
- Analytics instrumentation for gallery opens or selections.
- Redesigning the story/provenance panel.
- Redesigning the artwork scene renderer, camera controls, or WebGL/WebGPU runtime.
- Social sharing, favorites, bookmarks, or user accounts.

## Further Notes

No frontend ADRs were found for this area. The closest domain context defines Rusty Art as a Belgian-news-inspired public Three.js frontend backed by a public archive boundary. This PRD preserves that boundary and moves archive discovery from a below-fold panel into the art-first scene navigation layer.

The main UX risk is duplicate navigation. The implementation should avoid keeping two equal archive browsers unless there is a concrete accessibility or fallback reason. The preferred product shape is one obvious gallery entry point in the top quick-switch controls, with left/right remaining for fast sequential browsing.
