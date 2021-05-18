import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CsvRecord } from "../dropper/csvrecord.model";
import { User } from "./user.model";
import { web3, CONTRACT_ADDRESS, DROP_CONTRACT_ABI } from "../utils/constants";
const cron = require("node-cron");

@Injectable()
export class UserService {
  constructor(
    @InjectModel("User") private readonly userModel: Model<User>,
    @InjectModel("CsvRecord") private readonly csvRecordModel: Model<CsvRecord>
  ) {}

  async getClaimedRecords(req) {
    try {
      console.log("reachje");
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
      console.log("wallet address", wallet_address.toLowerCase(), history);
      console.log("get", get);
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

  async withDrawClaimTokens(req) {
    try {
      let { id } = req.params;
      let { wallet_address } = req.body.decodeToken;
      id = id.toLowerCase();
      wallet_address = wallet_address.toLowerCase();
      let { claim } = req.query;
      let { merkleRoot } = req.body;
      let contract = new web3.eth.Contract(DROP_CONTRACT_ABI, CONTRACT_ADDRESS);
      if (claim == "single") {
        let verify = await this.userModel
          .findById(id)
          .where({ claimed: false });
        if (verify == null) throw "record not found";
        console.log("====>", verify, wallet_address);
        if (verify.address != wallet_address) throw "forbidden";
        await this.claimSingleTokens(id, contract);
        return "Success";
      }
      if (claim == "multiple") {
        if (id != wallet_address) throw "forbidden";
        await this.claimMultipleTokens(id, contract, merkleRoot);
        return "Success";
      } else {
        throw "no event catched";
      }
    } catch (e) {
      throw e;
    }
  }

  async claimSingleTokens(id, contract) {
    const claimCronJob = cron.schedule(
      `*/15 * * * * *`,
      async () => {
        try {
          contract.getPastEvents(
            "DropClaimed",
            {
              fromBlock: 8424727,
              toBlock: "latest",
            },
            async (err, events) => {
              try {
                if (events.length == 0) throw "No events found";
                let user = await this.userModel
                  .findById(id)
                  .where({ claimed: false })
                  .populate({
                    path: "csvId",
                    select: "merkleRoot",
                  });
                if (user == null) {
                  claimCronJob.stop();
                  throw "no user found";
                }
                console.log("check user now", user);
                let check = events.filter((item) => {
                  let { merkleRoot } = item.returnValues;
                  if (merkleRoot == user.csvId.merkleRoot) return merkleRoot;
                });
                if (check.length != 0) {
                  claimCronJob.stop();
                  console.log(
                    "hey hey claims",
                    check[0].returnValues.merkleRoot
                  );
                  let data = await this.csvRecordModel.findOne({
                    merkleRoot: check[0].returnValues.merkleRoot,
                  });
                  console.log("data ===>", data);
                  let file = JSON.parse(data.csv);
                  file = file.map(
                    ({ address, amount, proof, index, status }) => ({
                      index,
                      address,
                      amount,
                      proof,
                      status:
                        address == user.address && index == user.index
                          ? "Claimed"
                          : status,
                    })
                  );
                  let csv = await this.csvRecordModel.findByIdAndUpdate(
                    data._id,
                    {
                      $set: {
                        csv: JSON.stringify(file),
                      },
                    }
                  );
                  console.log("data ===>", csv);
                  await this.userModel.findByIdAndUpdate(id, {
                    $set: {
                      claimed: true,
                      claimedDate: new Date(),
                    },
                  });
                }
              } catch (error) {
                console.log(error);
              }
            }
          );
        } catch (error) {
          console.log("check error", error);
        }
      },
      {
        scheduled: false,
      }
    );
    claimCronJob.start();
    return;
  }

  async claimMultipleTokens(id, contract, merkleRoot) {
    console.log("cron");
    const claimCronJob = cron.schedule(
      `*/5 * * * * *`,
      async () => {
        try {
          contract.getPastEvents(
            "DropClaimed",
            {
              fromBlock: 8424727,
              toBlock: "latest",
            },
            async (err, events) => {
              try {
                console.log("started cron job now");
                let user = await this.userModel
                  .find({ address: id })
                  .where({ claimed: false })
                  .populate({
                    path: "csvId",
                    select: "merkleRoot",
                  });
                if (user == null) throw "no record found";
                let array = [];
                for (var key in user) {
                  for (var key1 in merkleRoot) {
                    if (user[key].csvId.merkleRoot == merkleRoot[key1]) {
                      array.push(user[key]);
                    }
                  }
                }
                if (array.length == 0) {
                  claimCronJob.stop();
                  return;
                }
                for (var key in array) {
                  let check = events.filter((item) => {
                    let { merkleRoot } = item.returnValues;
                    if (merkleRoot == array[key].csvId.merkleRoot) return true;
                  });
                  if (check.length != 0) {
                    console.log("check 999", check);
                    let data = await this.csvRecordModel.findOne({
                      merkleRoot: array[key].csvId.merkleRoot,
                    });
                    let file = JSON.parse(data.csv);
                    file = file.map(
                      ({ address, amount, proof, index, status }) => ({
                        index,
                        address,
                        amount,
                        proof,
                        status:
                          address == array[key].address &&
                          index == array[key].index
                            ? "Claimed"
                            : status,
                      })
                    );
                    await this.csvRecordModel.findByIdAndUpdate(data._id, {
                      $set: {
                        csv: JSON.stringify(file),
                      },
                    });
                    console.log("check 9990909", array[key]._id);
                    await this.userModel.findByIdAndUpdate(array[key]._id, {
                      $set: {
                        claimed: true,
                        claimedDate: new Date(),
                      },
                    });
                  }
                }
              } catch (error) {
                console.log(error);
              }
            }
          );
        } catch (error) {
          console.log("check error", error);
        }
      },
      {
        scheduled: false,
      }
    );
    claimCronJob.start();
    return;
  }

  async addUser(
    tokenAddress,
    startDate,
    endDate,
    dropName,
    file,
    csvId,
    merkleRoot
  ) {
    try {
      const cronJob = cron.schedule(
        `*/10 * * * * *`,
        async () => {
          try {
            let contract = new web3.eth.Contract(
              DROP_CONTRACT_ABI,
              CONTRACT_ADDRESS
            );
            contract.getPastEvents(
              "DropDataAdded",
              {
                fromBlock: 8424727,
                toBlock: "latest",
              },
              async (err, events) => {
                if (!err) {
                  console.log("events", events.length);
                  if (events.length > 0) {
                    events.filter(async (item) => {
                      if (item.returnValues.merkleRoot == merkleRoot) {
                        console.log("conditioned matched yahoo");
                        cronJob.stop();
                        await this.csvRecordModel.findByIdAndUpdate(csvId, {
                          $set: {
                            status: "completed",
                          },
                        });
                        for (var key in file) {
                          file[key].claimed = false;
                          file[key].index = key;
                          file[key].startDate = startDate;
                          file[key].endDate = endDate;
                          file[key].dropName = dropName;
                          file[key].tokenAddress = tokenAddress.toLowerCase();
                          file[key].csvId = csvId;
                          await this.userModel.create(file[key]);
                        }
                      }
                    });
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
      return;
    } catch (e) {
      console.log("check error", e);
      throw e;
    }
  }
}
