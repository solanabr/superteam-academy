import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Sanity CMS" };

export default function SanityPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Sanity CMS</h1>
      <p className="lead">
        Sanity is the headless CMS that stores all course content — lessons,
        modules, quizzes, challenges, and metadata. Content is queried via
        GROQ and rendered in the Next.js frontend.
      </p>

      <h2>What Sanity Does</h2>
      <ul>
        <li><strong>Course content storage</strong> — Rich text, code blocks, images</li>
        <li><strong>Sanity Studio</strong> — Visual content editor embedded at <code>/studio</code></li>
        <li><strong>GROQ queries</strong> — Query language for fetching structured content</li>
        <li><strong>Content versioning</strong> — Draft/published workflow</li>
        <li><strong>CDN delivery</strong> — Images served via <code>cdn.sanity.io</code></li>
      </ul>

      <h2>Setting Up Sanity</h2>
      <ol>
        <li>Go to <a href="https://www.sanity.io/manage" target="_blank" rel="noopener noreferrer">sanity.io/manage</a></li>
        <li>Create a new project</li>
        <li>Note the <strong>Project ID</strong></li>
        <li>The default dataset is &quot;production&quot; — you can create others for staging</li>
        <li>Go to <strong>API → Tokens</strong> and create a token with <strong>Editor</strong> role</li>
        <li>Add CORS origin: <code>http://localhost:3000</code> (and your production URL later)</li>
      </ol>

      <h2>Schema</h2>
      <p>
        The Sanity schema is defined in <code>app/sanity.config.ts</code> and
        <code>app/src/lib/sanity/schemas.ts</code>. Three document types:
      </p>

      <h3>Course</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>title</code></td><td>string</td><td>Course title</td></tr>
          <tr><td><code>slug</code></td><td>slug</td><td>URL-friendly identifier</td></tr>
          <tr><td><code>courseId</code></td><td>number</td><td>On-chain course ID</td></tr>
          <tr><td><code>description</code></td><td>text</td><td>Course description</td></tr>
          <tr><td><code>thumbnail</code></td><td>image</td><td>Cover image</td></tr>
          <tr><td><code>difficulty</code></td><td>number (1-3)</td><td>1=Beginner, 2=Intermediate, 3=Advanced</td></tr>
          <tr><td><code>duration</code></td><td>string</td><td>Estimated completion time</td></tr>
          <tr><td><code>trackId</code></td><td>number</td><td>Learning track (1-7)</td></tr>
          <tr><td><code>trackLevel</code></td><td>number</td><td>Order within track</td></tr>
          <tr><td><code>xpPerLesson</code></td><td>number</td><td>Base XP per lesson</td></tr>
          <tr><td><code>prerequisite</code></td><td>reference</td><td>Prerequisite course</td></tr>
          <tr><td><code>modules</code></td><td>array</td><td>List of modules</td></tr>
          <tr><td><code>whatYouLearn</code></td><td>array of strings</td><td>Learning objectives</td></tr>
          <tr><td><code>isPublished</code></td><td>boolean</td><td>Publication status</td></tr>
          <tr><td><code>isActive</code></td><td>boolean</td><td>Active/visible status</td></tr>
        </tbody>
      </table>

      <h3>Module (Embedded Object)</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>title</code></td><td>string</td><td>Module title</td></tr>
          <tr><td><code>description</code></td><td>text</td><td>Module description</td></tr>
          <tr><td><code>order</code></td><td>number</td><td>Display order</td></tr>
          <tr><td><code>lessons</code></td><td>array</td><td>List of lessons</td></tr>
        </tbody>
      </table>

      <h3>Lesson (Embedded Object)</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>title</code></td><td>string</td><td>Lesson title</td></tr>
          <tr><td><code>description</code></td><td>text</td><td>Brief description</td></tr>
          <tr><td><code>order</code></td><td>number</td><td>Order within module</td></tr>
          <tr><td><code>type</code></td><td>string</td><td>&quot;content&quot;, &quot;challenge&quot;, or &quot;quiz&quot;</td></tr>
          <tr><td><code>content</code></td><td>block[]</td><td>Portable Text + code blocks</td></tr>
          <tr><td><code>xp</code></td><td>number</td><td>XP reward</td></tr>
          <tr><td><code>duration</code></td><td>string</td><td>Estimated time</td></tr>
          <tr><td><code>challenges</code></td><td>array</td><td>Coding challenge definitions</td></tr>
          <tr><td><code>quizzes</code></td><td>array</td><td>Quiz questions and answers</td></tr>
        </tbody>
      </table>

      <h2>Sanity Studio</h2>
      <p>
        Sanity Studio is embedded in the app at the <code>/studio</code> route.
        Access it at <code>http://localhost:3000/studio</code> during development.
      </p>
      <p>From the Studio, you can:</p>
      <ul>
        <li>Create, edit, and publish courses</li>
        <li>Manage modules and lessons with rich text editors</li>
        <li>Add code blocks with syntax highlighting (via code-input plugin)</li>
        <li>Upload images for course thumbnails</li>
        <li>Preview content before publishing</li>
      </ul>

      <h2>Content Push Scripts</h2>
      <p>
        Pre-built course content can be pushed to Sanity using the scripts in
        the <code>scripts/</code> directory:
      </p>
      <pre><code>{`# Push all courses
npx ts-node scripts/push-courses-to-sanity.ts

# Push individual courses
npx ts-node scripts/push-solana-getting-started.ts
npx ts-node scripts/push-solana-core-concepts.ts
npx ts-node scripts/push-anchor-course.ts
npx ts-node scripts/push-solana-frontend.ts
npx ts-node scripts/push-solana-token-basics.ts
npx ts-node scripts/push-solana-token-extensions.ts
npx ts-node scripts/push-metaplex-nfts-course.ts
npx ts-node scripts/push-metaplex-tokens-course.ts
npx ts-node scripts/push-metaplex-smart-contracts-course.ts
npx ts-node scripts/push-metaplex-dev-tools-course.ts
npx ts-node scripts/push-solana-typescript-sdk.ts
npx ts-node scripts/push-solana-rust-sdk.ts
npx ts-node scripts/push-solana-python-sdk.ts
npx ts-node scripts/push-solana-go-sdk.ts
npx ts-node scripts/push-solana-java-sdk.ts
npx ts-node scripts/push-solana-gaming-sdks.ts
npx ts-node scripts/push-solana-developing-programs.ts`}</code></pre>

      <h2>Querying Content</h2>
      <p>
        The <code>SanityCourseService</code> fetches content using GROQ queries.
        Two Sanity clients exist:
      </p>
      <ul>
        <li><code>lib/sanity/client.ts</code> — Read-only client (uses anon/public access)</li>
        <li><code>lib/sanity/write-client.ts</code> — Write client (uses <code>SANITY_API_TOKEN</code>)</li>
      </ul>

      <h2>Sanity Plugins</h2>
      <ul>
        <li><code>@sanity/structure-tool</code> — Document list and editing UI</li>
        <li><code>@sanity/code-input</code> — Code block fields with syntax highlighting</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
