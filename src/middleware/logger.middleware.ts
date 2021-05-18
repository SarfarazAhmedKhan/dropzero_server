import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";
const jwt = require("jsonwebtoken");
require("dotenv/config");

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor() {}
  async use(req: Request, res: Response, next: Function) {
    try {
      const header = req.headers["authorization"];
      if (header == undefined) throw "forbidden";
      if (typeof header !== "undefined") {
        const bearer = header.split(" ");
        const token = bearer[1];
        let decode = jwt.verify(token, process.env.SECRET);
        req.body.decodeToken = decode;
        req.body.token = token;
      }
      next();
    } catch (e) {
      console.log("error 123", e);
      res.status(403).send({
        responseCode: 403,
        responseMessage: "Forbidden",
        result: "Session Expired",
      });
    }
  }
}
