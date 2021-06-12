import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

require("dotenv/config");

async function bootstrap() {
  const express = require("express");
  const apps = express();
  console.log(__dirname);
  const app = await NestFactory.create(AppModule, { cors: true });
  let bodyParser = require("body-parser");
  apps.use(express.static("public"));
  app.use("/download", express.static("./"));
  app.use(bodyParser({ limit: "524288000" }));
  app.enableCors();
  await app.listen(process.env.PORT || 3001);
}

bootstrap();
