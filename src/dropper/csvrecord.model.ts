import * as mongoose from "mongoose";
const Schema = mongoose.Schema;
var timestamps = require("mongoose-timestamp");

export const CsvRecordSchema = new mongoose.Schema({
  dropperAddress: {
    type: Schema.Types.ObjectId,
    ref: "Dropper",
    require: false,
  },
  tokenAddress: String,
  pauseDrop: Boolean,
  fileName: String,
  totalAmount: Number,
  uniqueName: String,
  txnHash: String,
  dropName: {
    type: String,
    required: true,
  },
  status: String,
  withDraw: Boolean,
  startDate: Date,
  expired: Boolean,
  endDate: Date,
  merkleRoot: String,
  csv: String,
});

export interface CsvRecord {
  dropperAddress: {};
  dropName: String;
  pauseDrop: Boolean;
  tokenAddress: String;
  txnHash: String;
  uniqueName: String;
  fileName: String;
  totalAmount: Number;
  startDate: Date;
  expired: Boolean;
  withDraw: Boolean;
  endDate: Date;
  status: String;
  merkleRoot: String;
  csv: String;
}

CsvRecordSchema.plugin(timestamps);
