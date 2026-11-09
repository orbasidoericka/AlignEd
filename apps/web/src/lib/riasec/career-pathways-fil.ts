// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecLetter } from "./types";

// Filipino translation of the official "Which Career Pathway is right for
// you?" sheet in career-pathways.ts. Same letters, same majors and pathways,
// same sheet order — only the words change, so a translated page still lists
// every item the English one does, in the same order (silent sorting still
// holds: no ranking implied by position).
export const PATHWAY_NAME_FIL: Readonly<Record<RiasecLetter, string>> = {
  R: "Makatotohanan",
  I: "Mapagsuri",
  A: "Masining",
  S: "Panlipunan",
  E: "Mapag-enterpretasyon",
  C: "Konbensyonal",
};

export const PATHWAY_DESCRIPTION_FIL: Readonly<Record<RiasecLetter, string>> = {
  R: "Ang mga taong ito ay kadalasang mahusay sa mga trabahong mekanikal o atletiko. Ang magagandang major sa kolehiyo para sa mga taong Realistiko ay:",
  I: "Ang mga taong ito ay mahilig manood, matuto, magsuri, at lumutas ng mga problema. Ang magagandang major sa kolehiyo para sa mga taong Investigative ay:",
  A: "Gusto ng mga taong ito na magtrabaho sa mga sitwasyong walang istruktura kung saan magagamit nila ang kanilang pagkamalikhain. Ang magagandang major para sa mga Artistic na tao ay…",
  S: "Mas gusto ng mga taong ito na makipagtulungan sa ibang tao, kaysa sa mga bagay-bagay. Ang magagandang major sa kolehiyo para sa mga taong sosyal ay…",
  E: "Ang mga taong ito ay mahilig makipagtulungan sa iba at nasisiyahan sa panghihikayat at pagtatanghal. Ang magagandang major sa kolehiyo para sa mga taong masigasig ay:",
  C: "Ang mga taong ito ay napaka-detalyado, organisado, at mahilig gumamit ng datos. Ang magagandang major sa kolehiyo para sa mga Konbensyonal na tao ay:",
};

export const PATHWAY_MAJORS_FIL: Readonly<Record<RiasecLetter, readonly string[]>> = {
  R: [
    "Agrikultura",
    "Katulong sa Kalusugan",
    "Mga Kompyuter",
    "Konstruksyon",
    "Mekaniko/Makinista",
    "Inhinyeriya",
    "Pagkain at Pagtanggap sa mga Biyaya",
  ],
  I: [
    "Biyolohiyang Dagat",
    "Inhinyeriya",
    "Kemistri",
    "Zoolohiya",
    "Medisina/Operasyon",
    "Ekonomiks ng Mamimili",
    "Sikolohiya",
  ],
  A: [
    "Komunikasyon",
    "Kosmetolohiya",
    "Sining at Pagtatanghal",
    "Potograpiya",
    "Radyo at TV",
    "Disenyo ng Panloob",
    "Arkitektura",
  ],
  S: [
    "Pagpapayo",
    "Pag-aalaga",
    "Pisikal na Terapiya",
    "Paglalakbay",
    "Pag-aanunsyo",
    "Relasyong Pampubliko",
    "Edukasyon",
  ],
  E: [
    "Pagmemerkado ng Moda",
    "Ari-arian",
    "Marketing/Benta",
    "Batas",
    "Agham Pampulitika",
    "Pandaigdigang Kalakalan",
    "Pagbabangko/Pananalapi",
  ],
  C: [
    "Pagtutuos",
    "Pag-uulat ng Korte",
    "Seguro",
    "Administrasyon",
    "Mga Rekord na Medikal",
    "Pagbabangko",
    "Pagproseso ng Datos",
  ],
};

export const PATHWAY_RELATED_FIL: Readonly<Record<RiasecLetter, readonly string[]>> = {
  R: [
    "Likas na Yaman",
    "Mga Serbisyong Pangkalusugan",
    "Teknolohiyang Industriyal at Inhinyeriya",
    "Sining at Komunikasyon",
  ],
  I: [
    "Mga Serbisyong Pangkalusugan",
    "Negosyo",
    "Mga Serbisyong Pampubliko at Pantao",
    "Teknolohiyang Industriyal at Inhinyeriya",
  ],
  A: ["Mga Serbisyong Pampubliko at Pantao", "Sining at Komunikasyon"],
  S: ["Mga Serbisyong Pangkalusugan", "Mga Serbisyong Pampubliko at Pantao"],
  // The source paste wrote "Pampulitiko" (political) here; every other letter
  // uses "Pampubliko" (public) for the same English item ("Public and Human
  // Services"), so this follows them rather than repeating what reads as a typo.
  E: ["Negosyo", "Mga Serbisyong Pampubliko at Pantao", "Sining at Komunikasyon"],
  C: [
    "Mga Serbisyong Pangkalusugan",
    "Negosyo",
    "Teknolohiyang Industriyal at Inhinyeriya",
  ],
};
