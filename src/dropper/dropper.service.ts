import { Injectable, Req } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Dropper } from "./dropper.model";
import { CsvRecord } from "./csvrecord.model";
import { convertJsonToCsv } from "../utils/fileuploading";
import { web3, CONTRACT_ADDRESS, DROP_CONTRACT_ABI } from "../utils/constants";
import { User } from "../user/user.model";
const moment = require("moment");
const fs = require("fs");
const cron = require("node-cron");
const jwt = require("jsonwebtoken");

@Injectable()
export class DropperService {
  constructor(
    @InjectModel("Dropper") private readonly dropperModel: Model<Dropper>,
    @InjectModel("CsvRecord") private readonly csvRecordModel: Model<CsvRecord>,
    @InjectModel("User") private readonly userModel: Model<User>
  ) {}

  async addDropper(
    walletAddress,
    tokenAddress,
    startDate,
    endDate,
    dropName,
    file,
    amount,
    merkleroot
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
      let csvPayload = {
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
    var day = check.format("D");
    var days = check.format("dd");
    console.log("hey yo", check, month, day, hours, minutes);
    const expireDrop = cron.schedule(
      `*/5 */${minutes} */${hours} */${day} */${month} */${days}`,
      async () => {
        try {
          console.log("expire drop paused started");
          let drop = await this.csvRecordModel.findById(id);
          if (drop == null) {
            expireDrop.stop();
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
          expireDrop.stop();
        } catch (error) {
          expireDrop.stop();
          expireDrop.destroy();
          console.log("check error", error);
          console.log("task stoped onow1221====>");
        }
      },
      {
        scheduled: false,
      }
    );
    expireDrop.start();
    return "success";
  };

  async withDrawDrop(req) {
    try {
      let { wallet_address } = req.body.decodeToken;
      let { id } = req.params;
      let { csv_id } = req.query;
      let contract = new web3.eth.Contract(DROP_CONTRACT_ABI, CONTRACT_ADDRESS);
      let dropper = await this.dropperModel.findById(id).populate({
        path: "csv.record",
        select: "_id merkleRoot",
        match: { _id: csv_id },
      });
      if (dropper == null) throw "no record found";
      console.log("check dropper address", dropper, wallet_address);
      if (dropper.walletAddress.toLowerCase() != wallet_address.toLowerCase())
        throw "forbidden";
      let data = dropper.csv.filter((data) => {
        if (data.record != null) return data;
      });
      if (data.length == 0) throw "no record found";
      await this.withDrawDropCronJob(id, csv_id, contract, data[0]);
      return "Success";
    } catch (e) {
      console.log("check error", e);
      throw e;
    }
  }

  withDrawDropCronJob = async (id, csv_id, contract, data) => {
    const withDrawDrop = cron.schedule(
      `*/5 * * * * *`,
      async () => {
        try {
          console.log("event drop paused started");
          contract.getPastEvents(
            "DropWithdrawn",
            {
              fromBlock: 8424727,
              toBlock: "latest",
            },
            async (err, events) => {
              if (!err) {
                if (events.length > 0) {
                  let check = events.filter((item) => {
                    return (
                      item.returnValues.merkleRoot == data.record.merkleRoot
                    );
                  });
                  if (check.length != 0) {
                    withDrawDrop.stop();
                    await this.csvRecordModel.findByIdAndUpdate(csv_id, {
                      $set: {
                        withDraw: true,
                      },
                    });
                    await this.userModel.deleteMany({
                      csvId: csv_id,
                      claimed: false,
                    });
                    this.deleteUsersCronJob(csv_id);
                  }
                } else {
                  console.log("No events found");
                }
              } else {
                console.log("In else err", err);
              }
            }
          );
        } catch (error) {
          withDrawDrop.stop();
          withDrawDrop.destroy();
          console.log("check error", error);
          console.log("task stoped onow1221====>");
        }
      },
      {
        scheduled: false,
      }
    );
    withDrawDrop.start();
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
      console.log("check req.", req.body);
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
        console.log("view finalized data now", data);
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
      console.log("check wallet address", wallet_address);
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

  async pauseDrop(req) {
    try {
      let { wallet_address } = req.body.decodeToken;
      let { id } = req.params;
      const get = await this.csvRecordModel
        .findById(id)
        .populate("dropperAddress", "walletAddress");
      if (get == null) throw "record not found";
      if (
        wallet_address.toLowerCase() !=
        get.dropperAddress.walletAddress.toLowerCase()
      )
        throw "forbidden";
      let { pause } = req.query;
      let contract = new web3.eth.Contract(DROP_CONTRACT_ABI, CONTRACT_ADDRESS);
      if (pause == "true") {
        console.log("pause true matched");
        await this.pauseDropCronJob(id, contract);
        return "Success";
      }
      if (pause == "false") {
        await this.unPauseDropCronJob(id, contract);
        return "Success";
      } else {
        throw "no event catched";
      }
    } catch (e) {
      console.log("check error", e);
      throw e;
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

  pauseDropCronJob = async (id, contract) => {
    console.log("starting....");
    const pauseDrop = cron.schedule(
      `*/5 * * * * *`,
      async () => {
        try {
          console.log("event drop paused started");
          contract.getPastEvents(
            "DropPaused",
            {
              fromBlock: 8424727,
              toBlock: "latest",
            },
            async (err, events) => {
              if (!err) {
                if (events.length > 0) {
                  let drop = await this.csvRecordModel
                    .findById(id)
                    .where({ pauseDrop: false });
                  if (drop == null) {
                    pauseDrop.stop();
                    return;
                  }
                  let check = events.filter((item) => {
                    return drop.merkleRoot == item.returnValues.merkleRoot;
                  });
                  if (check.length != 0) {
                    await this.csvRecordModel.findByIdAndUpdate(id, {
                      $set: {
                        pauseDrop: true,
                      },
                    });
                    pauseDrop.stop();
                  }
                } else {
                  console.log("No events found");
                }
              } else {
                console.log("In else err", err);
              }
            }
          );
        } catch (error) {
          pauseDrop.stop();
          pauseDrop.destroy();
          console.log("check error", error);
          console.log("task stoped onow1221====>");
        }
      },
      {
        scheduled: false,
      }
    );
    pauseDrop.start();
    return "success";
  };

  unPauseDropCronJob = async (id, contract) => {
    const pauseDrop = cron.schedule(
      `*/5 * * * * *`,
      async () => {
        try {
          contract.getPastEvents(
            "DropUnpaused",
            {
              fromBlock: 8424727,
              toBlock: "latest",
            },
            async (err, events) => {
              if (!err) {
                if (events.length > 0) {
                  let drop = await this.csvRecordModel
                    .findById(id)
                    .where({ pauseDrop: true });
                  if (drop == null) {
                    pauseDrop.stop();
                    return;
                  }
                  let check = events.filter((item) => {
                    return drop.merkleRoot == item.returnValues.merkleRoot;
                  });
                  if (check.length != 0) {
                    await this.csvRecordModel.findByIdAndUpdate(id, {
                      $set: {
                        pauseDrop: false,
                      },
                    });
                    pauseDrop.stop();
                  }
                } else {
                  console.log("No events found");
                }
              } else {
                console.log("In else err", err);
              }
            }
          );
        } catch (error) {
          console.log("check error", error);
          console.log("task stoped onow1221====>");
          pauseDrop.destroy();
          pauseDrop.stop();
        }
      },
      {
        scheduled: false,
      }
    );
    pauseDrop.start();
    return "success";
  };

  async test() {
    try {
      // const get = await this.csvRecordModel
      //   .find({ pauseDrop: false })
      //   .select("totalAmount")
      //   .count({ $sum: 1 });
      // return get;
    } catch (error) {
      console.log("lets check error", error);
    }
  }

  async addEtherscanLink(req) {
    try {
      let { txn_hash, merkle_root } = req.body;
      const get = await this.csvRecordModel.findOneAndUpdate(
        { merkleRoot: merkle_root },
        {
          $set: {
            txnHash: `${process.env.TRANSACTION_URL}${txn_hash}`,
          },
        }
      );
      if (get == null) throw "Invalid record";
      return "Success";
    } catch (error) {
      console.log("lets check error", error);
      throw error;
    }
  }

  async checkDrop(req) {
    try {
      let { dropName, tokenAddress } = req.body;
      dropName = dropName.toLowerCase();
      tokenAddress = tokenAddress.toLowerCase();
      console.log("====>", dropName, tokenAddress);
      const get = await this.csvRecordModel.findOne({
        $and: [{ tokenAddress: tokenAddress, uniqueName: dropName }],
      });
      console.log("check get", get);
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
      console.log("hey check", genToken);
      return genToken;
    } catch (error) {
      console.log("lets check error", error);
      throw error;
    }
  }
}
