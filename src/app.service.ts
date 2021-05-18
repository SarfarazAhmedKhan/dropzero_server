import { Injectable } from "@nestjs/common";
import { MerkleRootService } from "./merkleroot/merkleroot.service";
import { DropperService } from "./dropper/dropper.service";
import { UserService } from "./user/user.service";
import { web3, CONTRACT_ADDRESS, DROP_CONTRACT_ABI } from "./utils/constants";
const cron = require("node-cron");
const moment = require("moment");

@Injectable()
export class AppService {
  constructor(
    private readonly merkleRootService: MerkleRootService,
    private readonly dropperService: DropperService,
    private readonly userService: UserService
  ) {}

  async merkleRoot(req) {
    try {
      let {
        file,
        walletAddress,
        tokenAddress,
        startDate,
        endDate,
        dropName,
        decimal,
        totalAmount,
      } = req.body;
      let csvfile = await this.merkleRootService.generateClaimsCsv(
        file,
        decimal
      );
      const refactorFile = await this.merkleRootService.removeDuplicateAddress(
        csvfile,
        decimal
      );
      let result = await this.merkleRootService.generateMerkleRoot(
        refactorFile,
        decimal
      );
      const response = await this.dropperService.addDropper(
        walletAddress,
        tokenAddress,
        startDate,
        endDate,
        dropName,
        result.jsonFile,
        totalAmount,
        result._merkleRoot
      );
      await this.userService.addUser(
        tokenAddress,
        startDate,
        endDate,
        dropName,
        result._csv,
        response.csvId,
        result._merkleRoot
      );
      let data = { ...result, dropper_id: response.dropperId };
      return data;
    } catch (e) {
      console.log("view error", e);
      throw e;
    }
  }

  async generateJwt(req) {
    try {
      const token = await this.dropperService.genToken(req);
      return token;
    } catch (error) {
      console.log("check error now", error);
      throw error;
    }
  }

  async test(req) {
    try {
      let contract = new web3.eth.Contract(DROP_CONTRACT_ABI, CONTRACT_ADDRESS);
      contract.getPastEvents(
        // "DropWithdrawn",
        {
          fromBlock: 8424727,
          toBlock: "latest",
        },
        async (err, events) => {
          if (!err) {
            if (events.length > 0) {
              console.log("check all events", events);
              // let check = events.filter((item) => {
              //   return item.returnValues.merkleRoot == data.record.merkleRoot;
              // });
              // if (check.length != 0) {
              //   withDrawDrop.stop();
              //   await this.csvRecordModel.findByIdAndUpdate(csv_id, {
              //     $set: {
              //       withDraw: true,
              //     },
              //   });
              //   await this.userModel.deleteMany({
              //     csvId: csv_id,
              //     claimed: false,
              //   });
              //   this.deleteUsersCronJob(csv_id);
              // }
            } else {
              console.log("No events found");
            }
          } else {
            console.log("In else err", err);
          }
        }
      );
      return;
    } catch (error) {
      console.log("check error now", error);
      throw error;
    }
  }
}
