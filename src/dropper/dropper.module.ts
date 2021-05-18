import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DropperController } from "./dropper.controller";
import { DropperService } from "./dropper.service";
import { DropperSchema } from "./dropper.model";
import { UserSchema } from "../user/user.model";
import { CsvRecordSchema } from "./csvrecord.model";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "Dropper", schema: DropperSchema },
      { name: "User", schema: UserSchema },
      { name: "CsvRecord", schema: CsvRecordSchema },
    ]),
  ],
  controllers: [DropperController],
  providers: [DropperService],
})
export class DropperModule {}
