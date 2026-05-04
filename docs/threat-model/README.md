# Threat Model Guide

## Purpose

Threat modeling is mandatory because VerifyFlow handles identity assurance, tier grants, provider artifacts, and sensitive operational telemetry.

## Review tiers

Use a threat delta for moderate workflow, endpoint, telemetry, or deployment changes.
Use a full threat-model update for auth, provider integration, artifact handling, storage, tier-decision, or trust-boundary changes.

## Required analysis areas

- spoofing
- tampering
- repudiation
- information disclosure
- denial of service
- privilege escalation
- account takeover
- KYC data over-collection
- replay or relay
- correlation and linkability
- dependency compromise
