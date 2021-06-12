import { Injectable } from "@nestjs/common";
import { DropperService } from "../../dropper/dropper.service";
import { UserService } from "../../user/user.service";

@Injectable()
export class EventHandlerService {
  constructor(
    private readonly dropperService: DropperService,
    private readonly UserService: UserService
  ) {}

  async eventHandle(_event) {
    try {
      const { event, returnValues, transactionHash, blockNumber } = _event;
      switch (event) {
        case "DropDataAdded":
          await this.UserService.addUser(returnValues, transactionHash);
          break;
        case "DropClaimed":
          await this.UserService.claimTokens(returnValues, transactionHash);
          break;
        case "DropWithdrawn":
          await this.dropperService.withDrawDrop(returnValues);
          break;
        case "DropPaused":
          await this.dropperService.pauseDrop(returnValues, blockNumber);
          break;
        case "DropUnpaused":
          await this.dropperService.unPauseDrop(returnValues, blockNumber);
          break;
        default:
      }
    } catch (error) {
      console.log("check error now", error);
      throw error;
    }
  }
}
