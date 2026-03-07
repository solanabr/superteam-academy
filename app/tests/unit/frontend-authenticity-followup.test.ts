import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("frontend authenticity follow-up audit", () => {
  it("does not present mentor session counts as reviews or generic mentor labels", () => {
    const mentorCardSource = readSource("src", "components", "mentors", "MentorCard.tsx");
    const mentorListSource = readSource("src", "app", "[locale]", "mentors", "page.tsx");
    const mentorDetailSource = readSource("src", "app", "[locale]", "mentors", "[id]", "page.tsx");
    const sessionsSource = readSource("src", "app", "[locale]", "sessions", "page.tsx");

    expect(mentorCardSource).not.toContain("reviewCount");
    expect(mentorCardSource).not.toContain('tMentors("reviews")');
    expect(mentorListSource).not.toContain("reviewCount:");
    expect(mentorDetailSource).not.toContain("reviewCount:");
    expect(sessionsSource).not.toContain('"Mentor"');
  });

  it("uses real idea interest submission and does not fabricate founder or comment data", () => {
    const ideasSource = readSource("src", "app", "[locale]", "ideas", "page.tsx");
    const ideaDetailSource = readSource("src", "app", "[locale]", "ideas", "[id]", "page.tsx");
    const ideaCardSource = readSource("src", "components", "ideas", "IdeaCard.tsx");
    const interestModalSource = readSource("src", "components", "ideas", "InterestModal.tsx");

    expect(ideasSource).toContain("/api/ideas/");
    expect(ideasSource).toContain("/interest");
    expect(ideasSource).not.toContain('console.log("Interest submitted:"');
    expect(ideasSource).not.toContain('"Founder"');
    expect(ideasSource).not.toContain("comments: 0");
    expect(ideaDetailSource).not.toContain('"Founder"');
    expect(ideaDetailSource).not.toContain('"Interested builder"');
    expect(ideaDetailSource).not.toContain("comments: 0");
    expect(ideaCardSource).not.toContain("MessageSquare");
    expect(interestModalSource).not.toContain("The founder will be notified");
  });

  it("does not synthesize project author or reviewer identities locally", () => {
    const projectsSource = readSource("src", "app", "[locale]", "projects", "page.tsx");
    const projectDetailSource = readSource("src", "app", "[locale]", "projects", "[id]", "page.tsx");

    expect(projectsSource).not.toContain('"unknown"');
    expect(projectDetailSource).not.toContain('|| "unknown"');
    expect(projectDetailSource).not.toContain('name: "You"');
  });

  it("does not ship mocked hackathon data or fabricated registration state", () => {
    const hackathonsSource = readSource("src", "app", "[locale]", "hackathons", "page.tsx");
    const cardSource = readSource("src", "components", "hackathons", "HackathonCard.tsx");
    const serviceSource = readSource("src", "lib", "services", "implementations", "hackathons-prisma.ts");

    expect(hackathonsSource).not.toContain("registrationOpen:");
    expect(cardSource).not.toContain('tHackathons("registrationOpen")');
    expect(serviceSource).not.toContain("mockDevfolioEvents");
    expect(serviceSource).not.toContain("mockDevfolioApiCall");
    expect(serviceSource).not.toContain("Math.random()");
  });
});
