// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecTrait } from "./types";

// Filipino translation of the Results page. Not supplied by the product
// owner (unlike career-pathways-fil.ts, which transcribes their paste);
// written to match its register.

// Short friendly trait nicknames, the Filipino side of scoring.ts's
// TRAIT_META labels ("Doers" etc).
export const TRAIT_LABEL_FIL: Readonly<Record<RiasecTrait, string>> = {
  realistic: "Ang Tagapagtayo",
  investigative: "Ang Tagapag-isip",
  artistic: "Ang Manlilikha",
  social: "Ang Katulong",
  enterprising: "Ang Tagapagsulong",
  conventional: "Ang Tagapag-ayos",
};

export const RESULTS_TEXT_FIL = {
  greeting: (nickname: string) => `Narito ang iyong resulta, ${nickname}!`,
  greetingNoName: "Narito ang iyong resulta",
  hollandCodeLabel: "Ang Iyong Holland Code",
  youAre: "Ikaw ay isang",
  sixTraitsTitle: "Ang Iyong Anim na Uri ng RIASEC",
  sixTraitsDescription: (max: number) =>
    `Iskor sa labas ng ${max} para sa bawat uri ng RIASEC.`,
  radarCaption: "Ang iyong mga iskor sa mga uri ng RIASEC",
  outOf: (max: number) => `sa ${max}`,
  radarKey: "Asul na hugis: ang iyong mga iskor",
  radarHowTo: (max: number) =>
    `Isang uri ang bawat sulok. Mas mataas ang iskor kapag mas malayo ang abot ng hugis patungo sa sulok. 0 sa gitna at ${max} sa pinakadulo.`,
  radarCodeNote:
    "Ang mga may kulay na hanay sa ibaba ang tatlong uri sa iyong code.",
  codeMeaningTitle: "Ano ang Ibig Sabihin ng Iyong Code",
  collegeMajors: "Mga major sa kolehiyo",
  relatedPathways: "Mga kaugnay na landas",
  rankBanner: [
    "Pangunahin mong uri ng RIASEC",
    "Ikalawa mong uri ng RIASEC",
    "Ikatlo mong uri ng RIASEC",
    "Ikaapat mong uri ng RIASEC",
    "Ikalima mong uri ng RIASEC",
    "Ikaanim mong uri ng RIASEC",
  ],
  otherTypes: {
    button: "Tingnan ang iba pang uri",
    title: "Ang iba pang uri ng RIASEC",
    description:
      "Ang iyong ikaapat hanggang ikaanim na uri. Mas mababa ang iskor nila kaysa sa iyong code, pero maaari pa rin nilang ipakita ang mga bagay na gusto mo.",
  },
  carousel: {
    label: "Ang iyong tatlong nangungunang uri ng RIASEC",
    show: (name: string) => `Ipakita ang ${name}`,
    slideOf: (position: number, total: number) => `${position} sa ${total}`,
  },
  disclaimerTitle: "Paunawa",
  disclaimer:
    "Ang RIASEC assessment ay idinisenyo lamang upang suriin ang mga interes sa karera; hindi nito sinusukat ang kakayahan, kasanayan, o akademikong talino ng mag-aaral. Ang mga resulta ay nagbibigay ng pangkalahatang mungkahi para sa mga posibleng landas ng karera batay sa kasalukuyang kagustuhan at hindi dapat ituring na tiyak na hula ng hinaharap na trabaho o tagumpay sa karera. Pinakamainam gamitin ang imbentaryong ito bilang panimulang tool kasabay ng pagsusuri sa kasanayan, mga rekord ng akademikong pagganap, at career counseling.",
  expiry: {
    srPrefix: "Mananatili ang iyong resulta sa device na ito nang halos",
    srMoreMinute: "minuto pa",
    srMoreMinutes: "minuto pa",
    srSuffix: "o hanggang isara mo ang tab na ito.",
    visiblePrefix: "Mananatili ang iyong resulta sa device na ito nang",
    visibleSuffix: "pa, o hanggang isara mo ang tab na ito.",
  },
} as const;

export const RESULTS_ACTIONS_TEXT_FIL = {
  retake: {
    tooltip: "Kunin ulit ang assessment",
    title: "Kunin ulit ang assessment?",
    description:
      "Nililinis nito ang iyong profile, mga sagot, at kasalukuyang resulta. Magsisimula ka ulit mula sa profile setup. I-save muna ang iyong PDF kung gusto mong magtago ng kopya.",
    keep: "Panatilihin ang aking resulta",
    confirm: "Linisin at kunin ulit",
  },
  share: {
    tooltip: "Ibahagi ang aking resulta",
    title: "Ibahagi ang aking resulta",
    description:
      "Ipinapakita ng larawang ito ang iyong Holland Code at wala nang iba pang tungkol sa kung sino ka. Ikaw ang magpapasya kung ipo-post mo ito at kung saan.",
    buildFailed: "Hindi magawa ang larawan. Subukan ulit.",
    tryAgain: "Subukan ulit",
    save: "I-save ang larawan",
    shareButton: "Ibahagi",
    creating: "Gumagawa ng iyong larawan",
  },
  email: {
    tooltip: "I-email sa akin ang aking resulta",
    title: "I-email ang aking resulta",
    description:
      "Ipapadala namin ang iyong resulta bilang PDF na may password.",
    passwordLabel: "Password para mabuksan ang PDF",
    passwordSave: "I-save ito ngayon. Wala ito sa email.",
    passwordHint:
      "Ang iyong palayaw at ang iyong tatlong-titik na code. Case-sensitive.",
    privacyNote:
      "Isang kopya lang ang ipapadala at hindi namin itinatago ang iyong address. Para pigilan ang spam, isang naka-scramble na code lang nito ang itinatago namin sa loob ng isang araw.",
    sent: (email: string) =>
      `Naipadala na! Tingnan ang ${email} para sa iyong results PDF. Maaaring tumagal ito ng isang minuto.`,
    emailLabel: "Email address",
    emailInvalid: "Maglagay ng wastong email address.",
    consent:
      "Sumasang-ayon ako na ipadala ng AlignEd ang aking resulta sa address na ito nang isang beses, alinsunod sa Data Privacy Act of 2012.",
    sending: "Ipinapadala…",
    send: "Ipadala ang aking resulta",
    errors: {
      rate_limited:
        "Masyadong maraming email ang naipadala mula rito kamakailan. Subukan ulit mamaya, o gamitin ang Download PDF.",
      invalid: "Hindi magamit ang email address na iyon. Suriin ito at subukan ulit.",
      failed:
        "Hindi namin naipadala ang email ngayon. Subukan ulit, o gamitin ang Download PDF para magtago ng kopya.",
      not_configured:
        "Hindi pa naka-set up ang email sa site na ito. Gamitin ang Download PDF para magtago ng kopya.",
    },
  },
} as const;
