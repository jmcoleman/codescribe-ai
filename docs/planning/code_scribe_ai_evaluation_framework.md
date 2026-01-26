# CodeScribe AI – Evaluation Framework

## Purpose
This document defines the **mandatory evaluation framework** for CodeScribe AI outputs. It exists to ensure **correctness, trust, and consistency** across all generated documentation artifacts before they reach users.

This is not aspirational guidance. These evaluations represent the **minimum bar for production readiness**.

---

## Evaluation Principles

All evaluations must:
- Be **repeatable**
- Be **measurable** (pass/fail where possible)
- Target **specific failure modes**
- Run continuously (CI or pre-release gating)

No single evaluation is sufficient. Coverage requires a **layered suite**.

---

## 1. Correctness Evaluations

Correctness is non-negotiable. If the output is wrong, everything else is irrelevant.

### 1.1 Golden Answer (Reference) Evaluation

**Objective**  
Ensure outputs align with authoritative references.

**Method**
- Maintain a curated golden dataset including:
  - Canonical READMEs
  - Known APIs
  - Valid OpenAPI / AsyncAPI specs
  - Correct JSDoc / TSDoc examples
- Compare model output against references using:
  - Structural diffs (AST-level where feasible)
  - Semantic equivalence checks

**Fail Conditions**
- Incorrect parameters or types
- Missing required fields
- Hallucinated methods or endpoints
- Incorrect return values or examples

---

### 1.2 Executability & Parsability Evaluation

**Objective**  
Ensure outputs are usable, not just readable.

**Method**
- Automatically attempt to:
  - Parse OpenAPI / AsyncAPI files
  - Compile TypeScript examples
  - Lint JSDoc
  - Render Markdown

**Fail Conditions**
- Syntax errors
- Invalid schemas
- Broken code blocks
- Markdown that does not render correctly

If it does not parse or compile, it is considered incorrect.

---

### 1.3 Hallucination Detection Evaluation

**Objective**  
Prevent invention of nonexistent functionality or context.

**Method**
- Compare all referenced entities (files, functions, endpoints, configs) against:
  - The provided input context only
- Flag any output that introduces:
  - APIs not present in the source
  - Unsupported configuration options
  - Files or services that do not exist

**Metric**
- Hallucination rate per 1,000 tokens

---

## 2. Trust Evaluations

Correct output that users do not trust is still a failure.

### 2.1 Attribution & Uncertainty Evaluation

**Objective**  
Ensure the model distinguishes facts from assumptions.

**Method**
- Validate that outputs:
  - Clearly label assumptions
  - Use qualifying language where uncertainty exists
  - Avoid fabricated citations or implied authority

**Fail Conditions**
- Overconfident statements without evidence
- Assumptions presented as facts

---

### 2.2 Security & Data Safety Evaluation

**Objective**  
Prevent unsafe or irresponsible documentation patterns.

**Method**
- Adversarial prompts including:
  - Embedded secrets
  - Tokens in comments
  - Unsafe authentication examples
- Verify outputs:
  - Redact sensitive data
  - Warn users appropriately
  - Refuse to generate unsafe patterns when required

---

### 2.3 Input Scope Alignment Evaluation

**Objective**  
Ensure outputs remain within the provided codebase or API scope.

**Method**
- Provide partial or constrained inputs
- Penalize outputs that:
  - Require infrastructure not supplied
  - Document files or APIs not provided
  - Add speculative or "helpful" but unsupported features

Scope violations are a primary cause of user distrust.

---

## 3. Consistency Evaluations

Documentation must be predictably consistent at scale.

### 3.1 Cross-Run Stability Evaluation

**Objective**  
Ensure repeated runs produce materially consistent outputs.

**Method**
- Run multiple generations on identical inputs
- Compare for:
  - Section ordering
  - Terminology
  - Naming conventions

**Fail Conditions**
- Structural drift
- Changing definitions
- Inconsistent examples

---

### 3.2 Style & Schema Conformance Evaluation

**Objective**  
Enforce CodeScribe AI house style and structure.

**Method**
- Validate outputs against:
  - Required section schemas
  - Heading hierarchy rules
  - Tone and formatting standards
  - Accessibility constraints (e.g., WCAG-friendly Markdown)

**Metric**
- Schema compliance score (binary preferred)

---

### 3.3 Cross-Artifact Consistency Evaluation

**Objective**  
Ensure agreement across multiple generated artifacts.

**Method**
- Extract shared entities (functions, parameters, types)
- Compare across:
  - README
  - API reference
  - Code examples

**Fail Conditions**
- Conflicting definitions
- Examples that contradict reference documentation

---

## 4. Meta-Evaluations (Evaluator Quality Control)

Evaluations themselves must be validated.

### 4.1 Judge Agreement Evaluation

**Objective**  
Ensure evaluator reliability.

**Method**
- Compare judgments from:
  - Rule-based validators
  - LLM-based judges
  - Periodic human review

Significant disagreement indicates a broken evaluation, not a broken model.

---

### 4.2 Regression Evaluation

**Objective**  
Prevent regressions during iteration.

**Method**
- Snapshot known-good outputs
- Re-run full eval suite on:
  - Model changes
  - Prompt changes
  - System instruction updates

Any regression blocks release.

---

## Production Readiness Gate (Minimum Bar)

An output is considered **production-ready** only if it passes:

- Golden answer correctness checks
- Parsability / compilation validation
- Hallucination detection thresholds
- Cross-run stability checks
- Schema and style conformance
- Regression comparison against known-good outputs

Failure on any mandatory check results in rejection.

---

## Final Note

This framework is intentionally strict. CodeScribe AI is a documentation platform, not a demo generator. Users expect accuracy, reliability, and professional consistency every time.

