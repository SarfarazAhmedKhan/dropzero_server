import * as mongoose from "mongoose";
const Schema = mongoose.Schema;
var timestamps = require("mongoose-timestamp");

export const DropperSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
  },
  csv: [
    {
      record: {
        type: Schema.Types.ObjectId,
        ref: "CsvRecord",
        require: false,
      },
    },
  ],
});

export interface Dropper {
  walletAddress: string;
  csv: [];
}

DropperSchema.plugin(timestamps);
