import {
  Controller,
  Get,
  Req,
  Res,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { AppService } from "./app.service";
import { Request, Response } from "express";
import { diskStorage } from "multer";
import { FileInterceptor } from "@nestjs/platform-express";
import { editFileName, imageFileFilter } from "./utils/fileuploading";

@Controller("/upload_csv")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post("/merkle_root")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    })
  )
  async merkleRoot(
    @UploadedFile() file,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      req.body.file = file.filename;
      const result: any = await this.appService.merkleRoot(req);
      let payload = {
        amount: result.amount,
        csv_length: result.csv_length,
        merkle_root: result._merkleRoot,
        dropper_id: result.dropper_id,
        date: result.date,
      };
      res.status(200).send({
        responseCode: 200,
        responseMessage: "success",
        result: payload,
      });
    } catch (error) {
      console.log("error ", error);
      res.status(400).send({
        responseCode: 400,
        responseMessage: error,
        result: error,
      });
    }
  }

  @Post("/auth")
  async generateJwt(@Req() req: Request, @Res() res: Response) {
    try {
      const result: any = await this.appService.generateJwt(req);
      res.status(200).send({
        responseCode: 200,
        responseMessage: "success",
        result: result,
      });
    } catch (error) {
      console.log("error ", error);
      res.status(400).send({
        responseCode: 400,
        responseMessage: error,
        result: error,
      });
    }
  }

  @Post("/test")
  async test(@Req() req: Request, @Res() res: Response) {
    try {
      const result: any = await this.appService.test(req);
      res.status(200).send({
        responseCode: 200,
        responseMessage: "success",
        result: result,
      });
    } catch (error) {
      console.log("error ", error);
      res.status(400).send({
        responseCode: 400,
        responseMessage: error,
        result: error,
      });
    }
  }
}
