# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ONE MILLION is a deliberately minimal viral social experiment with one goal: see whether people on the internet will collectively contribute $1,000,000 simply because the goal exists.

Core message:
"$1,000,000. Because why not?"

Supporting message:
"No cause. No reward. No explanation. Just one ridiculous goal."

## Stack

Next.js, TypeScript, Tailwind CSS.

## Design direction

Bold, minimal, premium, modern. Black-and-white palette. Mobile-first.

## Permanent project rules

- Use USD throughout
- Display money using the $ symbol
- Store all money internally as integer cents, never floating-point values
- Use "contribution" and "contribute," never "donation" or "donate"
- Do not describe the project as a charity
- Read PROJECT_SPEC.md before implementing features
- PROJECT_SPEC.md is the authoritative full product specification
- Work on one implementation phase at a time
- Do not begin the next phase until the current phase has been reviewed and approved
- Do not invent contributors, payments, activity, urgency, legal details, or financial information
- Only inspect and modify files inside the current one-million folder
- Do not add real API keys or secrets to the repository
- Run relevant lint, test, and build commands after implementation
- Explain major planned file changes before making them
