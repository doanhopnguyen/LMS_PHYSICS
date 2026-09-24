# Card conventions

Use these three components for content cards throughout the application:

- `Card`: general content, forms, grouped details, list items and panels. Use `as` to preserve the appropriate HTML element and `variant="accent"` or `progress` for the existing visual variants.
- `ResourceCard`: learning resource cards, including resource metadata and the link to open the document. This component uses `Card` internally.
- `StatCard`: summary statistics and progress metrics. `MetricGrid` arranges `StatCard` instances; it does not define another card style.

`Card` uses a plain border by default across all roles. Use `variant="accent"` only for cards representing an individual learning resource, course/class, practice assessment or lab; use `accentColor` to customize that border. General panels, forms, filters, tables, notifications and nested metadata stay plain. `ResourceCard` opts into the accent style internally. Course and lab progress cards retain their existing colored progress ribbon.

Keep radius, default border, background and shadow in the shared components. At call sites, use `className` for spacing, layout and intentional state colors. Do not create independent card surfaces with native elements and duplicated base styles.

Dialogs, menus, form controls, alerts, chat messages, tables and simulation/chart graphics retain their functional styles; they are not content cards.
