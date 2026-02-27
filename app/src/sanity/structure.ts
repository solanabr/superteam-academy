import type { StructureResolver } from 'sanity/structure';

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Learning Content Section
      S.listItem()
        .title('Learning Content')
        .child(
          S.list()
            .title('Learning Content')
            .items([
              S.listItem()
                .title('Tracks')
                .schemaType('track')
                .child(S.documentTypeList('track').title('Learning Tracks')),
              S.listItem()
                .title('Courses')
                .schemaType('course')
                .child(S.documentTypeList('course').title('Courses')),
              S.listItem()
                .title('Lessons')
                .schemaType('lesson')
                .child(S.documentTypeList('lesson').title('Lessons')),
            ])
        ),

      S.divider(),

      // People Section
      S.listItem()
        .title('Instructors')
        .schemaType('instructor')
        .child(S.documentTypeList('instructor').title('Instructors')),

      S.divider(),

      // Gamification Section
      S.listItem()
        .title('Achievements')
        .schemaType('achievement')
        .child(S.documentTypeList('achievement').title('Achievements')),

      S.divider(),

      // All Documents
      ...S.documentTypeListItems().filter(
        (listItem) =>
          !['track', 'course', 'lesson', 'instructor', 'achievement'].includes(
            listItem.getId() || ''
          )
      ),
    ]);
