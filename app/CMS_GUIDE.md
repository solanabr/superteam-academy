 CMS Guide

--- 

# Overview

The CMS manages course content, modules, and lessons for the Superteam Academy platform.

Content is structured hierarchically:

Course
 ├── Modules
 │     ├── Lessons
 │           ├── Content lesson
 │           └── Challenge lesson

---

# Content Structure
Course

Fields:

* title
* description
* difficulty
* duration
* modules

---

# Module

Fields:

*  title
* lessons

---

# Lesson

Fields:

* title
* type (content or challenge)
* content (markdown)
* starter code
* solution code
* XP reward

---

# Creating a Course

Steps:

* Open CMS dashboard
* Create new Course
* Add metadata
* Add modules
* Add lessons inside modules
* Publish course

---

# Editing a Course

Steps:

* Open CMS
* Select course
* Edit lesson or module
* Save and publish

Changes reflect immediately in frontend.

---

# Publishing Workflow

States:

Draft → Review → Publish

Only published content appears in production.

---

# Media Support

CMS supports:

* Images
* Videos
* Code blocks
* Markdown formatting

--- 

# Frontend Integration

Frontend fetches CMS data using service layer.

Example flow:

Frontend → CMS → Course Data → Render UI

--- 

# Summary

CMS enables dynamic course management without modifying frontend code.