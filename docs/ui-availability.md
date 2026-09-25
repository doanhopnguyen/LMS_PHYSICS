# UI availability notes

Technical integration limitations belong here, not in permanent page toolbars.

- Lecturer exam creation remains unavailable: API.md requires matrixId but documents no authorized matrix lookup. No endpoint is invented and no UUID entry is exposed.
- Lecturer enrollment and staff assignment remain unavailable without authorized candidate lookup. Existing list, status and removal actions remain available.
- Removing technical banners does not enable these unsupported operations. Real request errors and field validation remain visible.

Submission pages use components/Form.jsx (Form, SubmitButton), FormDialog and FormField where applicable. Keep authentication, uploads and JSON payload handling in existing page/service handlers.
