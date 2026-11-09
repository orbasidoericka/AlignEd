// Copyright (c) 2026 EdTech. All rights reserved.

import type {
  PolicySection,
  PolicyItem,
} from "@/components/journey/privacy-consent";

// Filipino translation of the Data Privacy Policy and Terms and Conditions.
// Same section order and the same **bold** markers as the English original in
// privacy-consent.tsx, so renderInline() and the section layout need no
// changes. Not a lawyer-reviewed translation; mirrors the English wording's
// meaning sentence by sentence.
export const POLICY_SECTIONS_FIL: readonly PolicySection[] = [
  {
    heading: "Sino ang nagpapatakbo ng AlignEd",
    items: [
      {
        type: "para",
        text: "Ang AlignEd ay pinapatakbo ng Polytechnic University of the Philippines, Santa Maria Campus. Kami ang nagpapasya kung anong datos ang ginagamit ng AlignEd at kung bakit.",
      },
      {
        type: "para",
        text: "May tanong o kahilingan tungkol sa iyong datos? Ikaw o ang iyong magulang o tagapag-alaga ay maaaring mag-email sa amin sa **aligned.career.support@gmail.com**.",
      },
    ],
  },
  {
    heading: "Lahat ng datos na kinokolekta namin",
    items: [
      {
        type: "para",
        text: "**Walang account ang AlignEd at hindi kailanman hinihingi ang iyong tunay na pangalan.** Nasa ibaba ang bawat uri ng datos na hinahawakan ng AlignEd, at kung saan ito napupunta.",
      },
      { type: "subheading", text: "Ang mga ini-type mo" },
      {
        type: "list",
        items: [
          "ang iyong palayaw (1 hanggang 8 titik);",
          "ang iyong edad;",
          "ang iyong antas ng grado (11 o 12);",
          "ang iyong SHS strand (kung wala sa listahan ang sa'yo, maaari kang pumili ng Others at i-type ito);",
          "ang pangalan ng iyong paaralan (opsyonal); at",
          "ang iyong tsek na nagpapakita na sumasang-ayon ka sa mga Tuntuning ito.",
        ],
      },
      { type: "subheading", text: "Ang nililikha ng AlignEd habang ginagamit mo ito" },
      {
        type: "list",
        items: [
          "ang iyong mga sagot (Oo o Hindi) sa 42 pahayag;",
          "ang iyong anim na RIASEC interest score at ang iyong tatlong-titik na code;",
          "ang wikang pinili mo para sa mga pahayag (Ingles o Filipino);",
          "ang iyong posisyon sa assessment, ang oras ng iyong huling galaw, at ang oras na natapos ka;",
          "isang random na results ID, tulad ng ALGN-7KQ2-MX9P; at",
          "ang iyong mga pinili para sa tema (Vivid o Dark) at tunog.",
        ],
      },
      { type: "subheading", text: "Kung pipiliin mo lang" },
      {
        type: "list",
        items: [
          "ang iyong **email address**, kung hihilingin mong i-email namin ang iyong resulta; at",
          "ang **career look photo** mula sa iyong camera, kung kukuha ka ng isa.",
        ],
      },
      { type: "subheading", text: "Awtomatikong nakukolekta" },
      {
        type: "list",
        items: [
          "**Datos ng pagbisita sa website** (kapag naka-on ang analytics): ang mga pahinang binubuksan mo, kailan, at ang uri ng iyong browser at device. Natatanggap din ang iyong IP address, at maaari itong gamitin para tantiyahin ang iyong pangkalahatang lugar.",
          "**Ang iyong IP address, sandali lamang.** Isinasalaysay (one-way hash) ito ng aming server at itinatago lamang sa memory, para pigilan ang mga taong umaabuso sa serbisyo.",
          "**Karaniwang server logs** (tulad ng IP address at oras ng pagbisita) na maaaring itago ng aming hosting provider para sa sarili nitong pangangailangang teknikal at seguridad.",
          "**Isang tests-taken counter**: isang numero para sa buong website na tumataas tuwing may matatapos. Walang pangalan o ID dito.",
        ],
      },
      { type: "subheading", text: "Kung saan napupunta ang bawat isa" },
      {
        type: "list",
        items: [
          "**Nananatili lang sa iyong device:** ang iyong palayaw, paaralan, mga sagot, wika, tema, pinili mong tunog, oras ng sesyon, at anumang strand na i-type mo sa ilalim ng Others (napi-print din ito sa iyong sariling PDF).",
          "**Naka-save sa aming server (walang pangalan):** ang iyong antas ng grado, SHS strand (ang salitang Others lamang kung sarili mong tinype), edad, anim na iskor, tatlong-titik na code, petsa, at results ID.",
          "**Ipinapadala minsan, pagkatapos ay itinatapon:** ang iyong email address at larawan.",
          "**Ipinapadala sa aming analytics provider:** datos ng pagbisita sa website, kapag naka-on ang analytics.",
        ],
      },
      { type: "subheading", text: "Hindi namin kinokolekta" },
      {
        type: "para",
        text: "**Hindi namin kinokolekta** ang iyong buong pangalan, tirahan, numero ng telepono, o password, at hindi kami gumagawa ng mga account. **Ang iyong palayaw, paaralan, indibidwal na sagot, tinype na strand, email address, at larawan ay hindi kailanman nase-save sa aming server.** Mangyaring huwag i-type ang alinman sa mga pribadong detalyeng ito sa AlignEd.",
      },
      {
        type: "para",
        text: "Personal ang iyong edad at mga detalye ng paaralan. Inaalagaan namin ang mga ito nang mabuti kahit walang pangalang kalakip.",
      },
    ],
  },
  {
    heading: "Bakit namin ginagamit ang iyong datos",
    items: [
      { type: "subheading", text: "Para ibigay sa iyo ang iyong resulta" },
      {
        type: "para",
        text: "Ang iyong mga sagot ay kinukuwenta sa iyong device para mahanap ang iyong interest score sa anim na larangan: Realistic, Investigative, Artistic, Social, Enterprising, at Conventional. Pagkatapos ay ipapakita namin ang mga karera at programa sa kolehiyong akma sa iyo.",
      },
      { type: "subheading", text: "Para sa estadistika ng programa" },
      {
        type: "para",
        text: "Ang mga naka-save na record (antas ng grado, strand, edad, at iskor, walang pangalan) ay tumutulong sa amin na makita kung aling mga interes, strand, at grupo ng edad ang naaabot ng AlignEd. Tumutulong ito sa amin na pagbutihin ang AlignEd at maunawaan ang pangangailangan ng mga mag-aaral sa patnubay sa karera.",
      },
      {
        type: "para",
        text: "**Hindi kami nagpapakita ng mga ad, hindi namin ibinebenta ang iyong datos, at hindi namin ito ginagamit para sa anumang iba pa.**",
      },
    ],
  },
  {
    heading: "Ano ang ibig sabihin ng iyong resulta",
    items: [
      {
        type: "para",
        text: "**Ang iyong resulta ay patnubay lamang.** Hindi nito pinagdedesisyunan ang iyong grado, pagtanggap sa paaralan, trabaho, o kung maaari kang kumuha ng isang kurso. Hindi ito pangwakas na sagot kung ano ang dapat mong piliin. Makipag-usap sa isang guidance counselor, guro, o pamilya bago ka magdesisyon.",
      },
    ],
  },
  {
    heading: "Saan nakaimbak ang iyong datos at sino ang makakakita nito",
    items: [
      { type: "subheading", text: "Sa iyong device habang kinukuha mo ang assessment" },
      {
        type: "para",
        text: "Ang iyong palayaw, edad, grado, strand, paaralan, mga sagot, at iskor ay nananatili sa browser ng device na ginagamit mo. Ito ang nagpapahintulot sa AlignEd na matandaan ang iyong posisyon nang walang account.",
      },
      { type: "subheading", text: "Sa aming server pagkatapos mong matapos" },
      {
        type: "para",
        text: "Kapag naabot mo na ang iyong resulta, nagsa-save kami ng isang maliit na record sa aming database. Naka-impake rito ang iyong **antas ng grado, SHS strand, edad, anim na iskor, tatlong-titik na code, petsa, at results ID**.",
      },
      {
        type: "para",
        text: "**Wala ritong pangalan, palayaw, paaralan, email, larawan, o sagot.** Itinuturing pa rin namin itong protektadong datos, dahil hindi namin maaaring ipangako na imposibleng ma-ugnay ito sa isang tao.",
      },
      {
        type: "para",
        text: "**Gumagana ang iyong results ID tulad ng password.** Sinumang may hawak nito ay makikita ang mga iskor na naka-save dito, kahit wala itong pangalan mo. Panatilihin itong pribado.",
      },
      { type: "subheading", text: "Sino ang makakakita nito" },
      {
        type: "list",
        items: [
          "mga administrador ng programang AlignEd, sa pamamagitan ng isang pribadong pahina na nagpapakita ng mga naka-save na record at results ID, pero walang pangalan;",
          "mga guidance staff ng paaralan na pinahintulutan ng programa; at",
          "ang mga serbisyong nagpapatakbo ng AlignEd, kung kailangan lamang para panatilihin itong gumagana: Supabase (database), Google Gmail (nagpapadala ng mga email na hihilingin mo), PostHog (estadistika ng website, kapag naka-on), at ang aming website hosting provider.",
        ],
      },
      {
        type: "para",
        text: "Ang lahat na may access ay maaari lamang gumamit ng datos para sa mga dahilang nasa paalalang ito, at dapat itong panatilihing ligtas.",
      },
    ],
  },
  {
    heading: "Gaano katagal namin itinatago ang iyong datos",
    items: [
      { type: "subheading", text: "Sa iyong device" },
      {
        type: "para",
        text: "**Awtomatikong nabubura ang iyong sesyon pagkatapos ng 30 minuto ng walang galaw.** Maaari mo itong buraihin agad gamit ang **Start over**. Gawin ito sa isang shared o school computer para hindi makita ng susunod na gagamit ang iyong mga sagot.",
      },
      { type: "subheading", text: "Sa aming server" },
      {
        type: "para",
        text: "Maaari mong burahin ang iyong naka-save na record anumang oras gamit ang **Delete saved copy** sa iyong results page, o sa pamamagitan ng pagbibigay ng iyong results ID sa mga administrador ng programa.",
      },
      {
        type: "para",
        text: "Hindi namin itinatago ang datos nang mas matagal kaysa sa kailangan namin para sa mga dahilang nasa paalalang ito.",
      },
    ],
  },
  {
    heading: "Kung ie-email mo ang iyong resulta",
    items: [
      {
        type: "para",
        text: "Opsyonal ang pag-email ng iyong resulta, at hihingin namin ang iyong pahintulot nang hiwalay.",
      },
      {
        type: "list",
        items: [
          "**Ang iyong email address ay ginagamit nang isang beses lamang** para ipadala ang iyong resulta, pagkatapos ay itatapon. Hindi ito idinadagdag sa iyong naka-save na record.",
          "Kung kumuha ka ng career look photo, isasama ito sa email maliban kung tatanggalin mo ang tsek dito. **Hindi kailanman itinatago** ng AlignEd ang larawan.",
          "Protektado ng password ang PDF ng resulta.",
          "Hindi namin gagamitin ang iyong address para sa mga ad o marketing.",
          "Para harangin ang spam, itinatago ng aming server ang isang naka-scramble (one-way hash) na bersyon ng iyong address at IP sa memory sa maikling panahon. Hindi ito maaaring ibalik sa iyong orihinal na address.",
        ],
      },
    ],
  },
  {
    heading: "Estadistika ng website",
    items: [
      {
        type: "para",
        text: "Kapag naka-on ang analytics, ginagamit namin ang PostHog para bilangin ang mga pagbisita: aling mga pahina ang binuksan, kailan, at anong uri ng browser o device. Nag-iimbak ito ng random na ID sa iyong browser, hindi isang cookie.",
      },
      {
        type: "para",
        text: "**Hindi kailanman natatanggap ng analytics ang iyong palayaw, sagot, o resulta.** Hindi ito naka-load sa pribadong admin page. Kung magdaragdag man kami ng ibang tracking o cookies, sasabihin namin ito sa iyo muna at bibigyan ka ng pagpipilian kung saan iniaatas ito ng batas.",
      },
    ],
  },
  {
    heading: "Paano namin pinananatiling ligtas ang iyong datos",
    items: [
      {
        type: "para",
        text: "Gumagamit kami ng makatwirang teknikal at organisasyonal na proteksyon laban sa pagkawala, maling paggamit, at hindi awtorisadong akses. Tanging ang mga tao at sistemang nangangailangan ng server data lamang ang makaka-access dito.",
      },
      {
        type: "para",
        text: "Walang online na serbisyong ganap na ligtas, ngunit nagsisikap kami na panatilihing mababa ang mga panganib.",
      },
    ],
  },
  {
    heading: "Ang iyong mga karapatan",
    items: [
      {
        type: "para",
        text: "Sa ilalim ng Data Privacy Act of 2012 (RA 10173), may karapatan kang:",
      },
      {
        type: "list",
        items: [
          "malaman kung paano ginagamit ang iyong datos;",
          "hilingin na makita ang datos na hawak namin tungkol sa iyo;",
          "hilingin sa amin na itama ang maling datos;",
          "tumutol sa ilang paggamit ng iyong datos;",
          "hilingin sa amin na burahin o i-block ang iyong datos;",
          "bawiin ang iyong pahintulot, kung saan umaasa rito ang paggamit;",
          "kumuha ng kopya ng iyong datos sa magagamit na anyo;",
          "humingi ng danyos kung pinapayagan ito ng batas; at",
          "**magreklamo sa National Privacy Commission** kung sa tingin mo ay nilabag ang iyong mga karapatan.",
        ],
      },
      {
        type: "para",
        text: "Para gamitin ang mga karapatang ito, mag-email sa **aligned.career.support@gmail.com**. Ang datos na nasa iyong device lamang ay tinatanggal gamit ang **Start over**. Ang iyong naka-save na record ay tinatanggal gamit ang **Delete saved copy**, o sa pamamagitan ng pagbibigay ng iyong results ID sa mga administrador ng programa.",
      },
    ],
  },
  {
    heading: "Mga mag-aaral na wala pang 18",
    items: [
      {
        type: "para",
        text: "Marami sa mga mag-aaral na gumagamit ng AlignEd ay menor de edad. **Kung wala ka pang 18, dapat basahin ng isang magulang o legal na tagapag-alaga ang Data Privacy Policy at Terms and Conditions na ito kasama ka.** Ibinibigay nila ang kanilang pahintulot para kunin mo ang assessment sa pamamagitan ng **pag-tsek sa kahon at pagpili ng I agree** sa hakbang ng profile. Maaaring kailanganin din ng iyong paaralan o programa ang sarili nitong hiwalay na kasunduan bago ka magsimula, kung saan iniaatas ito ng batas. Ipinapaliwanag namin kung paano ginagamit ang datos sa mga salitang maiintindihan ng mga mag-aaral.",
      },
    ],
  },
  {
    heading: "Mga Tuntunin at Kundisyon",
    items: [
      {
        type: "para",
        text: "Sa paggamit ng AlignEd, sumasang-ayon ka sa mga sumusunod na patakaran:",
      },
      {
        type: "list",
        items: [
          "**Libreng patnubay sa karera ang AlignEd.** Hindi ito isang pagsusulit na maaari mong pasahan o bagsakan, at hindi nito pinagdedesisyunan ang iyong kinabukasan.",
          "**Sumagot nang tapat** para akma sa'yo ang iyong resulta.",
          "**Huwag i-type ang mga pribadong detalye** tulad ng iyong buong pangalan, tirahan, numero ng telepono, o mga password.",
          "**Panatilihing pribado ang iyong results ID.** Huwag subukang hanapin ang results ID ng ibang tao.",
          "**Huwag abusuhin ang AlignEd.** Huwag mag-spam sa email feature, huwag subukang sirain o i-overload ang serbisyo, at huwag subukang makapasok sa admin page.",
          "Maaaring magbago, mag-pause, o maging hindi available ang AlignEd paminsan-minsan. Ginagawa namin ang aming makakaya para panatilihing tama ang resulta, ngunit maaari itong magkamali, kaya gamitin ito kasama ng payo mula sa mga taong pinagkakatiwalaan mo.",
        ],
      },
    ],
  },
  {
    heading: "Mga pagbabago sa mga tuntuning ito",
    items: [
      {
        type: "para",
        text: "Kung babaguhin namin kung paano kinokolekta, ginagamit, ibinabahagi, o itinatago ang iyong datos, o babaguhin ang mga tuntuning ito, ia-update namin ang paalalang ito at ang numero ng bersyon nito. Kung iniaatas ng batas, sasabihin namin sa iyo o sa iyong magulang o tagapag-alaga bago magsimula ang pagbabago.",
      },
    ],
  },
  {
    heading: "Pagsang-ayon sa mga tuntuning ito",
    items: [
      {
        type: "para",
        text: "Mangyaring basahin ang paalalang ito bago ka magsimula. **Ang pag-tsek sa kahon ay nangangahulugang nabasa mo at sumasang-ayon ka sa mga Tuntunin at Kundisyon at ang Data Privacy Policy na ito.** Maaari mong bawiin ang iyong pahintulot anumang oras sa pamamagitan ng pag-alis ng tsek sa kahon sa hakbang ng profile.",
      },
      {
        type: "para",
        text: "**Kung wala ka pang 18, dapat basahin ng isang magulang o legal na tagapag-alaga ang paalalang ito at sila mismo ang mag-tsek sa kahon** para ibigay ang kanilang pahintulot bago ka magsimula. Maaaring kailanganin din ng iyong paaralan o programa ang sarili nitong hiwalay na kasunduan, kung saan iniaatas ito ng batas.",
      },
    ],
  },
] satisfies readonly { heading: string; items: PolicyItem[] }[];

export const PRIVACY_TEXT_FIL = {
  cardHeading: "Patakaran sa Pagkapribado ng Data at Mga Tuntunin at Kundisyon",
  cardBlurbLead: "Walang account at walang kailangang tunay na pangalan.",
  cardBlurbRest:
    "Awtomatikong nabubura ang iyong sesyon sa device na ito pagkatapos ng 30 minuto. Ang iyong grado, strand, edad, at interest score lamang ang naka-save,",
  cardBlurbNoName: "walang pangalan",
  cardBlurbTail: ", para sa estadistika ng programa.",
  consentPrefix: "Nabasa ko at sumasang-ayon ako sa",
  consentLinkText: "Patakaran sa Pagkapribado ng Data at Mga Tuntunin at Kundisyon",
  hint: "Sumang-ayon sa Mga Tuntunin at Kundisyon para magpatuloy.",
  dialogTitle: "Mga Tuntunin at Kundisyon at Patakaran sa Pagkapribado ng Data",
  dialogDescriptionConsent: (version: string) =>
    `Paano hinahawakan ng AlignEd ang iyong datos (${version}). Mangyaring basahin ito bago mo simulan ang assessment.`,
  dialogDescriptionReadOnly: (version: string) =>
    `Paano hinahawakan ng AlignEd ang iyong datos (${version}).`,
  close: "Isara",
  agree: "Sumasang-ayon ako",
} as const;
