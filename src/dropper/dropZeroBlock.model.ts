import * as mongoose from "mongoose";
var timestamps = require("mongoose-timestamp");

export const DropZeroBlockSchema = new mongoose.Schema({
  currentBlockNumber: Number,
  pausedDropBlockNumber: Number,
  unPausedDropBlockNumber: Number,
});

export interface DropZeroBlock {
  currentBlockNumber: Number;
  pausedDropBlockNumber: Number;
  unPausedDropBlockNumber: Number;
}

DropZeroBlockSchema.plugin(timestamps);
