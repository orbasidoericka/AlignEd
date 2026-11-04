-- Saved results: allow 'Others' as a strand, for students whose strand is not
-- in the list. Only the word "Others" is stored; the strand text the student
-- types stays in their browser and their own PDF (no free text on the server).
-- The allowed values mirror SHS_STRANDS in apps/web/src/lib/riasec/types.ts;
-- change both together.

alter table public.saved_results
  drop constraint if exists saved_results_strand_check;

alter table public.saved_results
  add constraint saved_results_strand_check check (strand in (
    'Accountancy, Business and Management (ABM)',
    'Science, Technology, Engineering, and Mathematics (STEM)',
    'Humanities and Social Sciences (HUMSS)',
    'General Academic Strand (GAS)',
    'Arts and Design',
    'Sports',
    'Agri-Fishery Arts (AFA)',
    'Home Economics (HE)',
    'Industrial Arts (IA)',
    'Information and Communications Technology (ICT)',
    'Others'
  ));
