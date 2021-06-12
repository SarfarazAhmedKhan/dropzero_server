import { Controller, Get, Post, Req, Res, Put } from "@nestjs/common";
import { UserService } from "./user.service";
import { Request, Response } from "express";
import { constants } from "../utils/constants";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("/claimed_tokens")
  async getClaimedRecords(@Req() req: Request, @Res() res: Response) {
    try {
      const claimedToken = await this.userService.getClaimedRecords(req);
      res.status(200).send({
        responseCode: 201,
        responseMessage: constants.SUCCESS,
        result: claimedToken,
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
