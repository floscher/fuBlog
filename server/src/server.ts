import cors from "cors";
import express, { Application } from "express";
import { corsOptions } from "./config/cors-config.js";
import { AppDataSource } from "./data-source.js";
import adminRoutes from "./routes/admin.js";
import attRoutes from "./routes/attachments.js";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import { initDatabase } from "./service/testdata-generator.js";
import { AppSettings, ClientSettings, DatabaseSettings, ServerSettings } from "./settings.js";

const app: Application = express();

await AppDataSource.initialize();
await initDatabase();

app.use(cors(corsOptions));

app.use(express.json());

// Check the authentication status
//app.all(`${ServerSettings.API_PATH}/posts/*`, authenticate);

// The authentication controller routes
app.use(`${ServerSettings.API_PATH}/auth`, authRoutes);

app.use(`${ServerSettings.API_PATH}/admin`, adminRoutes);

app.use(`${ServerSettings.API_PATH}/posts`, postRoutes);
app.use(`${ServerSettings.API_PATH}/attachments`, attRoutes);

// in production serve the built vue-app from static public folder:
if (AppSettings.IS_PRODUCTION) {
  app.use(express.static("./public"));
}

app.listen(ServerSettings.PORT, () => {
  console.log(`fuBlog server running in ${AppSettings.RUN_MODE} mode on port: ${ServerSettings.PORT}`);
  if (!AppSettings.IS_PRODUCTION) {
    console.log(`Connected to Postgres DB at ${DatabaseSettings.HOST}:${DatabaseSettings.PORT}`);
    console.log(`Client: ${ClientSettings.BASE_URL}`);
  }
});
