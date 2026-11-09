// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecLetter } from "@/lib/riasec/types";

// Filipino translation for the career-look camera dialog. The caption drawn
// onto the photo and read out loud ("Ikaw ay Makatotohanan") reuses
// PATHWAY_NAME_FIL from career-pathways-fil.ts, so the trait name is never
// translated twice; this file only adds what that one does not have.
export const CAREER_LOOK_PROPS_FIL: Readonly<Record<RiasecLetter, string>> = {
  R: "isang hard hat",
  I: "mga safety goggles",
  A: "isang beret at palette",
  S: "isang lanyard at mga speech bubble",
  E: "isang headset mic",
  C: "salamin at lapis",
};

export const CAREER_LOOK_TEXT_FIL = {
  triggerLabel: "Subukan ang iyong career look",
  dialogTitle: "Ang iyong career look",
  dialogDescription:
    "May sariling look ang bawat titik ng iyong code. Nananatili ang iyong camera sa device na ito. Ang larawang kukunin mo ay idaragdag sa email ng iyong resulta.",
  chooseLookLabel: "Pumili ng look",
  signHint: "Subukan ang pagkaway, thumbs up, peace sign, o ang I-love-you sign.",
  starting: "Sinisimulan ang iyong camera…",
  lookAtCamera: (propsLabel: string) =>
    `Tumingin sa camera para subukan ang ${propsLabel}.`,
  cameraPreviewAlt: (propsLabel: string) => `Preview ng camera na may ${propsLabel}`,
  photoAlt: (caption: string) => `Ang iyong career look na larawan: ${caption}`,
  tryAgain: "Subukan ulit",
  savePhoto: "I-save ang larawan",
  share: "Ibahagi",
  retake: "Kunin ulit",
  takePhoto: "Kumuha ng larawan",
} as const;

export const CAMERA_ERROR_FIL = {
  NotAllowedError:
    "Naka-block ang access sa camera. Payagan ang camera para sa site na ito sa settings ng iyong browser, pagkatapos ay subukan ulit.",
  NotFoundError: "Walang nahanap na camera sa device na ito.",
  OverconstrainedError: "Walang nahanap na camera sa device na ito.",
  NotReadableError:
    "Hindi nag-start ang iyong camera. Maaaring bukas ito sa ibang app o tab (video call, Discord, ibang browser). Isara ang mga iyon, pagkatapos ay subukan ulit. Kung patuloy itong mabigo, i-restart ang iyong browser.",
  AbortError:
    "Hindi nag-start ang iyong camera. Maaaring bukas ito sa ibang app o tab (video call, Discord, ibang browser). Isara ang mga iyon, pagkatapos ay subukan ulit. Kung patuloy itong mabigo, i-restart ang iyong browser.",
  SecurityError: "Gumagana lang ang camera sa secure (https) na koneksyon.",
  default: "Hindi ma-start ang career look sa browser na ito.",
} as const;
