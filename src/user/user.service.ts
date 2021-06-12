import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CsvRecord } from "../dropper/csvrecord.model";
import { User } from "./user.model";
import { uploadFileToGit } from "../utils/fileuploading";
const cron = require("node-cron");

@Injectable()
export class UserService {
  constructor(
    @InjectModel("User") private readonly userModel: Model<User>,
    @InjectModel("CsvRecord") private readonly csvRecordModel: Model<CsvRecord>
  ) {}

  async getClaimedRecords(req) {
    try {
      let { wallet_address } = req.body.decodeToken;
      let { history } = req.query;
      let get = [];
      if (history == "true") {
        get = await this.userModel
          .find({ address: wallet_address.toLowerCase(), claimed: history })
          .populate({
            path: "csvId",
            select: "pauseDrop merkleRoot",
          });
      } else {
        get = await this.userModel
          .find({ address: wallet_address.toLowerCase(), claimed: history })
          .populate({
            path: "csvId",
            select: "pauseDrop merkleRoot",
            match: { pauseDrop: false },
          });
      }
      if (get.length == 0) throw "no record found";
      let filter = get.filter((data) => {
        if (data.csvId != null) return data;
      });
      if (history == "true") {
        return filter;
      } else {
        if (filter.length == 0) throw "no claimed found";
        var arr = [];
        for (var key in filter) {
          let keyId = filter[key].tokenAddress;
          if (!arr[keyId]) {
            arr[keyId] = [];
          }
          delete filter[key].tokenAddress;
          arr[keyId].push(filter[key]);
        }
        let myArray = [];
        for (var keyId in arr) {
          myArray.push({ address: keyId, data: arr[keyId] });
        }
        return myArray;
      }
    } catch (e) {
      console.log("check error", e);
      throw e;
    }
  }

  async claimTokens(event, txnHash) {
    try {
      let { index, account, merkleRoot } = event;
      let user = await this.userModel
        .find({
          address: account.toLowerCase(),
          claimed: false,
          index: index,
        })
        .populate({
          path: "csvId",
          match: { merkleRoot: merkleRoot },
          select: "merkleRoot",
        });
      let filter = user.filter((item) => item.csvId != null);
      user = filter[0];
      if (user == null) return "no record found";
      let data = await this.csvRecordModel.findOne({
        merkleRoot: merkleRoot,
      });
      let file = JSON.parse(data.csv);
      file = file.map(({ address, amount, proof, index, status }) => ({
        index,
        address,
        amount,
        proof,
        status:
          address == user.address.toLowerCase() && index == user.index
            ? "Claimed"
            : status,
      }));
      await this.csvRecordModel.findByIdAndUpdate(data._id, {
        $set: {
          csv: JSON.stringify(file),
        },
      });
      await this.userModel.findByIdAndUpdate(user._id, {
        $set: {
          claimed: true,
          claimedDate: new Date(),
          txnHash: `${process.env.TRANSACTION_URL}${txnHash}`,
        },
      });
      return "success";
    } catch (error) {
      console.log("check error", error);
    }
    return;
  }

  async addUser(event, txnHash) {
    try {
      let { tokenAddress, merkleRoot } = event;
      let check = await this.csvRecordModel.findOne({
        merkleRoot: merkleRoot,
        tokenAddress: tokenAddress.toLowerCase(),
        status: "pending",
      });
      if (check == null) return;
      let record = await this.csvRecordModel.findByIdAndUpdate(check._id, {
        $set: {
          status: "completed",
          txnHash: `${process.env.TRANSACTION_URL}${txnHash}`,
        },
      });
      if (record == null) return;
      let { gitfile, dropName, csv } = record;
      gitfile = JSON.parse(gitfile);
      let file = JSON.parse(csv);
      await uploadFileToGit(gitfile, dropName);
      console.log("check file", file);
      for (var key in file) {
        file[key].claimed = false;
        file[key].index = key;
        file[key].startDate = record.startDate;
        file[key].endDate = record.endDate;
        file[key].dropName = dropName;
        file[key].tokenAddress = tokenAddress.toLowerCase();
        file[key].csvId = record._id;
      }
      await this.userModel.insertMany(file);
      await this.csvRecordModel.findByIdAndUpdate(check._id, {
        $set: {
          gitfile: "",
        },
      });
      return;
    } catch (e) {
      console.log("check error", e);
      throw e;
    }
  }
}
