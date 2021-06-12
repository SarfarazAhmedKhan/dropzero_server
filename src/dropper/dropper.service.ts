import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Dropper } from "./dropper.model";
import { CsvRecord } from "./csvrecord.model";
import { convertJsonToCsv } from "../utils/fileuploading";
import { DropZeroBlock } from "../dropper/dropZeroBlock.model";
import { User } from "../user/user.model";
const moment = require("moment");
const fs = require("fs");
const cron = require("node-cron");
const jwt = require("jsonwebtoken");
const schedule = require("node-schedule");

@Injectable()
export class DropperService {
  constructor(
    @InjectModel("Dropper") private readonly dropperModel: Model<Dropper>,
    @InjectModel("CsvRecord") private readonly csvRecordModel: Model<CsvRecord>,
    @InjectModel("User") private readonly userModel: Model<User>,
    @InjectModel("DropZeroBlock")
    private readonly dropZeroBlockModel: Model<DropZeroBlock>
  ) {}

  async addDropper(
    walletAddress,
    tokenAddress,
    startDate,
    endDate,
    dropName,
    file,
    amount,
    merkleroot,
    gitfile
  ) {
    try {
      let payload = {
        walletAddress: walletAddress.toLowerCase(),
      };
      let dropper = await this.dropperModel.findOne({
        walletAddress: walletAddress.toLowerCase(),
      });
      if (dropper == null) {
        dropper = await this.dropperModel.create(payload);
      }
      console.log("view git file", gitfile);
      let csvPayload = {
        gitfile: gitfile,
        status: "pending",
        dropperAddress: dropper._id,
        tokenAddress: tokenAddress.toLowerCase(),
        startDate,
        endDate,
        dropName: dropName,
        uniqueName: dropName.toLowerCase(),
        csv: file,
        totalAmount: amount,
        merkleRoot: merkleroot,
        pauseDrop: false,
        withDraw: false,
        expired: false,
      };
      let addCsv = await this.csvRecordModel.create(csvPayload);
      await this.dropperModel.findByIdAndUpdate(dropper._id, {
        $push: {
          csv: { record: addCsv._id },
        },
      });
      if (endDate != undefined) {
        await this.expireDropCronJob(addCsv._id, endDate);
      }
      return {
        csvId: addCsv._id,
        dropperId: dropper._id,
      };
    } catch (e) {
      console.log("check error", e);
      throw e;
    }
  }

  expireDropCronJob = async (id, endDate) => {
    var check = moment(endDate, "YYYY/MM/DD");
    var time = moment(endDate);
    var hours = time.format("HH");
    var minutes = time.format("mm");
    var month = check.format("MMMM");
    var monthNumber = Number(check.format("MM")) - 1;
    var year = check.format("YYYY");
    var day = check.format("D");
    let dateCheck = new Date();
    let yearCheck = dateCheck.getFullYear();
    console.log("yeear check", yearCheck, yearCheck == year);
    console.log(
      "date now",
      check,
      month,
      day,
      hours,
      minutes,
      year,
      monthNumber
    );
    const date = new Date(year, monthNumber, day, hours, minutes, 30);
    console.log("date now", date);
    const job = schedule.scheduleJob(date, async () => {
      try {
        console.log("expire drop paused started");
        let drop = await this.csvRecordModel.findById(id);
        if (drop == null) {
          return;
        }
        await this.csvRecordModel.findByIdAndUpdate(id, {
          $set: {
            expired: true,
          },
        });
        await this.userModel.deleteMany({
          csvId: id,
          claimed: false,
        });
        this.deleteUsersCronJob(id);
      } catch (error) {
        console.log("check error", error);
        console.log("task stoped onow1221====>");
      }
    });
    return "success";
  };

  withDrawDrop = async ({ merkleRoot }) => {
    let csvRecord = await this.csvRecordModel.findOne({
      merkleRoot: merkleRoot,
      withDraw: false,
    });
    if (csvRecord == null) return;
    await this.csvRecordModel.findByIdAndUpdate(csvRecord._id, {
      $set: {
        withDraw: true,
      },
    });
    await this.userModel.deleteMany({
      csvId: csvRecord._id,
      claimed: false,
    });
    this.deleteUsersCronJob(csvRecord._id);
    return "success";
  };

  async deleteUsersCronJob(csvId) {
    let month = moment(new Date())
      .add(1, "month")
      .format("MMM");
    console.log("view ", month);
    const deleteUsers = cron.schedule(
      `*/5 * * * */${month} *`,
      async () => {
        try {
          deleteUsers.stop();
          console.log("its cron now");
          await this.userModel.deleteMany({
            csvId: csvId,
          });
        } catch (error) {
          deleteUsers.stop();
          deleteUsers.destroy();
          console.log("check error", error);
          console.log("task stoped onow1221====>");
        }
      },
      {
        scheduled: false,
      }
    );
    deleteUsers.start();
  }

  async getDrops(req) {
    try {
      let { wallet_address } = req.body.decodeToken;
      wallet_address = wallet_address.toLowerCase();
      const get = await this.dropperModel
        .findOne({ walletAddress: wallet_address })
        .populate({
          path: "csv.record",
          select: "-csv",
          match: { status: "completed" },
        });
      if (get == null) throw "account doesnot exist";
      let file = [];
      for (var key in get.csv) {
        if (get.csv[key].record != null) {
          file.push(get.csv[key]);
        }
      }
      let array = [];
      for (var key in file) {
        let id = file[key].record._id;
        let users = await this.userModel
          .find({ csvId: id, claimed: true })
          .select("amount");
        let totalAmount = 0;
        for (var key1 in users) {
          totalAmount = Number(totalAmount) + Number(users[key1].amount);
        }
        let data = file[key].record;
        data = { ...file[key].record._doc, totalClaimed: users };
        data.totalClaimed = totalAmount;
        array.push(data);
      }
      return array;
    } catch (e) {
      console.log("check error", e);
      throw e;
    }
  }

  async getCsv(req) {
    try {
      let { wallet_address } = req.body.decodeToken;
      let { id } = req.params;
      let { token_name } = req.query;
      const get = await this.csvRecordModel
        .findById(id)
        .populate("dropperAddress", "walletAddress token");
      console.log("view now", get);
      if (get == null) throw "record not found";
      if (
        wallet_address.toLowerCase() !=
        get.dropperAddress.walletAddress.toLowerCase()
      )
        throw "forbidden";
      var x = new Date().toString().split(" ");
      let date = `${x[2] + " " + x[1] + " " + x[3]}`;
      let file = await convertJsonToCsv(get.csv, token_name, date, id);
      const cronJob = cron.schedule(
        `* */10 * * * *`,
        async () => {
          try {
            console.log("job started");
            fs.unlinkSync(file);
            cronJob.stop();
          } catch (error) {
            console.log("check error", error);
            cronJob.stop();
            console.log("task stoped onow1221====>");
            cronJob.destroy();
          }
        },
        {
          scheduled: false,
        }
      );
      cronJob.start();
      return `${process.env.Server_Url}/download/${file}`;
    } catch (e) {
      console.log(e == "record not found", e == "record not found");
      if (e == "record not found" || e == "forbidden") {
        throw e;
      } else {
        throw "your time exceed for downloading this csv request again to download it";
      }
    }
  }

  async rejectDrop(req) {
    try {
      let { wallet_address } = req.body.decodeToken;
      let { id } = req.params;
      let { merkleRoot } = req.query;
      let csv = await this.csvRecordModel
        .find({ merkleRoot: merkleRoot })
        .populate("dropperAddress", "walletAddress");
      if (
        wallet_address.toLowerCase() !=
        csv.dropperAddress.walletAddress.toLowerCase()
      )
        throw "forbidden";
      await this.dropperModel.findByIdAndUpdate(id, {
        $pull: {
          csv: { record: csv._id },
        },
      });
      await this.csvRecordModel.findByIdAndDelete(csv._id);
    } catch (e) {
      console.log("check error", e);
      throw e;
    }
  }

  pauseDrop = async ({ merkleRoot }, blockNumber) => {
    try {
      console.log("drop is paused", merkleRoot, blockNumber);
      let latestBlock = await this.dropZeroBlockModel.findOne();
      if (latestBlock.pausedDropBlockNumber >= blockNumber) return;
      let drop = await this.csvRecordModel
        .findOne({ merkleRoot: merkleRoot })
        .where({ pauseDrop: false });
      if (drop == null) {
        return;
      }
      console.log("check drop is paused", drop);
      await this.csvRecordModel.findByIdAndUpdate(drop._id, {
        $set: {
          pauseDrop: true,
        },
      });
      await this.dropZeroBlockModel.findOneAndUpdate({
        $set: {
          pausedDropBlockNumber: blockNumber,
        },
      });
    } catch (error) {
      console.log("check error", error);
    }
    return "success";
  };

  unPauseDrop = async ({ merkleRoot }, blockNumber) => {
    try {
      console.log("drop is unpaused", merkleRoot, blockNumber);
      let latestBlock = await this.dropZeroBlockModel.findOne();
      if (latestBlock.unPausedDropBlockNumber >= blockNumber) return;
      let drop = await this.csvRecordModel
        .findOne({ merkleRoot: merkleRoot })
        .where({ pauseDrop: true });
      if (drop == null) {
        return;
      }
      console.log("check drop is unpaused", drop);
      await this.csvRecordModel.findByIdAndUpdate(drop._id, {
        $set: {
          pauseDrop: false,
        },
      });
      await this.dropZeroBlockModel.findOneAndUpdate({
        $set: {
          unPausedDropBlockNumber: blockNumber,
        },
      });
    } catch (error) {
      console.log("check error", error);
    }
    return "success";
  };

  async checkDrop(req) {
    try {
      let { dropName, tokenAddress } = req.body;
      dropName = dropName.toLowerCase();
      tokenAddress = tokenAddress.toLowerCase();
      const get = await this.csvRecordModel.findOne({
        $and: [{ tokenAddress: tokenAddress, uniqueName: dropName }],
      });
      if (get != null) throw "DropName already exist";
      return "Success";
    } catch (error) {
      console.log("lets check error", error);
      throw error;
    }
  }

  async genToken(req) {
    try {
      let { wallet_address, time_stamp } = req.body;
      const genToken = jwt.sign(
        { wallet_address: wallet_address, time_stamp: time_stamp },
        process.env.SECRET,
        {
          expiresIn: "1d",
        }
      );
      await this.dropperModel.findOneAndUpdate({
        token: genToken,
      });
      return genToken;
    } catch (error) {
      console.log("lets check error", error);
      throw error;
    }
  }
}
