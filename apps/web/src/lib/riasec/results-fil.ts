// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecTrait } from "./types";

// Filipino translation of the Results page. Not supplied by the product
// owner (unlike career-pathways-fil.ts, which transcribes their paste);
// written to match its register.

// Short friendly trait nicknames, the Filipino side of scoring.ts's
// TRAIT_META labels ("The Builder" etc).
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
  sixTraitsTitle: "Ang Iyong Anim na Katangian",
  sixTraitsDescription: (max: number) =>
    `Iskor sa labas ng ${max} para sa bawat katangiang RIASEC.`,
  radarCaption: "Ang iyong mga iskor sa katangiang RIASEC",
  outOf: (max: number) => `sa ${max}`,
  codeMeaningTitle: "Ano ang Ibig Sabihin ng Iyong Code",
  collegeMajors: "Mga major sa kolehiyo",
  relatedPathways: "Mga kaugnay na landas",
  rankBanner: [
    "Pangunahin mong katangian",
    "Ikalawa mong katangian",
    "Ikatlo mong katangian",
  ],
  carousel: {
    label: "Ang iyong tatlong nangungunang katangian",
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
      "Ie-email namin ang iyong resulta bilang isang password-protected na PDF. Nagpapadala kami ng isang kopya at hindi namin itinatago ang iyong address; para pigilan ang spam, isang naka-scramble na code lang nito ang itinatago namin sa loob ng isang araw.",
    passwordLabel: "Ang iyong PDF password",
    passwordHint:
      "Ang iyong palayaw, pagkatapos ang iyong tatlong-titik na RIASEC code. CASE-SENSITIVE ang password. Hindi ito nakasulat sa email, kaya itago ito sa ligtas na lugar.",
    attachPhoto: "Isama ang aking career look photo",
    sent: (email: string, withPhoto: boolean) =>
      `Naipadala na! Tingnan ang ${email} para sa iyong results PDF${withPhoto ? " at career look photo" : ""}. Maaaring tumagal ito ng isang minuto, at posibleng mapunta ito sa iyong spam folder.`,
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
