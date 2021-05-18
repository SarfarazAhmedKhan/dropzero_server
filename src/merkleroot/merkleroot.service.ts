import { Injectable } from "@nestjs/common";
import BalanceTree from "../utils/MerkleTree/balance-tree";
require("dotenv").config();
const csv = require("csvtojson");
const fs = require("fs");

@Injectable()
export class MerkleRootService {
  constructor() {}

  toFixed = (num, decimal) => {
    var re = new RegExp("^-?\\d+(?:.\\d{0," + decimal + "})?");
    return num.toString().match(re)[0];
  };

  generateClaimsCsv = async (file, decimal) => {
    try {
      let _csv = await csv().fromFile(`uploads/${file}`);
      const path = `uploads/${file}`;
      fs.unlinkSync(path);
      _csv = _csv.map(({ address, amount }) => ({
        address: address.toLowerCase(),
        amount: this.toFixed(amount, decimal),
      }));
      return _csv;
    } catch (error) {
      console.log("check error now", error);
      throw error;
    }
  };

  generateMerkleRoot = async (_csv, decimal) => {
    try {
      let date = new Date();
      _csv.push({
        address: "0x0000000000000000000000000000000000000000",
        amount: date.getTime().toString(),
      });
      const _balanceTree = new BalanceTree(_csv, decimal);
      const _merkleRoot = _balanceTree.getHexRoot();
      _csv.pop();
      _csv = _csv.map(({ address, amount }, index) => ({
        index,
        address,
        amount,
        proof: _balanceTree.getProof(index, address, amount),
        status: "Not claimed",
      }));
      let csv_length = _csv.length;
      let jsonFile = JSON.stringify(
        _csv.map(({ address, amount }, index) => ({
          index,
          address,
          amount,
          proof: _balanceTree.getProof(index, address, amount),
          status: "Not claimed",
        }))
      );
      return {
        csv_length,
        _merkleRoot,
        _csv,
        jsonFile,
        date: date.getTime().toString(),
      };
    } catch (error) {
      console.log("hey csv 123", error);
      throw error;
    }
  };

  removeDuplicateAddress = async (file, decimal) => {
    try {
      let duplicateIds = file
        .map((e) => e["address"])
        .map((e, i, final) => final.indexOf(e) !== i && i)
        .filter((obj) => file[obj])
        .map((e) => file[e]);
      let unique = file
        .map((e) => e["address"])
        .map((e, i, final) => final.indexOf(e) === i && i)
        .filter((obj) => file[obj])
        .map((e) => file[e]);

      for (var key in duplicateIds) {
        unique.filter((item) => {
          if (item.address == duplicateIds[key].address) {
            item.amount = (
              Number(item.amount) + Number(duplicateIds[key].amount)
            ).toString();
          }
        });
      }
      unique = unique.map(({ address, amount }) => ({
        address: address.toLowerCase(),
        amount: this.toFixed(amount, decimal),
      }));
      return unique;
    } catch (e) {
      console.log("cathed error in duplicateAddresses", e);
      throw e;
    }
  };
}
