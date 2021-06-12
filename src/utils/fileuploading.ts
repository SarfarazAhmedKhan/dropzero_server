import { extname } from "path";
const { promisify } = require("util");
const path = require("path");
const { Parser } = require("json2csv");
const json2csvParser = new Parser();
const fs = require("fs");
const simpleGit = require("simple-git");
const git = simpleGit();
const shellJs = require("shelljs");
shellJs.cd("./");
const gitHubUrl = `https://${"blockzerolab@gmail.com"}:${
  process.env.password
}@github.com/${"blockzerolab"}/${"dropzero-drop-csvs"}`;

export const editFileName = (req, file, callback) => {
  try {
    const name = file.originalname.split(".")[0];
    const fileExtName = extname(file.originalname);
    const randomName = Array(4)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join("");
    callback(null, `${name}-${randomName}${fileExtName}`);
  } catch (error) {
    console.log("error", error);
  }
};

export const editCsvFileName = (file) => {
  try {
    const name = file;
    const randomName = Array(4)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join("");
    return randomName;
  } catch (error) {
    console.log("error", error);
  }
};

export const imageFileFilter = (res, file, callback) => {
  try {
    if (!file.originalname.match(/\.(csv)$/)) {
      return callback(new Error("Only csv files are allowed!"), false);
    }
    callback(null, true);
  } catch (error) {
    console.log("error==>", error);
  }
};

export const convertJsonToCsv = (data, token_name, date, id) => {
  try {
    let csv = JSON.parse(data);
    let filename =
      `${token_name + "(" + date + ")"}` + "_" + editCsvFileName(id);
    console.log("check filename now", filename);
    let refactor_data = csv.map(({ address, amount, status }, index) => ({
      index,
      address,
      amount,
      status,
    }));
    const csv_data = json2csvParser.parse(refactor_data);
    fs.writeFile(`${filename}.csv`, csv_data, "utf8", function(err) {
      if (err) {
        console.log(
          "Some error occured - file either not saved or corrupted file saved.",
          err
        );
      } else {
        console.log("It's saved!");
      }
    });
    return `${filename}.csv`;
  } catch (error) {
    console.log("error==>", error);
  }
};

export const movedFilePath = async (data, dropName, filePath) => {
  try {
    var x = new Date().toString().split(" ");
    let date = `${x[2] + " " + x[1] + " " + x[3]}`;
    let filename =
      `${dropName + "(" + date + ")"}` + "_" + editCsvFileName(data);
    console.log("check file==>", filename);
    let csv = data;
    console.log("check filename now", csv);
    let refactor_data = csv.map(({ address, amount, status }, index) => ({
      index,
      address,
      amount,
      status,
    }));
    const csv_data = json2csvParser.parse(refactor_data);
    fs.writeFile(`${filename}.csv`, csv_data, "utf8", function(err) {
      if (err) {
        console.log(
          "Some error occured - file either not saved or corrupted file saved.",
          err
        );
      } else {
        const currentPath = path.join("./", `${filename}.csv`);
        const newPath = path.join("./", filePath, `${filename}.csv`);
        fs.renameSync(currentPath, newPath);
        console.log("Successfully moved the file!");
        console.log("It's saved!");
        return;
      }
    });
  } catch (e) {
    console.log("hey", e);
  }
};

export const uploadFileToGit = async (csv, dropName) => {
  try {
    await movedFilePath(csv, dropName, "csvrecord");
    setTimeout(() => {
      git.addConfig("user.email", "blockzerolab@gmail.com");
      git.addConfig("user.name", "blockzerolab");

      git.addRemote("origin", gitHubUrl);
      // Add all files for commit
      git.add("csvrecord").then(
        (addSuccess) => {
          console.log(" hey success", addSuccess);
          git.commit("store csv record").then(
            (successCommit) => {
              console.log(successCommit);
              git.push("origin", "master").then(
                (success) => {
                  console.log("repo successfully pushed");
                },
                (failed) => {
                  console.log("repo push failed", failed);
                }
              );
            },
            (failed) => {
              console.log("failed commmit", failed);
            }
          );
        },
        (failedAdd) => {
          console.log("adding files failed", failedAdd);
        }
      );
    }, 2000);
  } catch (e) {
    console.log("check error now", e);
  }
};
