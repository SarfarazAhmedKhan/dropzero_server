import * as mongoose from "mongoose";
const Schema = mongoose.Schema;
var timestamps = require("mongoose-timestamp");

export const UserSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  index: Number,
  amount: {
    type: Number,
    required: true,
  },
  startDate: Date,
  claimedDate: Date,
  dropName: String,
  endDate: Date,
  tokenAddress: String,
  txnHash: String,
  proof: {
    type: [String],
    required: true,
  },
  csvId: {
    type: Schema.Types.ObjectId,
    ref: "CsvRecord",
    require: false,
  },
  claimed: Boolean,
});

export interface User {
  address: string;
  amount: Number;
  dropName: String;
  claimedDate: Date;
  index: Number;
  startDate: Date;
  txnHash: String;
  tokenAddress: String;
  csvId: {};
  endDate: Date;
  proof: [];
  claimed: Boolean;
}

UserSchema.plugin(timestamps);
