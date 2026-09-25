# Card conventions

## Reuse in API-driven pages

- Use `Tabs` with `actions` for filters and actions on the same toolbar.
- The shared toolbar keeps controls at stable widths (216px for lookup/select groups, 36px high). Labels and selects remain inline; long selected values truncate inside the control instead of expanding the layout. Controls wrap only when space is insufficient. Use `--toolbar-select-width` for an intentional width override; avoid content-driven `min-w-*` on toolbar controls.
- Use `SelectField` for inline-label dropdowns; keep API lookup logic outside the component.
- Use `FormField` for labeled inputs/textareas and `FormDialog` for create/edit dialogs. These are extracted from the existing Lecturer forms, not a separate design system. Pass `busy` to prevent closing during a request.
- Use `ConfirmDialog` for confirmation, `AuthAlert` for request notifications.
- Use `DataTable` with `Pagination`; server pages are zero-based while `Pagination.currentPage` is one-based. Disable `DataTable` client pagination for server-paginated responses.
- Use `MetricGrid` / `StatCard` for statistics instead of rebuilding metric cards in each page.
- Submit buttons must explicitly set `type="submit"`; other buttons keep `Button`'s safe default of `type="button"`.
- All submission forms use `Form` and `SubmitButton` from `Form.jsx`. `Form` renders a native form and forwards refs, events, validation attributes and layout classes; it does not alter request handling. `SubmitButton` always renders `type="submit"` and accepts `busy` / `disabled`. Retain compact filter/search layouts via `className`.
- Forms use the established Be Vietnam Pro font, regular labels and medium-weight headings/actions. Keep implementation notes (API availability, endpoint names) in documentation rather than permanent user-facing banners.

## Content surfaces

Use these three components for content cards throughout the application:

- `Card`: general content, forms, grouped details, list items and panels. Use `as` to preserve the appropriate HTML element and `variant="accent"` or `progress` for the existing visual variants.
- `ResourceCard`: learning resource cards, including resource metadata and the link to open the document. This component uses `Card` internally.
- `StatCard`: summary statistics and progress metrics. `MetricGrid` arranges `StatCard` instances; it does not define another card style.

`Card` uses a plain border by default across all roles. Use `variant="accent"` only for cards representing an individual learning resource, course/class, practice assessment or lab; use `accentColor` to customize that border. General panels, forms, filters, tables, notifications and nested metadata stay plain. `ResourceCard` opts into the accent style internally. Course and lab progress cards retain their existing colored progress ribbon.

Keep radius, default border, background and shadow in the shared components. At call sites, use `className` for spacing, layout and intentional state colors. Do not create independent card surfaces with native elements and duplicated base styles.

Dialogs, menus, form controls, alerts, chat messages, tables and simulation/chart graphics retain their functional styles; they are not content cards.
