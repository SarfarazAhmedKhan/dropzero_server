import { extname } from "path";
const nodegit = require("nodegit");
const path = require("path");
const fileName = "test.txt";
const fileContent = "hello world";
const directoryName = "projects/dropzero_server";
const { Parser } = require("json2csv");
const json2csvParser = new Parser();
const fs = require("fs");

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

export const uploadFileToGit = async () => {
  try {
    // let get = await nodegit.Clone(
    //   "https://github.com/nodegit/nodegit",
    //   "./tmp"
    // );
    // console.log("get", get);
    // nodegit
    //   .Clone("https://github.com/nodegit/nodegit", "./tmp")
    //   // Look up this known commit.
    //   .then(function(repo) {
    //     console.log("repo", repo);
    //     // Use a known commit sha from this repository.
    //     return repo.getCommit("59b20b8d5c6ff8d09518454d4dd8b7b30f095ab5");
    //   })
    //   // Look up a specific file within that commit.
    //   .then(function(commit) {
    //     console.log("repo", commit);
    //     return commit.getEntry("README.md");
    //   })
    //   // Get the blob contents from the file.
    //   .then(function(entry) {
    //     console.log("repo", entry);
    //     // Patch the blob to contain a reference to the entry.
    //     return entry.getBlob().then(function(blob) {
    //       blob.entry = entry;
    //       return blob;
    //     });
    //   });
    // const repo = await nodegit.Repository.open(
    //   path.resolve(directoryName, "../../.git")
    // );
    let repo: any = "";
    nodegit.Repository.open(path.resolve(__dirname, "../../tmp"))
      .catch(function() {
        console.log("arguments =>", arguments);
      })
      .then(function(repoResult) {
        repo = repoResult;
        console.log("check result", repo);
        console.log("repo =>", repo.getStatus);
        return repo.getStatus();
      })
      .catch(function() {
        console.log("arguments 2 =>", arguments);
      });
    // console.log("check repo", repo);

    // await fs.promises.mkdir(path.join(repo.workdir(), directoryName), {
    //   recursive: true,
    // });

    // await fs.promises.writeFile(
    //   path.join(repo.workdir(), fileName),
    //   fileContent
    // );
    // await fs.promises.writeFile(
    //   path.join(repo.workdir(), directoryName, fileName),
    //   fileContent
    // );

    // const index = await repo.refreshIndex();

    // // this file is in the root of the directory and doesn't need a full path
    // await index.addByPath(fileName);
    // // this file is in a subdirectory and can use a relative path
    // await index.addByPath(path.posix.join(directoryName, fileName));
    // // this will write both files to the index
    // await index.write();

    // const oid = await index.writeTree();

    // const parent = await repo.getHeadCommit();
    // const author = nodegit.Signature.now(
    //   "SarfarazAhmedKhan",
    //   "sarfarazahmedkhankhan@gmail.com"
    // );
    // const committer = nodegit.Signature.now(
    //   "SarfarazAhmedKhan",
    //   "sarfarazahmedkhankhan@gmail.com"
    // );

    // const commitId = await repo.createCommit(
    //   "HEAD",
    //   author,
    //   committer,
    //   "message",
    //   oid,
    //   [parent]
    // );

    // console.log("New Commit: ", commitId);
  } catch (e) {
    console.log("check error now", e);
  }
};
