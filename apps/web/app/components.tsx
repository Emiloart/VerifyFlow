"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  Clipboard,
  FileCheck2,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  assertOnboardingClaims,
  parsePresentationPayload,
  type CreateVerificationResponse,
  type StartProviderCheckResponse,
  type KycLevel,
  type MeResponse,
  type OnboardingClaims,
  type OnboardingSessionResponse,
  type UpgradeTierResponse
} from "@verifyflow/contracts";

const presentationStorageKey = "verifyflow.latestPresentationPayload";

type ClaimsFormState = {
  subjectReference: string;
  fullLegalName: string;
  dateOfBirth: string;
  countryOfResidence: string;
  documentCountry: string;
  verifiedAt: string;
  expiresAt: string;
};

const defaultClaims = (): ClaimsFormState => {
  const now = new Date();
  const expires = new Date(now);
  expires.setFullYear(expires.getFullYear() + 1);

  return {
    subjectReference: `vf-${crypto.randomUUID().slice(0, 8)}`,
    fullLegalName: "",
    dateOfBirth: "1990-01-01",
    countryOfResidence: "US",
    documentCountry: "US",
    verifiedAt: toLocalDatetime(now),
    expiresAt: toLocalDatetime(expires)
  };
};

export function RequireSignIn() {
  return (
    <main className="content-shell">
      <section className="panel">
        <h1>Sign in required</h1>
        <p className="muted">VerifyFlow routes require a signed-in invited tester.</p>
        <Link className="button-link" href="/">Return to sign in</Link>
      </section>
    </main>
  );
}

export function Dashboard() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<MeResponse>("/v1/me")
  });

  return (
    <main className="content-shell">
      <section className="page-heading">
        <p className="eyebrow">Account tier</p>
        <h1>KYC-backed access state</h1>
      </section>
      <section className="status-band">
        <div>
          <p className="label">Current tier</p>
          <strong className={`tier tier-${me.data?.user.tier ?? "basic"}`}>{me.data?.user.tier ?? "loading"}</strong>
        </div>
        <div>
          <p className="label">Latest decision</p>
          <strong>{me.data?.user.latestVerification?.decision ?? "none"}</strong>
        </div>
        <div>
          <p className="label">Provider status</p>
          <strong>{me.data?.user.latestVerification?.providerStatus ?? "none"}</strong>
        </div>
      </section>
      {me.error instanceof Error ? <ErrorMessage message={me.error.message} /> : null}
      <section className="action-grid">
        <ActionLink href="/onboarding" icon={<UserCheck size={18} />} title="Start onboarding" text="Submit normalized claims and start a provider check." />
        <ActionLink href="/payload" icon={<Clipboard size={18} />} title="Provider payload" text="Review the latest one-time presentation payload in this browser." />
        <ActionLink href="/verify" icon={<ShieldCheck size={18} />} title="Verify check" text="Present the payload and request a provider decision." />
        <ActionLink href="/upgrade" icon={<ArrowUpRight size={18} />} title="Upgrade tier" text="Run and verify an enhanced provider check." />
      </section>
    </main>
  );
}

export function OnboardingFlow(props: { mode: KycLevel }) {
  const router = useRouter();
  const [form, setForm] = useState(defaultClaims);
  const [result, setResult] = useState<StartProviderCheckResponse | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      const claims = toClaims(form, props.mode);
      assertOnboardingClaims(claims);
      const session = await apiPost<OnboardingSessionResponse>("/v1/onboarding/sessions", { claims });
      return apiPost<StartProviderCheckResponse>("/v1/provider/checks", { onboardingSessionId: session.onboardingSessionId });
    },
    onSuccess(response) {
      sessionStorage.setItem(presentationStorageKey, JSON.stringify(response.presentationPayload, null, 2));
      setResult(response);
    }
  });

  function update(field: keyof ClaimsFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="content-shell">
      <section className="page-heading">
        <p className="eyebrow">Onboarding</p>
        <h1>{props.mode === "basic" ? "Start verified-tier check" : "Start enhanced-tier check"}</h1>
      </section>
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}>
        <FormFields form={form} update={update} />
        <button className="primary-button" type="submit" disabled={mutation.isPending}>
          <FileCheck2 size={18} />
          {mutation.isPending ? "Starting" : "Submit and start"}
        </button>
      </form>
      {mutation.error instanceof Error ? <ErrorMessage message={mutation.error.message} /> : null}
      {result !== null ? (
        <section className="success-band">
          <BadgeCheck size={20} />
          <div>
            <strong>{result.providerRunId}</strong>
            <p>Provider check started. The presentation payload is available on the payload page.</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => router.push("/payload")}>Open payload</button>
        </section>
      ) : null}
    </main>
  );
}

export function ProviderPayloadView() {
  const [payload, setPayload] = useState("");

  useEffect(() => {
    setPayload(sessionStorage.getItem(presentationStorageKey) ?? "");
  }, []);

  return (
    <main className="content-shell">
      <section className="page-heading">
        <p className="eyebrow">Provider presentation</p>
        <h1>One-time provider payload</h1>
      </section>
      <section className="panel">
        <textarea className="payload-box" readOnly value={payload} aria-label="Verifier transfer payload" />
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => navigator.clipboard.writeText(payload)} disabled={payload === ""}>
            <Clipboard size={18} />
            Copy payload
          </button>
          <Link className="button-link" href="/verify">Continue to verification</Link>
        </div>
      </section>
    </main>
  );
}

export function VerifyFlow() {
  const [payload, setPayload] = useState("");
  const [result, setResult] = useState<CreateVerificationResponse | null>(null);
  const mutation = useMutation({
    mutationFn: () => apiPost<CreateVerificationResponse>("/v1/verifications", {
      presentationPayload: parsePresentationPayload(payload)
    }),
    onSuccess(response) {
      setResult(response);
    }
  });

  useEffect(() => {
    setPayload(sessionStorage.getItem(presentationStorageKey) ?? "");
  }, []);

  return (
    <main className="content-shell">
      <section className="page-heading">
        <p className="eyebrow">Verification</p>
        <h1>Present provider payload</h1>
      </section>
      <form className="panel" onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}>
        <textarea className="payload-box" value={payload} onChange={(event) => setPayload(event.target.value)} aria-label="Verifier transfer payload" required />
        <button className="primary-button" type="submit" disabled={mutation.isPending}>
          <Send size={18} />
          {mutation.isPending ? "Verifying" : "Verify"}
        </button>
      </form>
      {mutation.error instanceof Error ? <ErrorMessage message={mutation.error.message} /> : null}
      {result !== null ? <VerificationResult response={result} /> : null}
    </main>
  );
}

export function UpgradeFlow() {
  const [form, setForm] = useState(defaultClaims);
  const [result, setResult] = useState<UpgradeTierResponse | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      const claims = toClaims(form, "enhanced");
      assertOnboardingClaims(claims);
      const session = await apiPost<OnboardingSessionResponse>("/v1/onboarding/sessions", { claims });
      return apiPost<UpgradeTierResponse>("/v1/tiers/upgrade", { onboardingSessionId: session.onboardingSessionId });
    },
    onSuccess(response) {
      sessionStorage.setItem(presentationStorageKey, JSON.stringify(response.presentationPayload, null, 2));
      setResult(response);
    }
  });

  return (
    <main className="content-shell">
      <section className="page-heading">
        <p className="eyebrow">Tier upgrade</p>
        <h1>Start and verify enhanced check</h1>
      </section>
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}>
        <FormFields form={form} update={(field, value) => setForm((current) => ({ ...current, [field]: value }))} />
        <button className="primary-button" type="submit" disabled={mutation.isPending}>
          <ArrowUpRight size={18} />
          {mutation.isPending ? "Upgrading" : "Upgrade"}
        </button>
      </form>
      {mutation.error instanceof Error ? <ErrorMessage message={mutation.error.message} /> : null}
      {result !== null ? <VerificationResult response={{ verification: result.verification, tier: result.tier }} /> : null}
    </main>
  );
}

export function SettingsView(props: { email: string }) {
  return (
    <main className="content-shell">
      <section className="page-heading">
        <p className="eyebrow">Settings</p>
        <h1>Account and consent</h1>
      </section>
      <section className="settings-list">
        <div>
          <p className="label">Signed in as</p>
          <strong>{props.email}</strong>
        </div>
        <div>
          <p className="label">Telemetry</p>
          <strong>Bounded first-party funnel events</strong>
        </div>
        <div>
          <p className="label">Provider access</p>
          <strong>Backend-only provider credentials</strong>
        </div>
      </section>
    </main>
  );
}

function FormFields(props: { form: ClaimsFormState; update: (field: keyof ClaimsFormState, value: string) => void }) {
  return (
    <>
      <label>
        Subject reference
        <input value={props.form.subjectReference} onChange={(event) => props.update("subjectReference", event.target.value)} required />
      </label>
      <label>
        Full legal name
        <input value={props.form.fullLegalName} onChange={(event) => props.update("fullLegalName", event.target.value)} required />
      </label>
      <label>
        Date of birth
        <input type="date" value={props.form.dateOfBirth} onChange={(event) => props.update("dateOfBirth", event.target.value)} required />
      </label>
      <label>
        Country of residence
        <input maxLength={2} value={props.form.countryOfResidence} onChange={(event) => props.update("countryOfResidence", event.target.value.toUpperCase())} required />
      </label>
      <label>
        Document country
        <input maxLength={2} value={props.form.documentCountry} onChange={(event) => props.update("documentCountry", event.target.value.toUpperCase())} required />
      </label>
      <label>
        Verified at
        <input type="datetime-local" value={props.form.verifiedAt} onChange={(event) => props.update("verifiedAt", event.target.value)} required />
      </label>
      <label>
        Expires at
        <input type="datetime-local" value={props.form.expiresAt} onChange={(event) => props.update("expiresAt", event.target.value)} required />
      </label>
    </>
  );
}

function VerificationResult(props: { response: CreateVerificationResponse }) {
  return (
    <section className={`result-band decision-${props.response.verification.decision}`}>
      <ShieldCheck size={20} />
      <div>
        <strong>{props.response.verification.decision} {"->"} {props.response.tier}</strong>
        <p>{props.response.verification.reasonCodes.join(", ")}</p>
      </div>
    </section>
  );
}

function ActionLink(props: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link className="action-link" href={props.href}>
      <span>{props.icon}</span>
      <strong>{props.title}</strong>
      <p>{props.text}</p>
    </Link>
  );
}

function ErrorMessage(props: { message: string }) {
  return (
    <p className="error-message" role="alert">
      <RefreshCw size={16} />
      {props.message}
    </p>
  );
}

function toClaims(form: ClaimsFormState, kycLevel: KycLevel): OnboardingClaims {
  return {
    ...form,
    kycLevel,
    verifiedAt: new Date(form.verifiedAt).toISOString(),
    expiresAt: new Date(form.expiresAt).toISOString()
  };
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID()
    },
    body: JSON.stringify(body)
  });
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`/api/verifyflow${path}`, init);
  const payload = await response.json() as T | { error?: { message?: string } };

  if (!response.ok) {
    const message = typeof (payload as { error?: { message?: string } }).error?.message === "string"
      ? (payload as { error: { message: string } }).error.message
      : "VerifyFlow request failed.";
    throw new Error(message);
  }

  return payload as T;
}

function toLocalDatetime(date: Date): string {
  return date.toISOString().slice(0, 16);
}
