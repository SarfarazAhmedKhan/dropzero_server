import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LoggerMiddleware } from "./middleware/logger.middleware";
import { DropperService } from "./dropper/dropper.service";
import { UserService } from "./user/user.service";
import { EventHandlerService } from "./events/eventHandlers/dropzeroEventsHandler.service";
import { MerkleRootService } from "./merkleroot/merkleroot.service";
import { DropperModule } from "./dropper/dropper.module";
import { CsvRecordSchema } from "./dropper/csvrecord.model";
import { DropZeroBlockSchema } from "./dropper/dropZeroBlock.model";
import { DropperSchema } from "./dropper/dropper.model";
import { MulterModule } from "@nestjs/platform-express";
import { UserModule } from "./user/user.module";
import { UserSchema } from "./user/user.model";
import { EventService } from "./events/index.service";

@Module({
  imports: [
    MulterModule.register({
      dest: "./uploads",
    }),
    UserModule,
    DropperModule,
    MongooseModule.forRoot(process.env.CONNECTION_STRING, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    }),
    MongooseModule.forFeature([
      { name: "Dropper", schema: DropperSchema },
      { name: "User", schema: UserSchema },
      { name: "CsvRecord", schema: CsvRecordSchema },
      { name: "DropZeroBlock", schema: DropZeroBlockSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EventService,
    MerkleRootService,
    EventHandlerService,
    DropperService,
    UserService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(
        { path: "dropper/get_drops", method: RequestMethod.GET },
        { path: "dropper/get_csv/:id", method: RequestMethod.GET },
        { path: "dropper/pause_drop/:id", method: RequestMethod.GET },
        { path: "dropper/reject_drop/:id", method: RequestMethod.GET },
        { path: "dropper/withdraw_drop/:id", method: RequestMethod.GET },
        { path: "dropper/etherscan_link", method: RequestMethod.POST },
        { path: "user/claimed_tokens", method: RequestMethod.GET },
        { path: "user/withdraw_claimed_token/:id", method: RequestMethod.POST }
      );
  }
}
