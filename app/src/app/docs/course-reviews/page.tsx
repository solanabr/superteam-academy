import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Course Reviews" };

export default function CourseReviewsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Course Reviews</h1>
      <p className="lead">
        After completing a course, you can leave a review to share your
        experience and help other learners choose the right courses.
      </p>

      <h2>Who Can Review</h2>
      <p>
        Only learners who have <strong>completed all lessons</strong> in a course
        can submit a review. This ensures reviews come from people who
        experienced the full course content.
      </p>
      <blockquote>
        <p>
          You do not need to finalize (claim the NFT credential) to leave a
          review — completing all lessons is enough.
        </p>
      </blockquote>

      <h2>How to Leave a Review</h2>
      <ol>
        <li>Complete all lessons in a course</li>
        <li>Go to the course detail page (click on the course from <strong>Courses</strong> or <strong>My Courses</strong>)</li>
        <li>Scroll down to the <strong>Student Reviews</strong> section</li>
        <li>Select a star rating (1–5 stars)</li>
        <li>Optionally write a comment (up to 1,000 characters)</li>
        <li>Click <strong>Submit Review</strong></li>
      </ol>

      <h2>Star Ratings</h2>
      <table>
        <thead>
          <tr><th>Stars</th><th>Meaning</th></tr>
        </thead>
        <tbody>
          <tr><td>⭐</td><td>Poor — Did not meet expectations</td></tr>
          <tr><td>⭐⭐</td><td>Below Average — Some useful content</td></tr>
          <tr><td>⭐⭐⭐</td><td>Average — Decent course overall</td></tr>
          <tr><td>⭐⭐⭐⭐</td><td>Good — Well structured and informative</td></tr>
          <tr><td>⭐⭐⭐⭐⭐</td><td>Excellent — Highly recommended</td></tr>
        </tbody>
      </table>

      <h2>Editing Your Review</h2>
      <p>
        You can only have <strong>one review per course</strong>. If you&apos;ve
        already reviewed a course, the review form will show your existing
        rating and comment — simply edit and click <strong>Update Review</strong>.
      </p>

      <h2>Deleting Your Review</h2>
      <p>
        To remove your review, click the <strong>trash icon</strong> next to
        your review in the reviews list. This action is permanent — you can
        always submit a new review afterward.
      </p>

      <h2>Viewing Reviews</h2>
      <p>
        All reviews are <strong>public</strong> and visible on the course
        detail page to anyone, including non-enrolled visitors. The review
        section shows:
      </p>
      <ul>
        <li><strong>Average rating</strong> and total number of reviews</li>
        <li>Each review with the author&apos;s display name, avatar, date, star rating, and comment</li>
      </ul>

      <h2>Review Guidelines</h2>
      <p>
        When writing reviews, please:
      </p>
      <ul>
        <li>Be honest and constructive</li>
        <li>Focus on the course content, structure, and learning experience</li>
        <li>Mention specific things that were helpful or could be improved</li>
        <li>Keep your review under 1,000 characters</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
