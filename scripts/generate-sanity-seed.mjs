import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "src", "content");
const registryPath = path.join(contentRoot, "courses.json");
const coursesDir = path.join(contentRoot, "courses");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const lines = [];

function addDoc(doc) {
  lines.push(JSON.stringify(doc));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function withLocale(value) {
  if (!value) return { en: "", pt: "", es: "" };
  if (typeof value === "string") return { en: value, pt: value, es: value };
  return {
    en: value.en ?? "",
    pt: value.pt ?? "",
    es: value.es ?? "",
  };
}

const courseMetaMap = new Map(Object.entries(registry));
for (const dir of fs.readdirSync(coursesDir)) {
  const maybeMeta = path.join(coursesDir, dir, "meta.json");
  if (fs.existsSync(maybeMeta) && !courseMetaMap.has(dir)) {
    courseMetaMap.set(dir, `courses/${dir}/meta.json`);
  }
}

let lessonCount = 0;
for (const [courseId, relMetaPath] of courseMetaMap.entries()) {
  const metaPath = path.join(contentRoot, relMetaPath);
  const meta = readJson(metaPath);

  addDoc({
    _id: `course.${courseId}`,
    _type: "course",
    courseId,
    title: withLocale(meta.title),
    description: withLocale(meta.description),
    trackCollection: meta.trackCollection ?? "",
  });

  const courseDir = path.dirname(metaPath);
  const lessonsDir = path.join(courseDir, "lessons");

  if (!fs.existsSync(lessonsDir)) {
    continue;
  }

  const lessonFiles = fs
    .readdirSync(lessonsDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  lessonFiles.forEach((file, idx) => {
    const lesson = readJson(path.join(lessonsDir, file));
    const content = [
      lesson.description?.en ?? lesson.description ?? "",
      "",
      ...(Array.isArray(lesson.hints)
        ? lesson.hints.map((h, i) => `Hint ${i + 1}: ${h?.en ?? h ?? ""}`)
        : []),
    ]
      .join("\n")
      .trim();

    addDoc({
      _id: `lesson.${courseId}.${idx}`,
      _type: "lesson",
      courseId,
      lessonIndex: idx,
      title: lesson.title?.en ?? `Lesson ${idx + 1}`,
      description: lesson.description?.en ?? "",
      xpReward: 100,
      content,
      starterCode: lesson.starterCode ?? "",
      ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
      tests: [
        {
          _key: `t_${courseId}_${idx}`,
          name: "challenge",
          assertion: lesson.testCode ?? "",
        },
      ],
    });
    lessonCount += 1;
  });
}

const outPath = path.join(root, "sanity-seed.ndjson");
fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Generated ${outPath}`);
console.log(`Documents: ${lines.length} (courses + lessons=${lessonCount})`);
