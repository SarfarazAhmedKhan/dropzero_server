import { Controller, Get, Post, Req, Res, Put } from "@nestjs/common";
import { DropperService } from "./dropper.service";
import { Request, Response } from "express";
import { constants } from "../utils/constants";

@Controller("dropper")
export class DropperController {
  constructor(private readonly dropperService: DropperService) {}

  @Get("/get_drops")
  async getDrops(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.dropperService.getDrops(req);
      res.status(200).send({
        responseCode: 201,
        responseMessage: constants.SUCCESS,
        result: result,
      });
    } catch (error) {
      res.status(400).send({
        responseCode: 400,
        responseMessage: constants.FAILED,
        result: error,
      });
    }
  }

  @Get("/get_csv/:id")
  async getCsv(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.dropperService.getCsv(req);
      res.status(200).send({
        responseCode: 201,
        responseMessage: constants.SUCCESS,
        result: result,
      });
    } catch (error) {
      res.status(400).send({
        responseCode: 400,
        responseMessage: constants.FAILED,
        result: error,
      });
    }
  }

  @Get("/reject_drop/:id")
  async rejectDrop(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.dropperService.rejectDrop(req);
      res.status(200).send({
        responseCode: 201,
        responseMessage: constants.SUCCESS,
        result: result,
      });
    } catch (error) {
      res.status(400).send({
        responseCode: 400,
        responseMessage: constants.FAILED,
        result: error,
      });
    }
  }

  @Post("/check_drop")
  async checkDrop(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.dropperService.checkDrop(req);
      res.status(200).send({
        responseCode: 201,
        responseMessage: constants.SUCCESS,
        result: result,
      });
    } catch (error) {
      res.status(400).send({
        responseCode: 400,
        responseMessage: constants.FAILED,
        result: error,
      });
    }
  }
}
