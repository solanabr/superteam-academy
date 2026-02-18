import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Courses")
        .child(S.documentTypeList("course").title("Courses")),
      S.listItem()
        .title("Modules")
        .child(S.documentTypeList("module").title("Modules")),
      S.listItem()
        .title("Lessons")
        .child(S.documentTypeList("lesson").title("Lessons")),
      S.listItem()
        .title("Challenges")
        .child(S.documentTypeList("challenge").title("Challenges")),
      ...S.documentTypeListItems().filter(
        (item) =>
          !["course", "module", "lesson", "challenge"].includes(item.getId() ?? "")
      ),
    ]);
