import { Hono } from "hono";
import { registerConfigRoutes } from "../academy/routes/config-routes.js";
import { registerCourseRoutes } from "../academy/routes/course-routes.js";
import { registerCredentialRoutes } from "../academy/routes/credential-routes.js";
import { registerMinterRoutes } from "../academy/routes/minter-routes.js";
import { registerAchievementRoutes } from "../academy/routes/achievement-routes.js";
import { registerLeaderboardRoutes } from "../academy/routes/leaderboard-routes.js";
import { registerChallengeRoutes } from "../academy/routes/challenge-routes.js";
import { registerSeasonRoutes } from "../academy/routes/season-routes.js";
import { registerNotificationRoutes } from "../academy/routes/notification-routes.js";
import { registerChallengeConfigSyncRoutes } from "../academy/routes/challenge-config-sync.js";
import { registerChallengeCodeRoutes } from "../academy/routes/challenge-code.js";

const app = new Hono();

registerConfigRoutes(app);
registerCourseRoutes(app);
registerCredentialRoutes(app);
registerMinterRoutes(app);
registerAchievementRoutes(app);
registerLeaderboardRoutes(app);
registerChallengeRoutes(app);
registerChallengeConfigSyncRoutes(app);
registerChallengeCodeRoutes(app);
registerSeasonRoutes(app);
registerNotificationRoutes(app);

export default app;
