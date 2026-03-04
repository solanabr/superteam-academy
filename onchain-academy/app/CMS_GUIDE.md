# CMS Guide

## Content Model

The CMS should represent:

- `course`: title, slug, description, difficulty, duration, XP reward, track
- `module`: title, course reference, display order
- `lesson`: title, module reference, type (`content` or `challenge`), markdown content, starter code

Reference schema starter files:
- `src/cms/schemas.ts`

## Publishing Workflow

1. Create a draft course.
2. Add modules and lesson ordering.
3. Add challenge starter code and visible test cases.
4. Publish course and validate in `/courses` list.

## Localization

UI text is localized in `src/messages/*.json`.
Course content can remain in source language for MVP.
