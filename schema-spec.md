# schema-spec.md

This package contains the first implementation of a database-first Olympiad Mathematics knowledge system using JSON Schema Draft 2020-12.

## What is included
- Canonical taxonomy file: `taxonomy/taxonomy.json`
- Shared enum definitions: `schemas/enums/enums.schema.json`
- Shared reusable building blocks under `schemas/common/`
- Entity schemas under `schemas/entities/`
- Union bundle schema under `schemas/bundles/olympiad-knowledge-system.schema.json`

## Implemented entity schemas
- `topic`
- `definition`
- `theorem`
- `technique`
- `example`
- `problem`
- `solution`
- `progress_record`
- `review_schedule`
- `mastery_profile`

## Modeling principles
1. Canonical content and learner-state are separated.
2. All cross-entity links are by stable id.
3. Source content is normalized for Markdown/LaTeX export.
4. Top-level entities are independently valid JSON documents.
5. The taxonomy namespace is preserved: `nt`, `alg`, `comb`, `geo`, `meta`.

## Important validation note
A few constraints are only partially expressible in portable JSON Schema and are therefore documented but not fully enforced in schema alone:
- membership of topic ids in the exact canonical `taxonomy.json` set
- chronological comparisons like `updated_at >= created_at`
- graph-level uniqueness constraints such as “one active review schedule per learner + target”
- self-reference exclusions such as “a topic cannot list itself as a prerequisite”

Those should be enforced in the import pipeline, database constraints, or application service layer.

## File layout
See the folder structure already created in this package.
