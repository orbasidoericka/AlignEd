// Copyright (c) 2026 EdTech. All rights reserved.

// The four-step scoring procedure, told once. The landing page's "How your
// code is scored" section and the notice shown on Profile Setup both read it,
// so the two can never drift. The Filipino text mirrors it step for step.
export const SCORING_NOTICE_EN = {
  title: "How your code is scored",
  subtitle: "No right or wrong answers. Your code comes from simple counting.",
  steps: [
    {
      title: "Answer 42 statements",
      body: "Each statement belongs to one of the six RIASEC types. There are 7 for every type, mixed together.",
    },
    {
      title: "Yes earns 1 point, No earns 0",
      body: "The point goes to the RIASEC type that statement belongs to.",
    },
    {
      title: "Add up the points",
      body: "Each RIASEC type ends with a score from 0 to 7.",
    },
    {
      title: "Your top three make your code",
      body: "Highest score first. If two scores tie, the type that comes first in R, I, A, S, E, C goes first, so the same answers always give the same code.",
    },
  ],
  note: "Scores show what you enjoy, not how smart you are. Every major and pathway for your three letters is shown, and none is ranked above another.",
  acknowledge: "I understand",
} as const;

export const SCORING_NOTICE_FIL = {
  title: "Paano nabubuo ang iyong code",
  subtitle: "Walang tama o maling sagot. Ang iyong code ay galing sa simpleng pagbibilang.",
  steps: [
    {
      title: "Sagutan ang 42 pahayag",
      body: "Ang bawat pahayag ay kabilang sa isa sa anim na uri ng RIASEC. May tig-7 pahayag para sa bawat uri, at ang mga ito ay pinaghalo-halo.",
    },
    {
      title: "Ang “Oo” ay may 1 puntos, at ang “Hindi” ay may 0 puntos",
      body: "Ang puntos ay idaragdag sa uri ng RIASEC na kinabibilangan ng pahayag.",
    },
    {
      title: "Pagsamahin ang mga puntos",
      body: "Ang bawat uri ng RIASEC ay magkakaroon ng kabuuang iskor na mula 0 hanggang 7.",
    },
    {
      title: "Ang iyong tatlong pinakamataas na iskor ang bubuo sa iyong code",
      body: "Ayusin ang mga uri ng RIASEC mula sa pinakamataas na iskor pababa. Kung magkapareho ang iskor ng dalawang uri, mauuna ang uring nasa unang posisyon sa pagkakasunod-sunod na R, I, A, S, E, C. Sa ganitong paraan, magiging pare-pareho ang code na makukuha mula sa parehong mga sagot.",
    },
  ],
  note: "Ipinapakita ng mga iskor kung ano ang kinagigiliwan mo, hindi kung gaano ka katalino. Ipinapakita ang bawat major at pathway para sa iyong tatlong letra, at wala sa mga ito ang nakahanay nang mas mataas kaysa sa iba.",
  acknowledge: "Naiintindihan ko",
} as const;
