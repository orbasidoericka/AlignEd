-- Saved results: add the student's SHS strand (as picked on the profile
-- step) for the admin page's strand statistics. Nullable, so rows saved
-- before this migration stay valid. The allowed values mirror SHS_STRANDS in
-- apps/web/src/lib/riasec/types.ts; change both together.

alter table public.saved_results
  add column if not exists strand text check (strand in (
    'Accountancy, Business and Management (ABM)',
    'Science, Technology, Engineering, and Mathematics (STEM)',
    'Humanities and Social Sciences (HUMSS)',
    'General Academic Strand (GAS)',
    'Arts and Design',
    'Sports',
    'Agri-Fishery Arts (AFA)',
    'Home Economics (HE)',
    'Industrial Arts (IA)',
    'Information and Communications Technology (ICT)'
  ));
