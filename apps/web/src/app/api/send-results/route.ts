// Copyright (c) 2026 EdTech. All rights reserved.

import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";

import {
  buildResultsEmail,
  normalizeEmail,
  parseTakenOn,
  validateRequest,
} from "@/lib/results-email/email-content";
import { createRateLimiter } from "@/lib/results-email/rate-limiter";
import { resultsPdfPassword } from "@/lib/results-pdf/password";
import { renderResultsPdf } from "@/lib/results-pdf/render-results-pdf";

// POST /api/send-results (PRD FR-8): emails a student their results as a
// password-protected PDF (NICKNAME + MMDDYYYY, the same file and password
// as Download PDF) from the school's Gmail account, then forgets the
// address. Only salted hashes of the address and IP are kept, in memory,
// for rate limiting.
//
// Server-only settings in apps/web/.env.local (never NEXT_PUBLIC_):
//   GMAIL_USER          the Gmail address that sends, e.g. aligned@gmail.com
//   GMAIL_APP_PASSWORD  a 16-letter Google App Password for that account
//                       (myaccount.google.com/apppasswords), not the normal
//                       Gmail password

// Rate-limit keys only need to match within this server's lifetime, so a
// fresh random salt per process means the hashes are useless to anyone else.
const SALT = randomBytes(32).toString("hex");
const limiter = createRateLimiter();

function saltedHash(value: string): string {
  return createHash("sha256").update(`${SALT}:${value}`).digest("hex");
}

function callerIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) {
    console.error("send-results: set GMAIL_USER and GMAIL_APP_PASSWORD.");
    return Response.json({ error: "not_configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const validation = validateRequest(body);
  if (!validation.ok) {
    return Response.json(
      { error: "invalid", message: validation.error },
      { status: 400 },
    );
  }
  const { email, website, results } = validation.value;

  // Honeypot filled: look successful, send nothing, count nothing.
  if (website) return Response.json({ ok: true });

  const emailHash = saltedHash(normalizeEmail(email));
  const ipHash = saltedHash(callerIp(request));
  if (limiter.isLimited(emailHash, ipHash)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  // The same locked PDF as Download PDF: same content, same password.
  const takenOn = parseTakenOn(results.takenOn)!; // checked by validateRequest
  let pdf: Buffer;
  try {
    pdf = await renderResultsPdf({
      nickname: results.nickname,
      gradeLevel: results.gradeLevel,
      // Not sent by the browser: free text has no place in a server-built
      // attachment, and it is optional on the download too.
      age: "",
      school: "",
      scores: results.scores,
      code: results.code,
      maxScore: results.maxScore,
      takenOn,
      password: resultsPdfPassword(results.nickname, takenOn),
    });
  } catch (error) {
    console.error("send-results: could not build the PDF:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }

  const message = buildResultsEmail(results);
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transport.sendMail({
      from: { name: "AlignEd", address: user },
      to: email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: [
        {
          filename: message.attachmentName,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    // Gmail's error text can echo the recipient, so log only its code.
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "unknown";
    console.error("send-results: Gmail rejected the email:", code);
    return Response.json({ error: "failed" }, { status: 502 });
  }

  limiter.record(emailHash, ipHash);
  return Response.json({ ok: true });
}
