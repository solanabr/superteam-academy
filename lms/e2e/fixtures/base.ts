import { test as base } from "@playwright/test";
import { mockCommunityApi, mockLearningApi } from "./api-mock";

type Fixtures = {
  communityApi: ReturnType<typeof mockCommunityApi>;
  learningApi: ReturnType<typeof mockLearningApi>;
};

export const test = base.extend<Fixtures>({
  communityApi: async ({ page }, use) => {
    await use(mockCommunityApi(page));
  },
  learningApi: async ({ page }, use) => {
    await use(mockLearningApi(page));
  },
});

export { expect } from "@playwright/test";
