import { Injectable } from "@nestjs/common";
import { MerkleRootService } from "./merkleroot/merkleroot.service";
import { DropperService } from "./dropper/dropper.service";
import { UserService } from "./user/user.service";
import { uploadFileToGit } from "./utils/fileuploading";
import { web3, CONTRACT_ADDRESS, DROP_CONTRACT_ABI } from "./utils/constants";

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
      // await uploadFileToGit(result._csv, dropName);
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
      const get = await uploadFileToGit();
      return;
    } catch (error) {
      console.log("check error now", error);
      throw error;
    }
  }
}
