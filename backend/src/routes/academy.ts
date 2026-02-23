import { Hono } from "hono";
import { registerConfigRoutes } from "../academy/routes/config-routes.js";
import { registerCourseRoutes } from "../academy/routes/course-routes.js";
import { registerCredentialRoutes } from "../academy/routes/credential-routes.js";
import { registerMinterRoutes } from "../academy/routes/minter-routes.js";
import { registerAchievementRoutes } from "../academy/routes/achievement-routes.js";

const app = new Hono();

registerConfigRoutes(app);
registerCourseRoutes(app);
registerCredentialRoutes(app);
registerMinterRoutes(app);
registerAchievementRoutes(app);

export default app;
